// backend/src/models/addressModel.js

const db = require('../config/database');

const Address = {
  // Crear nueva dirección completa
  create: async (addressData) => {
    const {
      user_id,
      address_type, // 'billing' (fiscal) o 'shipping' (envío)
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
        between_streets, reference_point, is_fiscal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      user_id, 
      address_type || 'billing', // Por defecto la primera es billing
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

  // Obtener la dirección principal/fiscal de un usuario (Para el Dashboard)
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
  
  // Borrar todas las direcciones de un usuario (Para cuando se RECHAZA la cuenta)
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