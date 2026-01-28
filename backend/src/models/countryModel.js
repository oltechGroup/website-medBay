//backend/src/models/countryModel.js
const db = require('../config/database');

const Country = {
  // Obtener todos los países con paginación
  findAll: async (page = 1, limit = 10, search = '') => {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        code, 
        name, 
        currency_code,
        currency_name,
        currency_symbol,
        currency_decimals,
        exchange_rate,
        created_at, 
        updated_at
      FROM countries 
    `;
    
    const params = [];
    
    if (search) {
      query += ` WHERE name ILIKE $1 OR code ILIKE $1 OR currency_code ILIKE $1 `;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Convertir exchange_rate a número
    return result.rows.map(country => ({
      ...country,
      exchange_rate: parseFloat(country.exchange_rate),
      currency_decimals: parseInt(country.currency_decimals)
    }));
  },

  // 🔧 MÉTODO AGREGADO - CONTAR PAÍSES
  count: async (search = '') => {
    let query = `SELECT COUNT(*) FROM countries`;
    const params = [];
    
    if (search) {
      query += ` WHERE name ILIKE $1 OR code ILIKE $1 OR currency_code ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  },

  // Obtener país por código
  findByCode: async (code) => {
    const query = `
      SELECT 
        code, 
        name, 
        currency_code,
        currency_name,
        currency_symbol,
        currency_decimals,
        exchange_rate,
        created_at, 
        updated_at
      FROM countries 
      WHERE code = $1
    `;
    const result = await db.query(query, [code]);
    
    if (result.rows[0]) {
      return {
        ...result.rows[0],
        exchange_rate: parseFloat(result.rows[0].exchange_rate),
        currency_decimals: parseInt(result.rows[0].currency_decimals)
      };
    }
    return null;
  },

  // Crear nuevo país
  create: async (countryData) => {
    const { 
      code, 
      name, 
      currency_code, 
      currency_name, 
      currency_symbol, 
      currency_decimals = 2, 
      exchange_rate = 1.0 
    } = countryData;
    
    const query = `
      INSERT INTO countries (
        code, name, currency_code, currency_name, 
        currency_symbol, currency_decimals, exchange_rate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      code, name, currency_code, currency_name, 
      currency_symbol, currency_decimals, exchange_rate
    ]);
    
    if (result.rows[0]) {
      return {
        ...result.rows[0],
        exchange_rate: parseFloat(result.rows[0].exchange_rate),
        currency_decimals: parseInt(result.rows[0].currency_decimals)
      };
    }
    return null;
  },

  // Actualizar país
  update: async (code, countryData) => {
    const { 
      name, 
      currency_code, 
      currency_name, 
      currency_symbol, 
      currency_decimals, 
      exchange_rate 
    } = countryData;
    
    const query = `
      UPDATE countries 
      SET 
        name = $1, 
        currency_code = $2, 
        currency_name = $3,
        currency_symbol = $4,
        currency_decimals = $5,
        exchange_rate = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = $7
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, currency_code, currency_name, currency_symbol, 
      currency_decimals, exchange_rate, code
    ]);
    
    if (result.rows[0]) {
      return {
        ...result.rows[0],
        exchange_rate: parseFloat(result.rows[0].exchange_rate),
        currency_decimals: parseInt(result.rows[0].currency_decimals)
      };
    }
    return null;
  },

  // Eliminar país
  delete: async (code) => {
    const query = 'DELETE FROM countries WHERE code = $1';
    const result = await db.query(query, [code]);
    return result.rowCount > 0;
  },

  // Obtener estadísticas de países
  getStats: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_countries,
        COUNT(DISTINCT currency_code) as total_currencies,
        AVG(exchange_rate) as avg_exchange_rate,
        MIN(exchange_rate) as min_exchange_rate,
        MAX(exchange_rate) as max_exchange_rate
      FROM countries
    `;
    const result = await db.query(query);
    
    return {
      total_countries: parseInt(result.rows[0].total_countries),
      total_currencies: parseInt(result.rows[0].total_currencies),
      avg_exchange_rate: parseFloat(result.rows[0].avg_exchange_rate),
      min_exchange_rate: parseFloat(result.rows[0].min_exchange_rate),
      max_exchange_rate: parseFloat(result.rows[0].max_exchange_rate)
    };
  },

  // Buscar países por moneda
  findByCurrency: async (currencyCode) => {
    const query = `
      SELECT code, name, currency_symbol, exchange_rate
      FROM countries 
      WHERE currency_code = $1
      ORDER BY name
    `;
    const result = await db.query(query, [currencyCode]);
    
    return result.rows.map(country => ({
      ...country,
      exchange_rate: parseFloat(country.exchange_rate)
    }));
  },

  // ==========================================
  // 🚀 NUEVOS MÉTODOS PARA AUTOMATIZACIÓN
  // ==========================================

  // 1. Obtener lista de monedas únicas (para saber qué pedir a la API)
  getDistinctCurrencies: async () => {
    const query = `
      SELECT DISTINCT currency_code 
      FROM countries 
      WHERE currency_code IS NOT NULL AND currency_code != 'USD'
    `;
    // Excluimos USD porque es la moneda base y siempre vale 1.0
    const result = await db.query(query);
    return result.rows.map(row => row.currency_code);
  },

  // 2. Actualizar tasa de cambio por moneda (Bulk Update)
  updateRateByCurrency: async (currencyCode, newRate) => {
    const query = `
      UPDATE countries 
      SET 
        exchange_rate = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE currency_code = $2
    `;
    // $1: Nueva tasa, $2: Código de moneda (ej: 'MXN')
    const result = await db.query(query, [newRate, currencyCode]);
    return result.rowCount; // Devuelve cuántos países fueron actualizados
  }
};

module.exports = Country;