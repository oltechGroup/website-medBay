const db = require('../config/database');

const Import = {
  // Crear un nuevo raw_upload
  createRawUpload: async (uploadData) => {
    const {
      supplier_id,
      filename,
      uploaded_by,
      file_path,
      file_hash,
      row_count,
      status,
      errors
    } = uploadData;
    
    const query = `
      INSERT INTO raw_uploads (
        supplier_id, filename, uploaded_by, file_path, file_hash, row_count, status, errors
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [supplier_id, filename, uploaded_by, file_path, file_hash, row_count, status, errors];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar estado de raw_upload
  updateRawUploadStatus: async (id, status, errors = null) => {
    const query = `
      UPDATE raw_uploads 
      SET status = $1, errors = $2
      WHERE id = $3
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [status, errors, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear raw_rows
  createRawRows: async (rawRows) => {
    const query = `
      INSERT INTO raw_rows (raw_upload_id, row_index, raw_data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    try {
      const results = [];
      for (const row of rawRows) {
        const values = [row.raw_upload_id, row.row_index, row.raw_data];
        const result = await db.query(query, values);
        results.push(result.rows[0]);
      }
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Obtener raw_uploads por proveedor
  findRawUploadsBySupplier: async (supplier_id) => {
    const query = `
      SELECT 
        ru.*,
        s.name as supplier_name,
        u.email as uploaded_by_email
      FROM raw_uploads ru
      LEFT JOIN suppliers s ON ru.supplier_id = s.id
      LEFT JOIN users u ON ru.uploaded_by = u.id
      WHERE ru.supplier_id = $1
      ORDER BY ru.created_at DESC
    `;
    
    try {
      const result = await db.query(query, [supplier_id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener raw_upload por ID con sus rows
  findRawUploadById: async (id) => {
    const uploadQuery = `
      SELECT 
        ru.*,
        s.name as supplier_name,
        u.email as uploaded_by_email
      FROM raw_uploads ru
      LEFT JOIN suppliers s ON ru.supplier_id = s.id
      LEFT JOIN users u ON ru.uploaded_by = u.id
      WHERE ru.id = $1
    `;
    
    const rowsQuery = `
      SELECT *
      FROM raw_rows
      WHERE raw_upload_id = $1
      ORDER BY row_index
    `;
    
    try {
      const uploadResult = await db.query(uploadQuery, [id]);
      const rowsResult = await db.query(rowsQuery, [id]);
      
      return {
        upload: uploadResult.rows[0],
        rows: rowsResult.rows
      };
    } catch (error) {
      throw error;
    }
  },

  // Crear o actualizar mapping template
  saveMappingTemplate: async (templateData) => {
    const {
      supplier_id,
      name,
      mappings,
      created_by
    } = templateData;
    
    // Primero verificar si ya existe un template con el mismo nombre para este proveedor
    const checkQuery = 'SELECT * FROM mapping_templates WHERE supplier_id = $1 AND name = $2';
    const existing = await db.query(checkQuery, [supplier_id, name]);
    
    if (existing.rows.length > 0) {
      // Actualizar template existente
      const updateQuery = `
        UPDATE mapping_templates 
        SET mappings = $1
        WHERE supplier_id = $2 AND name = $3
        RETURNING *
      `;
      const result = await db.query(updateQuery, [mappings, supplier_id, name]);
      return result.rows[0];
    } else {
      // Crear nuevo template
      const insertQuery = `
        INSERT INTO mapping_templates (supplier_id, name, mappings, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await db.query(insertQuery, [supplier_id, name, mappings, created_by]);
      return result.rows[0];
    }
  },

  // Obtener templates por proveedor
  findTemplatesBySupplier: async (supplier_id) => {
    const query = `
      SELECT 
        mt.*,
        u.email as created_by_email
      FROM mapping_templates mt
      LEFT JOIN users u ON mt.created_by = u.id
      WHERE mt.supplier_id = $1
      ORDER BY mt.created_at DESC
    `;
    
    try {
      const result = await db.query(query, [supplier_id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener template por ID
  findTemplateById: async (id) => {
    const query = 'SELECT * FROM mapping_templates WHERE id = $1';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear reporte de importación
  createImportReport: async (reportData) => {
    const {
      raw_upload_id,
      processed_rows,
      errors_count,
      expired_count,
      report_json
    } = reportData;
    
    const query = `
      INSERT INTO import_reports (raw_upload_id, processed_rows, errors_count, expired_count, report_json)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [raw_upload_id, processed_rows, errors_count, expired_count, report_json];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Import;