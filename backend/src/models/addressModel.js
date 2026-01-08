// backend/src/models/addressModel.js

const db = require('../config/database');

const Address = {
  // Crear nueva dirección
  create: async (addressData) => {
    const {
      user_id,
      address_type, // 'billing' o 'shipping'
      street,
      street_number,
      suite_number,
      colony,
      city,
      state,
      country,
      postal_code,
      between_streets,
      reference_point,
      is_fiscal
    } = addressData;

    const query = `
      INSERT INTO addresses (
        user_id, address_type, street, street_number, suite_number, 
        colony, city, state, country, postal_code, 
        between_streets, reference_point, is_fiscal, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `;

    const values = [
      user_id, 
      address_type || 'shipping', 
      street, 
      street_number, 
      suite_number, 
      colony, 
      city, 
      state, 
      country, 
      postal_code, 
      between_streets, 
      reference_point, 
      is_fiscal || false
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ NUEVO: Obtener todas las direcciones de un usuario (Separadas por tipo si es necesario)
  findAllByUserId: async (userId) => {
    const query = `
      SELECT * FROM addresses 
      WHERE user_id = $1 
      ORDER BY is_fiscal DESC, created_at DESC
    `;
    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener solo la dirección fiscal (Para validaciones rápidas)
  findFiscalByUserId: async (userId) => {
    const query = `
      SELECT * FROM addresses 
      WHERE user_id = $1 AND (is_fiscal = true OR address_type = 'billing')
      ORDER BY created_at ASC 
      LIMIT 1
    `;
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ NUEVO: Eliminar dirección por ID (Solo si pertenece al usuario)
  deleteById: async (id, userId) => {
    const query = 'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *';
    try {
      const result = await db.query(query, [id, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Borrar todas (Admin/Cleanup)
  deleteAllByUserId: async (userId) => {
    const query = 'DELETE FROM addresses WHERE user_id = $1';
    try {
      await db.query(query, [userId]);
      return true;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Address;