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

  // ✅ NUEVA FUNCIÓN: Paginación robusta con búsqueda y tie-breaker
  findPaginated: async ({ page = 1, limit = 10, searchTerm = '' }) => {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    // Filtro de búsqueda por nombre o descripción
    if (searchTerm) {
      whereConditions.push(`(c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
      params.push(`%${searchTerm}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 1. Obtener el total para la paginación
    const countQuery = `SELECT COUNT(*) FROM categories c ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // 2. Obtener los datos con JOIN para el nombre del padre
    // ✅ Añadimos c.id como tie-breaker para un orden determinista
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT c.*, p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id 
      ${whereClause}
      ORDER BY c.name ASC, c.id ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    try {
      const result = await db.query(dataQuery, dataParams);
      return {
        categories: result.rows,
        pagination: {
          total: totalItems,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalItems / limit)
        }
      };
    } catch (error) {
      console.error('Error en findPaginated categories:', error);
      throw error;
    }
  },

  // Obtener todas las categorías (útil para selectores y el árbol)
  findAll: async () => {
    const query = `
      SELECT c.*, p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id 
      ORDER BY c.name ASC, c.id ASC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Buscar categoría por nombre
  findByName: async (name) => {
    const query = 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)';
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar categoría por ID
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

  // Actualizar categoría
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

  // Eliminar categoría
  delete: async (id) => {
    const query = 'DELETE FROM categories WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar o crear categoría (SIN SLUG)
  findOrCreate: async (categoryData) => {
    const { name, parent_id, description } = categoryData;
    
    const existing = await Category.findByName(name);
    if (existing) {
      return existing;
    }
    
    return await Category.create({ name, parent_id, description });
  },

  // Asignación masiva de productos a categorías (Mantenido por integridad)
  batchAssignProducts: async (categoryIds, productIds) => {
    if (!categoryIds.length || !productIds.length) {
      throw new Error('Se requieren al menos una categoría y un producto');
    }

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