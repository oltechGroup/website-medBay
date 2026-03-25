// backend/src/models/orderItemModel.js

const db = require('../config/database');

const OrderItem = {
  // --- 1. CREAR ÍTEMS (Actualizado para incluir Unit of Measure) ---
  create: async (itemsData) => {
    const values = [];
    // 🚀 AJUSTE DE PRECISIÓN: Ahora manejamos 7 campos por ítem
    const placeholders = itemsData.map((item, index) => {
      const offset = index * 7; // Antes era 6
      values.push(
        item.order_id,
        item.product_lot_id,
        item.product_supplier_id,
        item.quantity,
        item.unit_price,
        item.line_total,
        item.unit_of_measure || 'pcs' // ✅ Nuevo campo: Packaging unit
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
    }).join(', ');

    const query = `
      INSERT INTO order_items (
        order_id, product_lot_id, product_supplier_id, 
        quantity, unit_price, line_total, unit_of_measure
      )
      VALUES ${placeholders}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error inserting order items:", error.message);
      throw error;
    }
  },

  // --- 2. OBTENER ÍTEMS (Con toda la metadata de UOM) ---
  findByOrder: async (orderId) => {
    const query = `
      SELECT 
        oi.*,
        -- ✅ TRUCO MAESTRO: 1. Busca en el catálogo. 2. Si no, busca en la cotización original.
        COALESCE(p.description, q.product_request->>'product_name', 'Producto Especial (Cotización)') as product_name,  
        COALESCE(p.global_sku, q.product_request->>'sku', 'N/A') as global_sku,
        
        -- Datos del Lote
        pl.lot_number,
        pl.expiry_date,
        
        -- Datos Específicos del Supplier-Producto
        ps.supplier_sku,
        
        -- DATOS DEL PROVEEDOR
        s.id as supplier_id,
        s.name as supplier_name,
        s.contact_email as supplier_contact, 
        s.country as supplier_country 

      FROM order_items oi
      JOIN orders ord ON oi.order_id = ord.id
      LEFT JOIN quotes q ON ord.quote_id = q.id
      LEFT JOIN product_lots pl ON oi.product_lot_id = pl.id
      LEFT JOIN product_suppliers ps ON oi.product_supplier_id = ps.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN products p ON ps.product_id = p.id
      
      WHERE oi.order_id = $1
    `;
    
    try {
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      console.error("Error detallado en findByOrder:", error.message);
      
      // Fallback protegido (incluyendo oi.* para traer unit_of_measure)
      const fallbackQuery = `
        SELECT 
          oi.*,
          COALESCE(p.description, q.product_request->>'product_name', 'Producto Especial (Cotización)') as product_name,
          COALESCE(p.global_sku, q.product_request->>'sku', 'N/A') as global_sku,
          pl.lot_number,
          pl.expiry_date
        FROM order_items oi
        JOIN orders ord ON oi.order_id = ord.id
        LEFT JOIN quotes q ON ord.quote_id = q.id
        LEFT JOIN product_lots pl ON oi.product_lot_id = pl.id
        LEFT JOIN product_suppliers ps ON oi.product_supplier_id = ps.id
        LEFT JOIN products p ON ps.product_id = p.id
        WHERE oi.order_id = $1
      `;
      const fallbackResult = await db.query(fallbackQuery, [orderId]);
      return fallbackResult.rows;
    }
  }
};

module.exports = OrderItem;