//backend/src/models/manufacturerModel.js

const db = require('../config/database');

const Manufacturer = {
  create: async (manufacturerData) => {
    const { name, contact_info, website } = manufacturerData;
    const query = `
      INSERT INTO manufacturers (name, contact_info, website)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [name, contact_info || {}, website || null]);
    return result.rows[0];
  },

  // OPTIMIZADO: Paginación y Búsqueda en Servidor
  findAll: async ({ limit, offset, search }) => {
    let query = `
      SELECT id, name, contact_info, website, created_at, updated_at
      FROM manufacturers
    `;
    const params = [];
    
    // Filtro de búsqueda
    if (search) {
      query += ` WHERE name ILIKE $1 OR contact_info->>'email' ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY name ASC`;
    
    // Paginación
    if (limit !== null && offset !== null) {
      const limitIdx = params.length + 1;
      const offsetIdx = params.length + 2;
      query += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
      params.push(limit, offset);
    }

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error en Manufacturer.findAll:', error);
      throw error;
    }
  },

  // NUEVO: Contar total para paginación
  count: async (search) => {
    let query = `SELECT COUNT(*) FROM manufacturers`;
    const params = [];

    if (search) {
      query += ` WHERE name ILIKE $1 OR contact_info->>'email' ILIKE $1`;
      params.push(`%${search}%`);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  },

  findByName: async (name) => {
    const query = `SELECT * FROM manufacturers WHERE LOWER(name) = LOWER($1)`;
    const result = await db.query(query, [name]);
    return result.rows[0];
  },

  findById: async (id) => {
    const query = `SELECT * FROM manufacturers WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  update: async (id, manufacturerData) => {
    const { name, contact_info, website } = manufacturerData;
    const query = `
      UPDATE manufacturers 
      SET name = $1, contact_info = $2, website = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(query, [name, contact_info || {}, website || null, id]);
    return result.rows[0];
  },

  delete: async (id) => {
    const query = 'DELETE FROM manufacturers WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = Manufacturer;