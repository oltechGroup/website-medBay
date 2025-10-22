const db = require('../config/database');  

const AvalaraTaxCode = {
  // Obtener todos los códigos fiscales
  findAll: async () => {
    const query = 'SELECT * FROM avalara_tax_codes ORDER BY code';
    const result = await db.query(query);
    return result.rows;
  },

  // Obtener código fiscal por ID
  findById: async (id) => {
    const query = 'SELECT * FROM avalara_tax_codes WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Crear nuevo código fiscal
  create: async (taxCodeData) => {
    const { code, description } = taxCodeData;
    const query = `
      INSERT INTO avalara_tax_codes (code, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [code, description]);
    return result.rows[0];
  },

  // Actualizar código fiscal
  update: async (id, taxCodeData) => {
    const { code, description } = taxCodeData;
    const query = `
      UPDATE avalara_tax_codes 
      SET code = $1, description = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [code, description, id]);
    return result.rows[0];
  },

  // Eliminar código fiscal
  delete: async (id) => {
    const query = 'DELETE FROM avalara_tax_codes WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
};

module.exports = AvalaraTaxCode;