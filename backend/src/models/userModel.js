const db = require('../config/database');

const User = {
  // Crear un nuevo usuario
  create: async (userData) => {
    const { email, password_hash, full_name, company_name, tax_id, country, verification_level } = userData;
    
    const query = `
      INSERT INTO users (email, password_hash, full_name, company_name, tax_id, country, verification_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [email, password_hash, full_name, company_name, tax_id, country, verification_level];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar usuario por email
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar usuario por ID
  findById: async (id) => {
    const query = 'SELECT id, email, full_name, company_name, verification_level, created_at FROM users WHERE id = $1';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los usuarios
  findAll: async () => {
    const query = 'SELECT id, email, full_name, company_name, verification_level, created_at FROM users';
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  
};

module.exports = User;