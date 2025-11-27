// backend/src/models/categoryModel.js

const db = require('../config/database');

const Category = {
  // Crear categoría (SIN SLUG)
  create: async (categoryData) => {
    const { name, parent_id, description } = categoryData;
    
    const query = `
      INSERT INTO categories (name, parent_id, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [name, parent_id, description];
    
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

  // ✅ NUEVO: Buscar categoría por nombre (REEMPLAZA findByNameOrSlug)
  findByName: async (name) => {
    const query = 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)';
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ NUEVO: Buscar categoría por ID
  findById: async (id) => {
    const query = `
      SELECT c.*, p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id 
      WHERE c.id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ NUEVO: Actualizar categoría
  update: async (id, categoryData) => {
    const { name, parent_id, description } = categoryData;
    
    const query = `
      UPDATE categories 
      SET name = $1, parent_id = $2, description = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [name, parent_id, description, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ NUEVO: Eliminar categoría
  delete: async (id) => {
    const query = 'DELETE FROM categories WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // ✅ ACTUALIZADO: Buscar o crear categoría (SIN SLUG)
  findOrCreate: async (categoryData) => {
    const { name, parent_id, description } = categoryData;
    
    const existing = await Category.findByName(name);
    if (existing) {
      return existing;
    }
    
    return await Category.create({ name, parent_id, description });
  },

  // 🆕 NUEVOS MÉTODOS PARA ASIGNACIÓN MASIVA (NO AFECTA LO EXISTENTE)
  
  // Asignación masiva de productos a categorías
  batchAssignProducts: async (categoryIds, productIds) => {
    if (!categoryIds.length || !productIds.length) {
      throw new Error('Se requieren al menos una categoría y un producto');
    }

    // Construir consulta para insertar todas las combinaciones
    const values = [];
    let valueIndex = 1;
    let valueStrings = [];

    categoryIds.forEach(categoryId => {
      productIds.forEach(productId => {
        values.push(categoryId, productId);
        valueStrings.push(`($${valueIndex}, $${valueIndex + 1})`);
        valueIndex += 2;
      });
    });

    const query = `
      INSERT INTO product_categories (category_id, product_id)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (category_id, product_id) DO NOTHING
      RETURNING category_id, product_id
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error en asignación masiva:', error);
      throw error;
    }
  },

  // Obtener categorías sin productos
  findWithoutProducts: async () => {
    const query = `
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id NOT IN (
        SELECT DISTINCT category_id 
        FROM product_categories
      )
      ORDER BY c.name
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo categorías sin productos:', error);
      throw error;
    }
  },

  // Obtener estadísticas de categorías
  getStats: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_categories,
        COUNT(DISTINCT pc.category_id) as categories_with_products,
        (COUNT(*) - COUNT(DISTINCT pc.category_id)) as categories_without_products
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
    `;
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error obteniendo estadísticas de categorías:', error);
      throw error;
    }
  }

};

module.exports = Category;