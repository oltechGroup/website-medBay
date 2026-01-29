// backend/src/models/importModel.js

const db = require('../config/database');
const XLSX = require('xlsx');

const ImportModel = {

  createQuickSupplier: async (name, country_code) => {
    const query = `INSERT INTO suppliers (name, country_code, is_active) VALUES ($1, $2, true) RETURNING id, name, country_code`;
    const result = await db.query(query, [name, country_code]);
    return result.rows[0];
  },

  getSupplierExchangeRate: async (supplier_id) => {
    // Obtenemos la tasa y el código, pero ahora también el símbolo para reportes
    const query = `
      SELECT c.exchange_rate, c.currency_code, c.currency_symbol 
      FROM suppliers s 
      JOIN countries c ON s.country_code = c.code 
      WHERE s.id = $1`;
    const result = await db.query(query, [supplier_id]);
    return result.rows[0] || { exchange_rate: 1, currency_code: 'USD', currency_symbol: '$' };
  },

  createUploadRecord: async ({ filename, path, supplier_id, sales_category, user_id }) => {
    const query = `INSERT INTO raw_uploads (filename, file_path, supplier_id, sales_category, uploaded_by, status) VALUES ($1, $2, $3, $4, $5, 'uploaded') RETURNING id`;
    const result = await db.query(query, [filename, path, supplier_id, sales_category, user_id]);
    const uploadId = result.rows[0].id;
    try {
      await db.query(`INSERT INTO import_progress (upload_id, user_id, status, current_operation, total_rows, processed_rows, error_messages) VALUES ($1, $2, 'uploaded', 'Esperando inicio...', 0, 0, '{"stats": {}, "errors": []}')`, [uploadId, user_id]);
    } catch (e) {}
    return uploadId;
  },

  getMappingTemplate: async (supplier_id) => {
    const query = `SELECT mappings FROM mapping_templates WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 1`;
    const result = await db.query(query, [supplier_id]);
    return result.rows[0] || { mappings: {} };
  },

  saveMappingTemplate: async (supplier_id, mappings) => {
    const query = `INSERT INTO mapping_templates (supplier_id, name, mappings) VALUES ($1, 'default', $2) ON CONFLICT (supplier_id, name) DO UPDATE SET mappings = $2, created_at = NOW()`;
    await db.query(query, [supplier_id, JSON.stringify(mappings)]);
  },

  cleanSupplierInventory: async (supplier_id, sales_category) => {
    let statusFilter = 'available';
    if (sales_category === 'near_expiry') statusFilter = 'near_expiry';
    if (sales_category === 'expired') statusFilter = 'expired';
    const query = `DELETE FROM product_lots WHERE product_supplier_id IN (SELECT id FROM product_suppliers WHERE supplier_id = $1) AND status = $2`;
    const result = await db.query(query, [supplier_id, statusFilter]);
    return result.rowCount;
  },

  // --- LÓGICA DE PROCESAMIENTO MASIVO (MOTOR ASÍNCRONO) ---

  executeImportProcess: async (upload_id, mappings) => {
    try {
      await db.query("UPDATE raw_uploads SET status = 'processing' WHERE id = $1", [upload_id]);
      
      const uploadRes = await db.query('SELECT * FROM raw_uploads WHERE id = $1', [upload_id]);
      const upload = uploadRes.rows[0];

      // 1. OBTENER TASA ACTUAL (EL CORAZÓN)
      // Se captura al inicio para garantizar consistencia en todo el lote
      const currencyData = await ImportModel.getSupplierExchangeRate(upload.supplier_id);
      
      // 2. FASE "PUENTE": Volcar Excel a raw_rows para manejar archivos de 35k+ sin saturar RAM
      await ImportModel.updateProgress(upload_id, { current_operation: 'Leyendo archivo masivo...', status: 'processing' });
      
      const workbook = XLSX.readFile(upload.file_path, { cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(sheet);
      const totalExcelRows = rawData.length;

      // Limpieza de seguridad: borrar datos previos de este upload si hubo un reintento fallido
      await db.query("DELETE FROM raw_rows WHERE raw_upload_id = $1", [upload_id]);

      // Insertar en raw_rows en batches (bloques) para velocidad
      const bridgeBatchSize = 500;
      for (let i = 0; i < rawData.length; i += bridgeBatchSize) {
        const chunk = rawData.slice(i, i + bridgeBatchSize);
        // Escapamos comillas simples en el JSON para evitar errores SQL
        const values = chunk.map((row, idx) => `('${upload_id}', ${i + idx}, '${JSON.stringify(row).replace(/'/g, "''")}')`).join(',');
        await db.query(`INSERT INTO raw_rows (raw_upload_id, row_index, raw_data) VALUES ${values}`);
      }

      await ImportModel.updateProgress(upload_id, { total_rows: totalExcelRows, current_operation: 'Iniciando procesamiento de datos...' });

      // 3. FASE PROCESAMIENTO: Consumir desde la base de datos (raw_rows)
      let processedCounter = 0;
      let globalStats = { created_lots: 0, created_products: 0, created_manufacturers: 0, skipped_rows: 0 };
      const allErrors = [];
      const processingBatchSize = 100; // Procesamos de 100 en 100 para no bloquear la BD

      while (processedCounter < totalExcelRows) {
        const rowsRes = await db.query(
          `SELECT id, raw_data, row_index FROM raw_rows WHERE raw_upload_id = $1 ORDER BY row_index ASC LIMIT $2 OFFSET $3`,
          [upload_id, processingBatchSize, processedCounter]
        );

        if (rowsRes.rows.length === 0) break;

        // Procesamos el lote actual
        const batchStats = await ImportModel.processBatch(rowsRes.rows, upload, currencyData, mappings, allErrors);
        
        // Actualizamos contadores globales
        globalStats.created_lots += batchStats.created_lots;
        globalStats.created_products += batchStats.created_products;
        globalStats.created_manufacturers += batchStats.created_manufacturers;
        globalStats.skipped_rows += batchStats.skipped;

        processedCounter += rowsRes.rows.length;

        // Reportar progreso al frontend
        await ImportModel.updateProgress(upload_id, { 
          processed_rows: processedCounter, 
          current_operation: `Procesando... (${Math.round((processedCounter/totalExcelRows)*100)}%)`,
          stats: globalStats
        });
      }

      // 4. LIMPIEZA FINAL DEL PUENTE
      // Borramos los datos temporales para no ocupar espacio en disco
      await db.query("DELETE FROM raw_rows WHERE raw_upload_id = $1", [upload_id]);

      const progressStatus = allErrors.length > 0 ? 'completed_with_errors' : 'completed';
      // Si hubo errores pero se crearon lotes, es un éxito parcial. Solo fallamos si no se creó NADA.
      const uploadStatus = (allErrors.length > 0 && globalStats.created_lots === 0) ? 'failed' : 'finished';
      
      // Guardamos solo los primeros 200 errores para no saturar el campo JSON
      const finalPayload = { errors: allErrors.slice(0, 200), stats: globalStats };

      await db.query(`UPDATE import_progress SET status = $1, current_operation = 'Finalizado', processed_rows = $2, error_messages = $3::jsonb, updated_at = NOW() WHERE upload_id = $4`, [progressStatus, totalExcelRows, JSON.stringify(finalPayload), upload_id]);
      await db.query('UPDATE raw_uploads SET status = $1 WHERE id = $2', [uploadStatus, upload_id]);

    } catch (error) {
      console.error("❌ Fatal Error en ImportModel:", error);
      await ImportModel.logFatalError(upload_id, error.message);
    }
  },

  processBatch: async (dbRows, upload, currencyData, mappings, errors) => {
    const client = await db.pool.connect();
    let stats = { created_lots: 0, created_products: 0, created_manufacturers: 0, skipped: 0 };

    try {
      await client.query('BEGIN');
      
      for (const rowObj of dbRows) {
        const item = rowObj.raw_data;
        const rowIndex = rowObj.row_index + 2; // +2 porque Excel tiene header y empieza en 1

        try {
          await client.query('SAVEPOINT row_processing');

          // --- LÓGICA DE MAPEOS FLEXIBLES (N/A) ---
          
          // 1. Descripción (CORAZÓN): Es obligatoria para crear el producto
          const description = mappings.descripcion === 'not_applicable' ? null : item[mappings.descripcion];
          if (!description) {
            throw new Error(`Fila ${rowIndex}: La descripción es obligatoria.`);
          }

          // 2. SKU Flexible: Si es 'not_applicable', generamos un SKU interno único
          let sku = mappings.codigo === 'not_applicable' ? null : String(item[mappings.codigo] || '').trim();
          if (!sku || mappings.codigo === 'not_applicable') {
            // Generamos SKU basado en hash de descripción + timestamp para evitar colisiones
            sku = `GEN-${Buffer.from(description).toString('base64').substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
          }

          // 3. Fabricante Flexible
          let manufacturerName = mappings.fabricante === 'not_applicable' ? 'No especificado' : String(item[mappings.fabricante] || 'No especificado').trim();

          // 4. Precio y Divisas
          let rawPrice = 0;
          if (mappings.precio !== 'not_applicable') {
            const priceStr = String(item[mappings.precio] || '0').replace(/[^0-9.]/g, '');
            rawPrice = parseFloat(priceStr) || 0;
          }
          
          // Conversión de Divisa (Trazabilidad)
          const exchangeRateUsed = currencyData.exchange_rate || 1;
          const priceUSD = rawPrice / exchangeRateUsed;

          // 5. Cantidad (CORRECCIÓN APLICADA: PERMITIMOS 0)
          const quantity = mappings.cantidad === 'not_applicable' ? 0 : parseInt(item[mappings.cantidad]) || 0;
          
          // NOTA: Se eliminó el bloqueo "if (quantity <= 0) continue". 
          // Ahora permitimos crear productos con stock 0 para fines de catálogo/cotización.

          // --- INSERCIONES EN CADENA ---

          // A. Asegurar Fabricante
          let makerId;
          const makerRes = await client.query('SELECT id FROM manufacturers WHERE name = $1', [manufacturerName]);
          if (makerRes.rows.length > 0) makerId = makerRes.rows[0].id;
          else {
            const newMaker = await client.query('INSERT INTO manufacturers (name) VALUES ($1) RETURNING id', [manufacturerName]);
            makerId = newMaker.rows[0].id;
            stats.created_manufacturers++;
          }

          // B. Asegurar Producto (Usamos SKU + Fabricante para evitar colisiones globales)
          let productId;
          const prodRes = await client.query('SELECT id FROM products WHERE global_sku = $1 AND manufacturer_id = $2', [sku, makerId]);
          if (prodRes.rows.length > 0) productId = prodRes.rows[0].id;
          else {
            const newProd = await client.query('INSERT INTO products (description, global_sku, manufacturer_id) VALUES ($1, $2, $3) RETURNING id', [description, sku, makerId]);
            productId = newProd.rows[0].id;
            stats.created_products++;
          }

          // C. Vincular Proveedor (product_suppliers)
          let psId;
          const psCheck = await client.query('SELECT id FROM product_suppliers WHERE supplier_id = $1 AND supplier_sku = $2', [upload.supplier_id, sku]);
          if (psCheck.rows.length > 0) psId = psCheck.rows[0].id;
          else {
            const supNameRes = await client.query('SELECT name FROM suppliers WHERE id=$1', [upload.supplier_id]);
            const psInsert = await client.query(
              `INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name) VALUES ($1, $2, $3, $4) RETURNING id`,
              [productId, upload.supplier_id, sku, supNameRes.rows[0]?.name || 'Import']
            );
            psId = psInsert.rows[0].id;
          }

          // D. Crear el Lote (Final)
          let lotStatus = upload.sales_category || 'available';
          
          // Si la cantidad es 0, el estado no puede ser 'available', forzamos lógica de negocio si es necesario,
          // o dejamos que el frontend lo maneje (como ya lo hace con "Agotado").
          // Dejaremos el status tal cual viene del upload para no interferir con la lógica de categorías.

          let expiryDate = null;
          if (mappings.fecha_caducidad !== 'not_applicable' && item[mappings.fecha_caducidad]) {
            const d = new Date(item[mappings.fecha_caducidad]);
            if (!isNaN(d.getTime())) expiryDate = d;
          }

          await client.query(
            `INSERT INTO product_lots (product_supplier_id, lot_number, quantity, price, status, expiry_date, received_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              psId, 
              `LOT-${Date.now()}-${Math.floor(Math.random()*10000)}`, // Generamos número de lote único
              quantity, 
              priceUSD, 
              lotStatus, 
              expiryDate
            ]
          );

          stats.created_lots++;
          await client.query('RELEASE SAVEPOINT row_processing');

        } catch (rowError) {
          await client.query('ROLLBACK TO SAVEPOINT row_processing');
          errors.push({ row: rowIndex, sku: item[mappings.codigo] || 'N/A', error: rowError.message });
          stats.skipped++;
        }
      }
      
      await client.query('COMMIT');
      return stats;

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  updateProgress: async (upload_id, data) => {
    const fields = []; const values = []; let idx = 1;
    if (data.total_rows !== undefined) { fields.push(`total_rows = $${idx++}`); values.push(data.total_rows); }
    if (data.processed_rows !== undefined) { fields.push(`processed_rows = $${idx++}`); values.push(data.processed_rows); }
    if (data.current_operation) { fields.push(`current_operation = $${idx++}`); values.push(data.current_operation); }
    if (data.status) { fields.push(`status = $${idx++}`); values.push(data.status); }
    if (data.stats) { fields.push(`error_messages = $${idx++}::jsonb`); values.push(JSON.stringify({ stats: data.stats, errors: [] })); }
    if (fields.length === 0) return;
    values.push(upload_id);
    await db.query(`UPDATE import_progress SET ${fields.join(', ')}, updated_at = NOW() WHERE upload_id = $${idx}`, values);
  },

  getImportProgress: async (upload_id) => {
    const res = await db.query('SELECT * FROM import_progress WHERE upload_id = $1', [upload_id]);
    return res.rows[0];
  },

  getImportHistory: async () => {
    const query = `
      SELECT u.id, u.created_at, u.status, u.filename, s.name as supplier, u.sales_category,
             COALESCE(ip.processed_rows, 0) as processed_rows, COALESCE(ip.total_rows, 0) as total_rows, ip.error_messages
      FROM raw_uploads u
      LEFT JOIN suppliers s ON u.supplier_id = s.id
      LEFT JOIN import_progress ip ON u.id::text = ip.upload_id
      ORDER BY u.created_at DESC LIMIT 50`;
    const res = await db.query(query);
    return res.rows;
  },

  getGlobalStats: async () => {
    const today = await db.query("SELECT COUNT(*) FROM raw_uploads WHERE created_at::date = CURRENT_DATE");
    const total = await db.query("SELECT COUNT(*) FROM raw_uploads");
    const last = await db.query(`SELECT u.created_at, s.name as supplier, u.sales_category FROM raw_uploads u LEFT JOIN suppliers s ON u.supplier_id = s.id ORDER BY u.created_at DESC LIMIT 1`);
    return {
      imports_today: parseInt(today.rows[0]?.count || 0),
      total_imports: parseInt(total.rows[0]?.count || 0),
      last_import_date: last.rows[0]?.created_at || null,
      last_import_supplier: last.rows[0]?.supplier || '-',
      last_import_category: last.rows[0]?.sales_category || '-'
    };
  },

  logFatalError: async (upload_id, message) => {
    try { 
      await db.query(`UPDATE import_progress SET status = 'error', error_messages = $1::jsonb WHERE upload_id = $2`, 
      [JSON.stringify({ errors: [{ error: message }] }), upload_id]); 
    } catch(e){}
    await db.query("UPDATE raw_uploads SET status = 'failed' WHERE id = $1", [upload_id]);
  }
};

module.exports = ImportModel;