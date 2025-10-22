const db = require('../config/database');  

const Currency = {
  // Obtener todas las monedas
  findAll: async () => {
    const query = 'SELECT * FROM currencies ORDER BY name';
    const result = await db.query(query);
    return result.rows;
  },

  // Obtener moneda por código
  findByCode: async (code) => {
    const query = 'SELECT * FROM currencies WHERE code = $1';
    const result = await db.query(query, [code]);
    return result.rows[0];
  },

  // Crear nueva moneda
  create: async (currencyData) => {
    const { code, name, symbol, decimals } = currencyData;
    const query = `
      INSERT INTO currencies (code, name, symbol, decimals)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [code, name, symbol, decimals]);
    return result.rows[0];
  },

  // Actualizar moneda
  update: async (code, currencyData) => {
    const { name, symbol, decimals } = currencyData;
    const query = `
      UPDATE currencies 
      SET name = $1, symbol = $2, decimals = $3
      WHERE code = $4
      RETURNING *
    `;
    const result = await db.query(query, [name, symbol, decimals, code]);
    return result.rows[0];
  },

  // Eliminar moneda
  delete: async (code) => {
    const query = 'DELETE FROM currencies WHERE code = $1';
    const result = await db.query(query, [code]);
    return result.rowCount > 0;
  }
};

module.exports = Currency;