// backend/src/models/manufacturerModel.js

const db = require('../config/database');

const Manufacturer = {
  // Crear fabricante (AHORA CON country_id)
  create: async (manufacturerData) => {
    const { name, country, country_id } = manufacturerData;
    
    // Priorizar country_id si existe, sino usar country (para compatibilidad)
    const finalCountryId = country_id || (country ? await Manufacturer._getCountryCode(country) : null);
    
    const query = `
      INSERT INTO manufacturers (name, country, country_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [name, country, finalCountryId];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los fabricantes (AHORA CON JOIN a países)
  findAll: async () => {
    const query = `
      SELECT 
        m.*,
        c.name as country_name,
        c.code as country_code
      FROM manufacturers m
      LEFT JOIN countries c ON m.country_id = c.code
      ORDER BY m.name
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Buscar fabricante por nombre (case insensitive) - ACTUALIZADO
  findByName: async (name) => {
    const query = `
      SELECT 
        m.*,
        c.name as country_name,
        c.code as country_code
      FROM manufacturers m
      LEFT JOIN countries c ON m.country_id = c.code
      WHERE LOWER(m.name) = LOWER($1)
    `;
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar o crear fabricante (para importación) - ACTUALIZADO
  findOrCreate: async (manufacturerData) => {
    const { name, country, country_id } = manufacturerData;
    
    // Primero buscar si existe
    const existing = await Manufacturer.findByName(name);
    if (existing) {
      return existing;
    }
    
    // Si no existe, crear nuevo
    return await Manufacturer.create({ name, country, country_id });
  },

  // ===== NUEVOS MÉTODOS PARA LA INTEGRACIÓN =====
  
  // Obtener fabricante por ID
  findById: async (id) => {
    const query = `
      SELECT 
        m.*,
        c.name as country_name,
        c.code as country_code
      FROM manufacturers m
      LEFT JOIN countries c ON m.country_id = c.code
      WHERE m.id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar fabricante
  update: async (id, manufacturerData) => {
    const { name, country_id } = manufacturerData;
    const query = `
      UPDATE manufacturers 
      SET name = $1, country_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    try {
      const result = await db.query(query, [name, country_id, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTODOS AUXILIARES =====
  
  // Helper para obtener código de país desde nombre
  _getCountryCode: async (countryName) => {
    const query = 'SELECT code FROM countries WHERE LOWER(name) = LOWER($1)';
    try {
      const result = await db.query(query, [countryName]);
      return result.rows[0]?.code || null;
    } catch (error) {
      return null;
    }
  }
};

module.exports = Manufacturer;