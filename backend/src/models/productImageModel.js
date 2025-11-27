// backend/src/models/productImageModel.js
const db = require('../config/database');

const ProductImage = {
  create: async (imageData) => {
    const { product_id, image_url, image_name, is_primary = false, display_order = 0, created_by } = imageData;
    const query = `
      INSERT INTO product_images (product_id, image_url, image_name, is_primary, display_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [product_id, image_url, image_name, is_primary, display_order, created_by];
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  findByProductId: async (product_id) => {
    const query = `
      SELECT * FROM product_images 
      WHERE product_id = $1 
      ORDER BY is_primary DESC, display_order ASC, created_at DESC
    `;
    try {
      const result = await db.query(query, [product_id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // ✅ NUEVO MÉTODO: Necesario para que funcione setPrimary en el controlador
  findById: async (id) => {
    const query = 'SELECT * FROM product_images WHERE id = $1';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  setAsPrimary: async (image_id, product_id) => {
    try {
      await db.query('BEGIN'); // Iniciar transacción para seguridad
      
      // 1. Quitar primary de todas
      await db.query(
        'UPDATE product_images SET is_primary = false WHERE product_id = $1',
        [product_id]
      );
      
      // 2. Poner primary a la elegida
      const result = await db.query(
        'UPDATE product_images SET is_primary = true WHERE id = $1 RETURNING *',
        [image_id]
      );

      await db.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error in setAsPrimary:', error);
      throw error;
    }
  },
  
  delete: async (image_id) => {
    const query = 'DELETE FROM product_images WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [image_id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  getPrimaryByProductId: async (product_id) => {
    const query = 'SELECT * FROM product_images WHERE product_id = $1 AND is_primary = true LIMIT 1';
    try {
      const result = await db.query(query, [product_id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  countProductsWithoutImages: async () => {
    const query = `
      SELECT COUNT(*) as count
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
      )
    `;
    try {
      const result = await db.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
};

module.exports = ProductImage;