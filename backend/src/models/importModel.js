// backend/src/models/importModel.js

const db = require('../config/database');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const IMAGE_DOWNLOAD_CONCURRENCY = 5;

const ImportModel = {

  createQuickSupplier: async (name, country_code) => {
    const query = `INSERT INTO suppliers (name, country_code, is_active) VALUES ($1, $2, true) RETURNING id, name, country_code`;
    const result = await db.query(query, [name, country_code]);
    return result.rows[0];
  },

  getSupplierExchangeRate: async (supplier_id) => {
    const query = `
      SELECT c.exchange_rate, c.currency_code, c.currency_symbol 
      FROM suppliers s 
      JOIN countries c ON s.country_code = c.code 
      WHERE s.id = $1`;
    const result = await db.query(query, [supplier_id]);
    return result.rows[0] || { exchange_rate: 1, currency_code: 'USD', currency_symbol: '$' };
  },

  // ✅ MEJORADO: Inicialización más robusta para evitar errores al reanudar sesión
  createUploadRecord: async ({ filename, path, supplier_id, sales_category, user_id }) => {
    const query = `INSERT INTO raw_uploads (filename, file_path, supplier_id, sales_category, uploaded_by, status) VALUES ($1, $2, $3, $4, $5, 'uploaded') RETURNING id`;
    const result = await db.query(query, [filename, path, supplier_id, sales_category, user_id]);
    const uploadId = result.rows[0].id;
    
    // Inicializamos el progreso inmediatamente con valores base para que la UI no falle
    await db.query(`
      INSERT INTO import_progress (upload_id, user_id, status, current_operation, total_rows, processed_rows, error_messages) 
      VALUES ($1, $2, 'uploaded', 'Ready to process', 0, 0, $3::jsonb)`, 
      [uploadId, user_id, JSON.stringify({ stats: { created_lots: 0, created_products: 0, created_manufacturers: 0 }, errors: [] })]
    );
    
    return uploadId;
  },

  // ✅ NUEVA FUNCIÓN: ENTRADA MANUAL (CIRUGÍA DE PRECISIÓN)
  // Procesa un solo ítem con la misma lógica que el Excel pero de forma directa
  createManualEntry: async (data) => {
    const { 
      supplier_id, sales_category, user_id, 
      description, sku, manufacturer, quantity, price, expiry_date,
      image_url, local_image_path // Puede venir uno u otro
    } = data;

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Registro en raw_uploads para que aparezca en el historial
      const uploadRes = await client.query(
        `INSERT INTO raw_uploads (filename, supplier_id, sales_category, uploaded_by, status, file_path) 
         VALUES ($1, $2, $3, $4, 'finished', 'manual_entry') RETURNING id`,
        ['Manual Entry - ' + description.substring(0, 20), supplier_id, sales_category, user_id]
      );
      const uploadId = uploadRes.rows[0].id;

      // 2. Lógica de Negocio (Idéntica a processBatch)
      const currencyData = await ImportModel.getSupplierExchangeRate(supplier_id);
      const exchangeRateUsed = currencyData.exchange_rate || 1;
      const priceUSD = price / exchangeRateUsed;

      // SKU Automático si no viene
      let finalSku = (sku && sku.trim() !== '') ? sku.trim() : 
        `MAN-${Buffer.from(description).toString('base64').substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      let manufacturerName = manufacturer || 'No especificado';

      // A. Fabricante
      let makerId;
      const makerRes = await client.query('SELECT id FROM manufacturers WHERE name = $1', [manufacturerName]);
      if (makerRes.rows.length > 0) makerId = makerRes.rows[0].id;
      else {
        const newMaker = await client.query('INSERT INTO manufacturers (name) VALUES ($1) RETURNING id', [manufacturerName]);
        makerId = newMaker.rows[0].id;
      }

      // B. Producto
      let productId;
      const prodRes = await client.query('SELECT id FROM products WHERE global_sku = $1 AND manufacturer_id = $2', [finalSku, makerId]);
      if (prodRes.rows.length > 0) productId = prodRes.rows[0].id;
      else {
        const newProd = await client.query('INSERT INTO products (description, global_sku, manufacturer_id) VALUES ($1, $2, $3) RETURNING id', [description, finalSku, makerId]);
        productId = newProd.rows[0].id;
      }

      // C. Imagen (Dual: Local o URL)
      if (local_image_path) {
          const fileName = path.basename(local_image_path);
          const webPath = `/uploads/images/${fileName}`;
          await client.query(
            `INSERT INTO product_images (product_id, image_url, image_name, is_primary, created_by) VALUES ($1, $2, $3, true, $4)`,
            [productId, webPath, fileName, user_id]
          );
      } else if (image_url && image_url.startsWith('http')) {
          // Si es URL, usamos la función de descarga existente después del commit
          // La agregamos a una cola simulada
          setTimeout(() => {
            ImportModel.downloadAndSaveImage({ productId, rawUrl: image_url, sku: finalSku, uploaderId: user_id });
          }, 1000);
      }

      // D. Proveedor
      let psId;
      const psCheck = await client.query('SELECT id FROM product_suppliers WHERE supplier_id = $1 AND supplier_sku = $2', [supplier_id, finalSku]);
      if (psCheck.rows.length > 0) psId = psCheck.rows[0].id;
      else {
        const supNameRes = await client.query('SELECT name FROM suppliers WHERE id=$1', [supplier_id]);
        const psInsert = await client.query(
          `INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name) VALUES ($1, $2, $3, $4) RETURNING id`,
          [productId, supplier_id, finalSku, supNameRes.rows[0]?.name || 'Manual Entry']
        );
        psId = psInsert.rows[0].id;
      }

      // E. Lote
      let lotStatus = sales_category === 'regular' ? 'available' : sales_category;
      await client.query(
        `INSERT INTO product_lots (product_supplier_id, lot_number, quantity, price, status, expiry_date, received_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [psId, `MAN-LOT-${Date.now()}`, quantity, priceUSD, lotStatus, expiry_date || null]
      );

      // 3. Registrar progreso final para el historial
      const stats = { created_lots: 1, created_products: prodRes.rows.length > 0 ? 0 : 1, created_manufacturers: makerRes.rows.length > 0 ? 0 : 1 };
      await client.query(`
        INSERT INTO import_progress (upload_id, user_id, status, current_operation, total_rows, processed_rows, error_messages) 
        VALUES ($1, $2, 'completed', 'Manual entry created', 1, 1, $3::jsonb)`, 
        [uploadId, user_id, JSON.stringify({ stats, errors: [] })]
      );

      await client.query('COMMIT');
      return { success: true, upload_id: uploadId };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    let statusFilter = sales_category === 'regular' ? 'available' : sales_category;
    const query = `DELETE FROM product_lots WHERE product_supplier_id IN (SELECT id FROM product_suppliers WHERE supplier_id = $1) AND status = $2`;
    const result = await db.query(query, [supplier_id, statusFilter]);
    return result.rowCount;
  },

  // --- LÓGICA DE PROCESAMIENTO MASIVO (INALTERADA) ---

  executeImportProcess: async (upload_id, mappings) => {
    try {
      await db.query("UPDATE raw_uploads SET status = 'processing' WHERE id = $1", [upload_id]);
      const uploadRes = await db.query('SELECT * FROM raw_uploads WHERE id = $1', [upload_id]);
      const upload = uploadRes.rows[0];
      const currencyData = await ImportModel.getSupplierExchangeRate(upload.supplier_id);
      
      await ImportModel.updateProgress(upload_id, { current_operation: 'Reading massive file...', status: 'processing' });
      
      const workbook = XLSX.readFile(upload.file_path, { cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(sheet);
      const totalExcelRows = rawData.length;

      await db.query("DELETE FROM raw_rows WHERE raw_upload_id = $1", [upload_id]);

      const bridgeBatchSize = 1000; 
      for (let i = 0; i < rawData.length; i += bridgeBatchSize) {
        const chunk = rawData.slice(i, i + bridgeBatchSize);
        const values = chunk.map((row, idx) => `('${upload_id}', ${i + idx}, '${JSON.stringify(row).replace(/'/g, "''")}')`).join(',');
        await db.query(`INSERT INTO raw_rows (raw_upload_id, row_index, raw_data) VALUES ${values}`);
        await new Promise(resolve => setImmediate(resolve));
      }

      await ImportModel.updateProgress(upload_id, { total_rows: totalExcelRows, current_operation: 'Starting fast process...' });

      let processedCounter = 0;
      let globalStats = { created_lots: 0, created_products: 0, created_manufacturers: 0, skipped_rows: 0 };
      const allErrors = [];
      const processingBatchSize = 200; 

      while (processedCounter < totalExcelRows) {
        const rowsRes = await db.query(
          `SELECT id, raw_data, row_index FROM raw_rows WHERE raw_upload_id = $1 ORDER BY row_index ASC LIMIT $2 OFFSET $3`,
          [upload_id, processingBatchSize, processedCounter]
        );

        if (rowsRes.rows.length === 0) break;

        const { stats: batchStats, imageQueue } = await ImportModel.processBatch(rowsRes.rows, upload, currencyData, mappings, allErrors);
        
        globalStats.created_lots += batchStats.created_lots;
        globalStats.created_products += batchStats.created_products;
        globalStats.created_manufacturers += batchStats.created_manufacturers;
        globalStats.skipped_rows += batchStats.skipped;

        if (imageQueue.length > 0) await ImportModel.processImageQueue(imageQueue);

        processedCounter += rowsRes.rows.length;

        await ImportModel.updateProgress(upload_id, { 
          processed_rows: processedCounter, 
          current_operation: `Processing... (${Math.round((processedCounter/totalExcelRows)*100)}%)`,
          stats: globalStats
        });

        await new Promise(resolve => setImmediate(resolve));
      }

      await db.query("DELETE FROM raw_rows WHERE raw_upload_id = $1", [upload_id]);
      const progressStatus = allErrors.length > 0 ? 'completed_with_errors' : 'completed';
      const uploadStatus = (allErrors.length > 0 && globalStats.created_lots === 0) ? 'failed' : 'finished';
      const finalPayload = { errors: allErrors.slice(0, 200), stats: globalStats };

      await db.query(`UPDATE import_progress SET status = $1, current_operation = 'Completed', processed_rows = $2, error_messages = $3::jsonb, updated_at = NOW() WHERE upload_id = $4`, [progressStatus, totalExcelRows, JSON.stringify(finalPayload), upload_id]);
      await db.query('UPDATE raw_uploads SET status = $1 WHERE id = $2', [uploadStatus, upload_id]);

    } catch (error) {
      console.error("❌ Fatal Error in ImportModel:", error);
      await ImportModel.logFatalError(upload_id, error.message);
    }
  },

  processBatch: async (dbRows, upload, currencyData, mappings, errors) => {
    const client = await db.pool.connect();
    let stats = { created_lots: 0, created_products: 0, created_manufacturers: 0, skipped: 0 };
    let imageQueue = []; 

    try {
      await client.query('BEGIN');
      for (const rowObj of dbRows) {
        const item = rowObj.raw_data;
        const rowIndex = rowObj.row_index + 2;

        try {
          await client.query('SAVEPOINT row_processing');
          const description = mappings.descripcion === 'not_applicable' ? null : item[mappings.descripcion];
          if (!description) throw new Error(`Row ${rowIndex}: Description is required.`);

          let sku = mappings.codigo === 'not_applicable' ? null : String(item[mappings.codigo] || '').trim();
          if (!sku || mappings.codigo === 'not_applicable') {
            sku = `GEN-${Buffer.from(description).toString('base64').substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
          }

          let manufacturerName = mappings.fabricante === 'not_applicable' ? 'No especificado' : String(item[mappings.fabricante] || 'No especificado').trim();
          let rawPrice = 0;
          if (mappings.precio !== 'not_applicable') {
            const priceStr = String(item[mappings.precio] || '0').replace(/[^0-9.]/g, '');
            rawPrice = parseFloat(priceStr) || 0;
          }
          
          const exchangeRateUsed = currencyData.exchange_rate || 1;
          const priceUSD = rawPrice / exchangeRateUsed;
          const quantity = mappings.cantidad === 'not_applicable' ? 0 : parseInt(item[mappings.cantidad]) || 0;

          let makerId;
          const makerRes = await client.query('SELECT id FROM manufacturers WHERE name = $1', [manufacturerName]);
          if (makerRes.rows.length > 0) makerId = makerRes.rows[0].id;
          else {
            const newMaker = await client.query('INSERT INTO manufacturers (name) VALUES ($1) RETURNING id', [manufacturerName]);
            makerId = newMaker.rows[0].id;
            stats.created_manufacturers++;
          }

          let productId;
          const prodRes = await client.query('SELECT id FROM products WHERE global_sku = $1 AND manufacturer_id = $2', [sku, makerId]);
          if (prodRes.rows.length > 0) productId = prodRes.rows[0].id;
          else {
            const newProd = await client.query('INSERT INTO products (description, global_sku, manufacturer_id) VALUES ($1, $2, $3) RETURNING id', [description, sku, makerId]);
            productId = newProd.rows[0].id;
            stats.created_products++;
          }

          if (mappings.imagen_url && mappings.imagen_url !== 'not_applicable') {
            const rawUrl = item[mappings.imagen_url];
            if (rawUrl && typeof rawUrl === 'string' && (rawUrl.startsWith('http'))) {
              const imgCheck = await client.query('SELECT 1 FROM product_images WHERE product_id = $1 LIMIT 1', [productId]);
              if (imgCheck.rowCount === 0) imageQueue.push({ productId, rawUrl, sku, uploaderId: upload.uploaded_by });
            }
          }

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

          let lotStatus = upload.sales_category === 'regular' ? 'available' : upload.sales_category;
          let expiryDate = null;
          if (mappings.fecha_caducidad !== 'not_applicable' && item[mappings.fecha_caducidad]) {
            const d = new Date(item[mappings.fecha_caducidad]);
            if (!isNaN(d.getTime())) expiryDate = d;
          }

          await client.query(
            `INSERT INTO product_lots (product_supplier_id, lot_number, quantity, price, status, expiry_date, received_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [psId, `LOT-${Date.now()}-${Math.floor(Math.random()*10000)}`, quantity, priceUSD, lotStatus, expiryDate]
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
      return { stats, imageQueue };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  processImageQueue: async (queue) => {
    for (let i = 0; i < queue.length; i += IMAGE_DOWNLOAD_CONCURRENCY) {
      const chunk = queue.slice(i, i + IMAGE_DOWNLOAD_CONCURRENCY);
      await Promise.all(chunk.map(async (task) => {
        try { await ImportModel.downloadAndSaveImage(task); } catch (err) {}
      }));
    }
  },

  downloadAndSaveImage: async ({ productId, rawUrl, sku, uploaderId }) => {
    const extMatch = rawUrl.match(/\.(jpg|jpeg|png|webp|gif)/i);
    const ext = extMatch ? extMatch[0] : '.jpg';
    const filename = `imp-${sku.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}${ext}`;
    const localDir = path.join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    const localPath = path.join(localDir, filename);
    const webPath = `/uploads/images/${filename}`;

    return new Promise((resolve, reject) => {
      const protocol = rawUrl.startsWith('https') ? https : http;
      const request = protocol.get(rawUrl, (response) => {
        if (response.statusCode === 200) {
          const file = fs.createWriteStream(localPath);
          response.pipe(file);
          file.on('finish', async () => {
            file.close();
            try {
              await db.query(
                `INSERT INTO product_images (product_id, image_url, image_name, is_primary, display_order, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [productId, webPath, filename, true, 0, uploaderId]
              );
              resolve();
            } catch (dbErr) { reject(dbErr); }
          });
        } else reject(new Error(`Status Code: ${response.statusCode}`));
      });
      request.on('error', (err) => { fs.unlink(localPath, () => {}); reject(err); });
      request.setTimeout(15000, () => { request.destroy(); reject(new Error('Timeout')); });
    });
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