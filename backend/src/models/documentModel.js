const db = require('../config/database');

const Document = {
  // Crear un nuevo documento
  create: async (documentData) => {
    const {
      owner_type,
      owner_id,
      document_type,
      file_path,
      issued_date,
      expiry_date,
      status,
      notes
    } = documentData;
    
    const query = `
      INSERT INTO documents (
        owner_type, owner_id, document_type, file_path, issued_date, expiry_date, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [owner_type, owner_id, document_type, file_path, issued_date, expiry_date, status, notes];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los documentos
  findAll: async () => {
    const query = `
      SELECT 
        d.*,
        u.email as user_email,
        u.full_name as user_name,
        s.name as supplier_name
      FROM documents d
      LEFT JOIN users u ON d.owner_type = 'user' AND d.owner_id = u.id
      LEFT JOIN suppliers s ON d.owner_type = 'supplier' AND d.owner_id = s.id
      ORDER BY d.created_at DESC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener documento por ID
  findById: async (id) => {
    const query = `
      SELECT 
        d.*,
        u.email as user_email,
        u.full_name as user_name,
        s.name as supplier_name
      FROM documents d
      LEFT JOIN users u ON d.owner_type = 'user' AND d.owner_id = u.id
      LEFT JOIN suppliers s ON d.owner_type = 'supplier' AND d.owner_id = s.id
      WHERE d.id = $1
    `;
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener documentos por owner
  findByOwner: async (owner_type, owner_id) => {
    const query = `
      SELECT *
      FROM documents
      WHERE owner_type = $1 AND owner_id = $2
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [owner_type, owner_id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar estado de documento
  updateStatus: async (id, status, verified_by = null, notes = null) => {
    const query = `
      UPDATE documents 
      SET status = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP, notes = $3
      WHERE id = $4
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [status, verified_by, notes, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar documento
  delete: async (id) => {
    const query = 'DELETE FROM documents WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Document;