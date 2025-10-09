const db = require('../config/database');

const OrderItem = {
  // Crear items de orden
  create: async (orderItems) => {
    const query = `
      INSERT INTO order_items (
        order_id, product_supplier_id, product_lot_id, quantity, unit_price, line_total,
        requires_license, requires_prescription, was_discounted, original_price_amount, expiry_category_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    try {
      const results = [];
      for (const item of orderItems) {
        const values = [
          item.order_id,
          item.product_supplier_id,
          item.product_lot_id,
          item.quantity,
          item.unit_price,
          item.line_total,
          item.requires_license || false,
          item.requires_prescription || false,
          item.was_discounted || false,
          item.original_price_amount,
          item.expiry_category_name
        ];
        
        const result = await db.query(query, values);
        results.push(result.rows[0]);
      }
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Obtener items por orden
  findByOrder: async (orderId) => {
    const query = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.global_sku,
        ps.supplier_sku,
        s.name as supplier_name,
        pl.lot_number,
        pl.expiry_date
      FROM order_items oi
      LEFT JOIN product_suppliers ps ON oi.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN product_lots pl ON oi.product_lot_id = pl.id
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