//backend/src/models/importModel.js

const db = require('../config/database');
const XLSX = require('xlsx');

const ImportModel = {

  createQuickSupplier: async (name, country_code) => {
    const query = `INSERT INTO suppliers (name, country_code, is_active) VALUES ($1, $2, true) RETURNING id, name, country_code`;
    const result = await db.query(query, [name, country_code]);
    return result.rows[0];
  },

  getSupplierExchangeRate: async (supplier_id) => {
    const query = `SELECT c.exchange_rate, c.currency_code FROM suppliers s JOIN countries c ON s.country_code = c.code WHERE s.id = $1`;
    const result = await db.query(query, [supplier_id]);
    return result.rows[0] || { exchange_rate: 1, currency_code: 'USD' };
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

  executeImportProcess: async (upload_id, mappings) => {
    try {
      await db.query("UPDATE raw_uploads SET status = 'processing' WHERE id = $1", [upload_id]);
      
      const uploadRes = await db.query('SELECT * FROM raw_uploads WHERE id = $1', [upload_id]);
      const upload = uploadRes.rows[0];
      const { exchange_rate } = await ImportModel.getSupplierExchangeRate(upload.supplier_id);
      
      const workbook = XLSX.readFile(upload.file_path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(sheet);
      const totalExcelRows = rawData.length;

      await ImportModel.updateProgress(upload_id, { 
        total_rows: totalExcelRows, 
        current_operation: 'Analizando y validando...',
        status: 'processing',
        processed_rows: 0
      });

      const consolidatedData = new Map();
      const validationErrors = [];
      let skippedRowsCount = 0;

      rawData.forEach((row, index) => {
        const rowIndex = index + 2; 
        const rawSku = row[mappings.codigo];
        const rawDesc = row[mappings.descripcion];

        if (!rawSku || !rawDesc) {
            let missing = [];
            if (!rawSku) missing.push('SKU');
            if (!rawDesc) missing.push('Descripción');
            validationErrors.push({ row_index: rowIndex, error: `Fila omitida: Falta ${missing.join(' y ')}`, data: row });
            skippedRowsCount++;
            return;
        }

        const sku = String(rawSku).trim();
        const desc = String(rawDesc).trim();
        let priceStr = String(row[mappings.precio] || '0').replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr) || 0;
        const qty = parseInt(row[mappings.cantidad]) || 0;
        
        if (qty <= 0) return; 

        const maker = String(row[mappings.fabricante] || '').trim() || 'No disponible';
        const expiry = row[mappings.fecha_caducidad]; 
        const img = mappings.imagen_url ? String(row[mappings.imagen_url] || '').trim() : null;

        const key = `${sku}|${desc}|${price}|${expiry}|${maker}`;

        if (consolidatedData.has(key)) {
          const existing = consolidatedData.get(key);
          existing.quantity += qty;
          existing.originalRowsCount += 1;
        } else {
          consolidatedData.set(key, {
            sku, description: desc, price, quantity: qty, expiry, manufacturer: maker, image_url: img,
            originalRowsCount: 1
          });
        }
      });

      let processedTotalCounter = skippedRowsCount;
      const allErrors = [...validationErrors];
      const batchSize = 50;
      let batch = [];
      
      let globalStats = { 
          created_lots: 0, 
          created_products: 0, 
          created_manufacturers: 0,
          merged_rows: 0,
          skipped_rows: skippedRowsCount 
      };

      const uniqueItems = Array.from(consolidatedData.values());

      for (const item of uniqueItems) {
        batch.push(item);
        if (batch.length >= batchSize) {
          const batchStats = await ImportModel.processBatch(batch, upload, exchange_rate, allErrors);
          globalStats.created_lots += batchStats.created_lots;
          globalStats.created_products += batchStats.created_products;
          globalStats.created_manufacturers += batchStats.created_manufacturers;
          const rowsInBatch = batch.reduce((sum, i) => sum + i.originalRowsCount, 0);
          globalStats.merged_rows += (rowsInBatch - batch.length);
          processedTotalCounter += rowsInBatch;
          await ImportModel.updateProgress(upload_id, { 
            processed_rows: processedTotalCounter, 
            current_operation: `Procesando... (${Math.round((processedTotalCounter/totalExcelRows)*100)}%)`,
            stats: globalStats
          });
          batch = [];
        }
      }

      if (batch.length > 0) {
        const batchStats = await ImportModel.processBatch(batch, upload, exchange_rate, allErrors);
        globalStats.created_lots += batchStats.created_lots;
        globalStats.created_products += batchStats.created_products;
        globalStats.created_manufacturers += batchStats.created_manufacturers;
        const rowsInBatch = batch.reduce((sum, i) => sum + i.originalRowsCount, 0);
        globalStats.merged_rows += (rowsInBatch - batch.length);
        processedTotalCounter += rowsInBatch;
      }

      const finalProcessedCount = totalExcelRows; 
      const progressStatus = allErrors.length > 0 ? 'completed_with_errors' : 'completed';
      const uploadStatus = (allErrors.length > 0 && globalStats.created_lots === 0) ? 'failed' : 'finished';
      const finalPayload = { errors: allErrors.slice(0, 200), stats: globalStats };

      await db.query(`UPDATE import_progress SET status = $1, current_operation = 'Finalizado', processed_rows = $2, error_messages = $3::jsonb, updated_at = NOW() WHERE upload_id = $4`, [progressStatus, finalProcessedCount, JSON.stringify(finalPayload), upload_id]);
      await db.query('UPDATE raw_uploads SET status = $1 WHERE id = $2', [uploadStatus, upload_id]);

    } catch (error) {
      console.error("Fatal Error:", error);
      await ImportModel.logFatalError(upload_id, error.message);
    }
  },

  processBatch: async (batch, upload, exchange_rate, errors) => {
    const client = await db.pool.connect();
    let stats = { created_lots: 0, created_products: 0, created_manufacturers: 0 };

    try {
      await client.query('BEGIN');
      for (const item of batch) {
        try {
          await client.query('SAVEPOINT row_processing');

          let makerId;
          const makerRes = await client.query('SELECT id FROM manufacturers WHERE name = $1', [item.manufacturer]);
          if (makerRes.rows.length > 0) makerId = makerRes.rows[0].id;
          else {
            try {
                const newMaker = await client.query('INSERT INTO manufacturers (name) VALUES ($1) RETURNING id', [item.manufacturer]);
                makerId = newMaker.rows[0].id;
                stats.created_manufacturers++;
            } catch (e) {
                const existing = await client.query('SELECT id FROM manufacturers WHERE name = $1', [item.manufacturer]);
                makerId = existing.rows[0]?.id;
            }
          }

          let productId;
          const prodRes = await client.query('SELECT id FROM products WHERE global_sku = $1 AND manufacturer_id = $2', [item.sku, makerId]);
          if (prodRes.rows.length > 0) productId = prodRes.rows[0].id;
          else {
             const newProd = await client.query('INSERT INTO products (description, global_sku, manufacturer_id) VALUES ($1, $2, $3) RETURNING id', [item.description, item.sku, makerId]);
             productId = newProd.rows[0].id;
             stats.created_products++;
          }
          
          if (item.image_url) {
             const imgCheck = await client.query('SELECT id FROM product_images WHERE product_id = $1 AND image_url = $2', [productId, item.image_url]);
             if (imgCheck.rows.length === 0) {
                await client.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, true)', [productId, item.image_url]);
             }
          }

          let psId;
          const psCheck = await client.query('SELECT id FROM product_suppliers WHERE supplier_id = $1 AND supplier_sku = $2', [upload.supplier_id, item.sku]);
          if (psCheck.rows.length > 0) psId = psCheck.rows[0].id;
          else {
             const supNameRes = await client.query('SELECT name FROM suppliers WHERE id=$1', [upload.supplier_id]);
             const supplierName = supNameRes.rows[0]?.name || 'Unknown';
             const psInsert = await client.query(`INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name) VALUES ($1, $2, $3, $4) RETURNING id`, [productId, upload.supplier_id, item.sku, supplierName]);
             psId = psInsert.rows[0].id;
          }

          const priceUSD = item.price / (exchange_rate || 1); 
          let finalDate = new Date();
          if (item.expiry) {
             if (typeof item.expiry === 'number') finalDate = new Date(Math.round((item.expiry - 25569)*86400*1000));
             else { const parsed = new Date(item.expiry); if (!isNaN(parsed.getTime())) finalDate = parsed; }
          }
          let lotStatus = upload.sales_category === 'near_expiry' ? 'near_expiry' : (upload.sales_category === 'expired' ? 'expired' : 'available');

          await client.query(`INSERT INTO product_lots (product_supplier_id, lot_number, quantity, price, status, expiry_date, received_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [psId, `LOT-${Date.now()}-${Math.floor(Math.random()*100000)}`, item.quantity, priceUSD, lotStatus, finalDate]);
          stats.created_lots++;
          await client.query('RELEASE SAVEPOINT row_processing');

        } catch (rowError) {
          await client.query('ROLLBACK TO SAVEPOINT row_processing');
          let msg = rowError.message;
          if (msg.includes('value too long')) msg = 'Dato demasiado largo';
          if (msg.includes('syntax input')) msg = 'Formato inválido';
          errors.push({ sku: item.sku, error: msg });
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

  // CORRECCIÓN CRÍTICA: CASTING UUID A TEXT
  getImportHistory: async () => {
    const query = `
      SELECT 
        u.id, u.created_at, u.status,
        COALESCE(u.filename, 'Archivo desconocido') as filename,
        COALESCE(s.name, 'Proveedor desconocido') as supplier, 
        COALESCE(u.sales_category, 'regular') as sales_category,
        COALESCE(ip.processed_rows, 0) as processed_rows,
        COALESCE(ip.total_rows, 0) as total_rows,
        ip.error_messages
      FROM raw_uploads u
      LEFT JOIN suppliers s ON u.supplier_id = s.id
      -- AQUÍ ESTÁ LA MAGIA: u.id::text cast para coincidir con upload_id varchar
      LEFT JOIN import_progress ip ON u.id::text = ip.upload_id
      ORDER BY u.created_at DESC 
      LIMIT 50
    `;
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
    try { await db.query(`UPDATE import_progress SET status = 'error', error_messages = $1::jsonb WHERE upload_id = $2`, [JSON.stringify({ errors: [{ error: message }] }), upload_id]); } catch(e){}
    await db.query("UPDATE raw_uploads SET status = 'failed' WHERE id = $1", [upload_id]);
  }
};

module.exports = ImportModel;