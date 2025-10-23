const db = require('../config/database');

const Manufacturer = {
  // Crear fabricante (COMPATIBILIDAD DUAL)
  create: async (manufacturerData) => {
    const { name, country_id } = manufacturerData;
    
    // Obtener nombre del país si se proporciona country_id
    let countryName = null;
    if (country_id) {
      const countryQuery = 'SELECT name FROM countries WHERE code = $1';
      try {
        const countryResult = await db.query(countryQuery, [country_id]);
        countryName = countryResult.rows[0]?.name || null;
      } catch (error) {
        console.error('Error al obtener nombre del país:', error);
      }
    }

    const query = `
      INSERT INTO manufacturers (name, country, country_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [name, countryName, country_id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.create:', error);
      throw error;
    }
  },

  // Obtener todos los fabricantes (COMPATIBILIDAD DUAL)
  findAll: async () => {
    const query = `
      SELECT 
        m.*,
        COALESCE(c.name, m.country, 'País no especificado') as country_name,
        COALESCE(c.code, m.country_id) as country_code
      FROM manufacturers m
      LEFT JOIN countries c ON m.country_id = c.code
      ORDER BY m.name
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en Manufacturer.findAll:', error);
      throw error;
    }
  },

  // Buscar fabricante por nombre (COMPATIBILIDAD DUAL)
  findByName: async (name) => {
    const query = `
      SELECT 
        m.*,
        COALESCE(c.name, m.country, 'País no especificado') as country_name,
        COALESCE(c.code, m.country_id) as country_code
      FROM manufacturers m
      LEFT JOIN countries c ON m.country_id = c.code
      WHERE LOWER(m.name) = LOWER($1)
    `;
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.findByName:', error);
      throw error;
    }
  },

  // Obtener fabricante por ID (COMPATIBILIDAD DUAL)
  findById: async (id) => {
    const query = `
      SELECT 
        m.*,
        COALESCE(c.name, m.country, 'País no especificado') as country_name,
        COALESCE(c.code, m.country_id) as country_code
      FROM manufacturers m
      LEFT JOIN countries c ON m.country_id = c.code
      WHERE m.id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.findById:', error);
      throw error;
    }
  },

  // Actualizar fabricante (COMPATIBILIDAD DUAL) - CORREGIDO: sin updated_at
  update: async (id, manufacturerData) => {
    const { name, country_id } = manufacturerData;
    
    // Obtener nombre del país si se proporciona country_id
    let countryName = null;
    if (country_id) {
      const countryQuery = 'SELECT name FROM countries WHERE code = $1';
      try {
        const countryResult = await db.query(countryQuery, [country_id]);
        countryName = countryResult.rows[0]?.name || null;
      } catch (error) {
        console.error('Error al obtener nombre del país:', error);
      }
    }

    const query = `
      UPDATE manufacturers 
      SET name = $1, country = $2, country_id = $3
      WHERE id = $4
      RETURNING *
    `;
    try {
      const result = await db.query(query, [name, countryName, country_id, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.update:', error);
      throw error;
    }
  },

  // Eliminar fabricante
  delete: async (id) => {
    const query = 'DELETE FROM manufacturers WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.delete:', error);
      throw error;
    }
  }
};

module.exports = Manufacturer;