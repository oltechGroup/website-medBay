// backend/src/models/cartModel.js

const db = require('../config/database');

const Cart = {
  // ✅ Agregar al carrito (o actualizar cantidad si ya existe)
  addToCart: async (userId, lotId, quantity) => {
    const query = `
      INSERT INTO cart_items (user_id, product_lot_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id, product_lot_id) 
      DO UPDATE SET 
        quantity = cart_items.quantity + $3,
        updated_at = NOW()
      RETURNING *
    `;
    const values = [userId, lotId, quantity];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // ✅ Obtener Carrito Completo (Actualizado con unit_of_measure)
  getCart: async (userId) => {
    const query = `
      SELECT 
        ci.id as cart_item_id,
        ci.quantity as cart_quantity,
        ci.product_lot_id,
        
        -- Datos del Lote
        pl.product_supplier_id,
        pl.lot_number,
        pl.expiry_date,
        pl.price as unit_price,
        pl.quantity as available_stock,
        pl.status as lot_status,
        pl.unit_of_measure, -- 🚀 NUEVO: Extraído de product_lots
        
        -- Datos del Producto
        p.id as product_id,
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
        ) as product_image

      FROM cart_items ci
      JOIN product_lots pl ON ci.product_lot_id = pl.id
      JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      JOIN products p ON ps.product_id = p.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // ✅ Actualizar Cantidad
  updateQuantity: async (cartItemId, quantity) => {
    const query = `
      UPDATE cart_items 
      SET quantity = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [quantity, cartItemId]);
    return result.rows[0];
  },

  // ✅ Eliminar un ítem
  removeItem: async (cartItemId) => {
    const query = 'DELETE FROM cart_items WHERE id = $1 RETURNING *';
    const result = await db.query(query, [cartItemId]);
    return result.rows[0];
  },

  // ✅ Vaciar carrito
  clearCart: async (userId) => {
    const query = 'DELETE FROM cart_items WHERE user_id = $1';
    await db.query(query, [userId]);
    return true;
  },

  // ✅ Verificar stock
  checkStock: async (lotId) => {
    const query = 'SELECT quantity FROM product_lots WHERE id = $1';
    const result = await db.query(query, [lotId]);
    return result.rows[0];
  }
};

module.exports = Cart;