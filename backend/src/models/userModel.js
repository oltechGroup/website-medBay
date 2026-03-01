// backend/src/models/userModel.js

const db = require('../config/database');

const User = {
  // Crear un nuevo usuario (Sin cambios)
  create: async (userData) => {
    const { 
      email, password_hash, full_name, company_name, tax_id, country, verification_level, phone 
    } = userData;
    
    const account_status = 'pending';

    const query = `
      INSERT INTO users (
        email, password_hash, full_name, company_name, tax_id, country, verification_level, phone, account_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [email, password_hash, full_name, company_name, tax_id, country, verification_level, phone, account_status];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar usuario por email (Sin cambios, ya trae todo con el *)
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ MODIFICADO: Se agregó supplier_id al SELECT
  findById: async (id) => {
    const query = `
      SELECT id, email, full_name, company_name, verification_level, account_status, phone, created_at, supplier_id 
      FROM users 
      WHERE id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ MODIFICADO: Se agregó supplier_id al SELECT
  findAll: async () => {
    const query = `
      SELECT id, email, full_name, company_name, verification_level, account_status, created_at, supplier_id 
      FROM users 
      ORDER BY created_at DESC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar estado (Para aprobar)
  updateStatus: async (id, status) => {
    const query = `
      UPDATE users 
      SET account_status = $1 
      WHERE id = $2 
      RETURNING id, email, account_status
    `;
    try {
      const result = await db.query(query, [status, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar usuario físicamente (Para rechazar)
  delete: async (id) => {
    // Nota: Si tienes ON DELETE CASCADE en tus llaves foráneas en Postgres,
    // esto borrará automáticamente sus documentos y notificaciones.
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = User;