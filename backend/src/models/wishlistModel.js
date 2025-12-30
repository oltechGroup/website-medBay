// backend/src/models/wishlistModel.js

const db = require('../config/database');

const Wishlist = {
  // ✅ Agregar a favoritos (Producto General)
  add: async (userId, productId) => {
    const query = `
      INSERT INTO wishlist_items (user_id, product_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, product_id) 
      DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows[0];
  },

  // ✅ Eliminar de favoritos
  remove: async (userId, productId) => {
    const query = `
      DELETE FROM wishlist_items 
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows[0];
  },

  // ✅ Obtener Wishlist Completa
  getByUser: async (userId) => {
    const query = `
      SELECT 
        w.id as wishlist_item_id,
        w.product_id,
        w.created_at as added_at,
        
        -- Datos del Producto
        p.description as product_name,
        p.global_sku,
        m.name as manufacturer_name,
        
        -- Imagen Principal
        (
          SELECT image_url 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.is_primary DESC, pi.created_at DESC 
          LIMIT 1
        ) as product_image,

        -- Saber si hay stock disponible (suma de todos los lotes activos)
        (
          SELECT COALESCE(SUM(pl.quantity), 0)
          FROM product_lots pl
          JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
          WHERE ps.product_id = p.id 
          AND pl.status IN ('available', 'near_expiry', 'expired')
        ) as total_stock

      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // ✅ Verificar si un producto está en favoritos (para pintar el corazón)
  checkStatus: async (userId, productId) => {
    const query = `SELECT 1 FROM wishlist_items WHERE user_id = $1 AND product_id = $2`;
    const result = await db.query(query, [userId, productId]);
    return !!result.rows[0]; // Retorna true/false
  }
};

module.exports = Wishlist;