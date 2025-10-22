const db = require('../config/database');  

const Country = {
  // Obtener todos los países
  findAll: async () => {
    const query = `
      SELECT 
        c.code, 
        c.name, 
        c.currency_code, 
        c.tax_rules, 
        c.created_at, 
        c.updated_at,
        cr.name as currency_name,
        cr.symbol as currency_symbol
      FROM countries c
      LEFT JOIN currencies cr ON c.currency_code = cr.code
      ORDER BY c.name
    `;
    const result = await db.query(query);
    return result.rows;
  },

  // Obtener país por código
  findByCode: async (code) => {
    const query = `
      SELECT 
        c.code, 
        c.name, 
        c.currency_code, 
        c.tax_rules, 
        c.created_at, 
        c.updated_at,
        cr.name as currency_name,
        cr.symbol as currency_symbol
      FROM countries c
      LEFT JOIN currencies cr ON c.currency_code = cr.code
      WHERE c.code = $1
    `;
    const result = await db.query(query, [code]);
    return result.rows[0];
  },

  // Crear nuevo país
  create: async (countryData) => {
    const { code, name, currency_code, tax_rules } = countryData;
    const query = `
      INSERT INTO countries (code, name, currency_code, tax_rules)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [code, name, currency_code, tax_rules]);
    return result.rows[0];
  },

  // Actualizar país
  update: async (code, countryData) => {
    const { name, currency_code, tax_rules } = countryData;
    const query = `
      UPDATE countries 
      SET name = $1, currency_code = $2, tax_rules = $3
      WHERE code = $4
      RETURNING *
    `;
    const result = await db.query(query, [name, currency_code, tax_rules, code]);
    return result.rows[0];
  },

  // Eliminar país
  delete: async (code) => {
    const query = 'DELETE FROM countries WHERE code = $1';
    const result = await db.query(query, [code]);
    return result.rowCount > 0;
  }
};

module.exports = Country;