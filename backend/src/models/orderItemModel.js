// backend/src/models/orderItemModel.js

const db = require('../config/database');

const OrderItem = {
  // Crear ítems (Se llama al crear la orden)
  create: async (itemsData) => {
    // itemsData es un array de objetos
    // Construimos una query dinámica para insertar múltiples filas
    const values = [];
    const placeholders = itemsData.map((item, index) => {
      const offset = index * 6; // 6 campos por item
      // ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)...
      values.push(
        item.order_id,
        item.product_lot_id,
        item.product_supplier_id,
        item.quantity,
        item.unit_price,
        item.line_total
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    }).join(', ');

    const query = `
      INSERT INTO order_items (
        order_id, product_lot_id, product_supplier_id, 
        quantity, unit_price, line_total
      )
      VALUES ${placeholders}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener ítems de una orden (CORREGIDO: p.description en vez de p.name)
  findByOrder: async (orderId) => {
    const query = `
      SELECT 
        oi.*,
        p.description as product_name,  
        p.global_sku,
        pl.lot_number,
        pl.expiry_date,
        ps.supplier_sku
      FROM order_items oi
      LEFT JOIN product_lots pl ON oi.product_lot_id = pl.id
      LEFT JOIN product_suppliers ps ON oi.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      WHERE oi.order_id = $1
    `;
    
    try {
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = OrderItem;