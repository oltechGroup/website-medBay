//backend/src/models/manufacturerModel.js

const db = require('../config/database');

const Manufacturer = {
  // Crear fabricante (SIMPLIFICADO - SIN PAÍSES)
  create: async (manufacturerData) => {
    const { name, contact_info, website } = manufacturerData;
    
    const query = `
      INSERT INTO manufacturers (name, contact_info, website)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      name, 
      contact_info || {}, 
      website || null
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.create:', error);
      throw error;
    }
  },

  // Obtener todos los fabricantes (SIMPLIFICADO - SIN PAÍSES)
  findAll: async () => {
    const query = `
      SELECT 
        id,
        name,
        contact_info,
        website,
        created_at,
        updated_at
      FROM manufacturers 
      ORDER BY name
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en Manufacturer.findAll:', error);
      throw error;
    }
  },

  // Buscar fabricante por nombre (SIMPLIFICADO)
  findByName: async (name) => {
    const query = `
      SELECT 
        id,
        name,
        contact_info,
        website,
        created_at,
        updated_at
      FROM manufacturers 
      WHERE LOWER(name) = LOWER($1)
    `;
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.findByName:', error);
      throw error;
    }
  },

  // Obtener fabricante por ID (SIMPLIFICADO)
  findById: async (id) => {
    const query = `
      SELECT 
        id,
        name,
        contact_info,
        website,
        created_at,
        updated_at
      FROM manufacturers 
      WHERE id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.findById:', error);
      throw error;
    }
  },

  // Actualizar fabricante (SIMPLIFICADO - SIN PAÍSES)
  update: async (id, manufacturerData) => {
    const { name, contact_info, website } = manufacturerData;

    const query = `
      UPDATE manufacturers 
      SET 
        name = $1, 
        contact_info = $2, 
        website = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [
      name, 
      contact_info || {}, 
      website || null, 
      id
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Manufacturer.update:', error);
      throw error;
    }
  },

  // Eliminar fabricante (MANTENIDO)
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