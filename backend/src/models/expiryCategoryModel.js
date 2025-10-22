const db = require('../config/database');

const ExpiryCategory = {
  create: async (categoryData) => {
    const { name, description, days_threshold, discount_percentage, is_active = true, sort_order = 0 } = categoryData;

    const query = `
      INSERT INTO expiry_categories (name, description, days_threshold, discount_percentage, is_active, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [name, description, days_threshold, discount_percentage, is_active, sort_order];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  findAll: async () => {
    const query = 'SELECT * FROM expiry_categories ORDER BY sort_order ASC, name ASC';
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  findById: async (id) => {
    const query = 'SELECT * FROM expiry_categories WHERE id = $1';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  findByName: async (name) => {
    const query = 'SELECT * FROM expiry_categories WHERE LOWER(name) = LOWER($1)';
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  update: async (id, categoryData) => {
    const { name, description, days_threshold, discount_percentage, is_active, sort_order } = categoryData;

    const query = `
      UPDATE expiry_categories 
      SET name = $1, description = $2, days_threshold = $3, discount_percentage = $4, 
          is_active = $5, sort_order = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [name, description, days_threshold, discount_percentage, is_active, sort_order, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    const query = 'DELETE FROM expiry_categories WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = ExpiryCategory;