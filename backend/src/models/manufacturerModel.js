const db = require('../config/database');

const Manufacturer = {
  // Crear fabricante
  create: async (manufacturerData) => {
    const { name, country } = manufacturerData;
    
    const query = `
      INSERT INTO manufacturers (name, country)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const values = [name, country];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los fabricantes
  findAll: async () => {
    const query = 'SELECT * FROM manufacturers ORDER BY name';
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

   // Buscar fabricante por nombre (case insensitive)
  findByName: async (name) => {
    const query = 'SELECT * FROM manufacturers WHERE LOWER(name) = LOWER($1)';
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar o crear fabricante (para importación)
  findOrCreate: async (manufacturerData) => {
    const { name, country } = manufacturerData;
    
    // Primero buscar si existe
    const existing = await Manufacturer.findByName(name);
    if (existing) {
      return existing; // Devolver el existente
    }
    
    // Si no existe, crear nuevo
    return await Manufacturer.create({ name, country });
  }
  
};

module.exports = Manufacturer;