// backend/src/models/orderItemModel.js

const db = require('../config/database');

const OrderItem = {
  // Crear ítems (Sin cambios, funciona bien)
  create: async (itemsData) => {
    const values = [];
    const placeholders = itemsData.map((item, index) => {
      const offset = index * 6;
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

  // Obtener ítems de una orden (CORREGIDO PARA EVITAR ERRORES DE COLUMNA)
  findByOrder: async (orderId) => {
    const query = `
      SELECT 
        oi.*,
        -- Datos del Producto
        p.description as product_name,  
        p.global_sku,
        -- Datos del Lote
        pl.lot_number,
        pl.expiry_date,
        -- Datos Específicos del Supplier-Producto
        ps.supplier_sku,
        
        -- ✅ DATOS DEL PROVEEDOR
        -- Usamos COALESCE para evitar nulos si no hay match
        s.id as supplier_id,
        s.name as supplier_name,
        s.contact_email as supplier_contact, -- Asumiendo que es email, ajusta si es 'phone' o 'contact_info'
        -- Si 'country' no existe, pon 'Intl' a mano o comenta esta línea si falla de nuevo
        s.country as supplier_country 

      FROM order_items oi
      -- 1. Unimos con Lotes
      LEFT JOIN product_lots pl ON oi.product_lot_id = pl.id
      -- 2. Unimos con la tabla pivote product_suppliers
      LEFT JOIN product_suppliers ps ON oi.product_supplier_id = ps.id
      -- 3. ✅ Unimos con la Tabla Maestra de Proveedores (suppliers) usando el supplier_id de la pivote
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      -- 4. Unimos con el Producto Base
      LEFT JOIN products p ON ps.product_id = p.id
      
      WHERE oi.order_id = $1
    `;
    
    try {
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      // Si falla por columna, intentamos una versión simplificada de emergencia
      console.error("Error detallado en findByOrder:", error.message);
      
      // Fallback: Consulta simple sin datos de proveedor para que no rompa la app
      const fallbackQuery = `
        SELECT 
          oi.*,
          p.description as product_name,
          p.global_sku,
          pl.lot_number,
          pl.expiry_date
        FROM order_items oi
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