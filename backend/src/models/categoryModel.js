const db = require('../config/database');

const Category = {
  // Crear categoría
  create: async (categoryData) => {
    const { name, parent_id, slug, description } = categoryData;
    
    const query = `
      INSERT INTO categories (name, parent_id, slug, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [name, parent_id, slug, description];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las categorías
  findAll: async () => {
    const query = `
      SELECT c.*, p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id 
      ORDER BY c.name
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

    // Buscar categoría por nombre o slug
  findByNameOrSlug: async (name, slug) => {
    const query = 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1) OR LOWER(slug) = LOWER($2)';
    try {
      const result = await db.query(query, [name, slug]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar o crear categoría
  findOrCreate: async (categoryData) => {
    const { name, parent_id, slug, description } = categoryData;
    
    const existing = await Category.findByNameOrSlug(name, slug);
    if (existing) {
      return existing;
    }
    
    return await Category.create({ name, parent_id, slug, description });
  }

};

module.exports = Category;