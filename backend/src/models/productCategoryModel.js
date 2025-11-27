// backend/src/models/productCategoryModel.js
const db = require('../config/database');

const ProductCategory = {
  // Crear múltiples relaciones producto-categoría
  bulkCreate: async (productId, categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }

    try {
      // Crear placeholders para la consulta: ($1, $2), ($1, $3), etc.
      const values = categoryIds.map((categoryId, index) => 
        `($1, $${index + 2})`
      ).join(', ');

      const query = `
        INSERT INTO product_categories (product_id, category_id)
        VALUES ${values}
        RETURNING *
      `;

      const params = [productId, ...categoryIds];
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error en bulkCreate product_categories:', error);
      throw error;
    }
  },

  // Eliminar todas las relaciones de un producto
  deleteByProductId: async (productId) => {
    try {
      const query = 'DELETE FROM product_categories WHERE product_id = $1';
      await db.query(query, [productId]);
      return true;
    } catch (error) {
      console.error('Error en deleteByProductId:', error);
      throw error;
    }
  },

  // Obtener todas las categorías de un producto
  findByProductId: async (productId) => {
    try {
      const query = `
        SELECT c.* 
        FROM categories c
        INNER JOIN product_categories pc ON c.id = pc.category_id
        WHERE pc.product_id = $1
        ORDER BY c.name
      `;
      const result = await db.query(query, [productId]);
      return result.rows;
    } catch (error) {
      console.error('Error en findByProductId:', error);
      throw error;
    }
  },

  // Obtener los IDs de las categorías de un producto
  findCategoryIdsByProductId: async (productId) => {
    try {
      const query = 'SELECT category_id FROM product_categories WHERE product_id = $1';
      const result = await db.query(query, [productId]);
      return result.rows.map(row => row.category_id);
    } catch (error) {
      console.error('Error en findCategoryIdsByProductId:', error);
      throw error;
    }
  },

  // Verificar si existe una relación específica
  exists: async (productId, categoryId) => {
    try {
      const query = 'SELECT 1 FROM product_categories WHERE product_id = $1 AND category_id = $2';
      const result = await db.query(query, [productId, categoryId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error en exists:', error);
      throw error;
    }
  }
};

module.exports = ProductCategory;