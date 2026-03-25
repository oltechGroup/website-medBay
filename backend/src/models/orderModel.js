// backend/src/models/orderModel.js

const db = require('../config/database');

const Order = {
  // --- 1. CREAR ORDEN (Inicio del Flujo B2B) ---
  create: async (orderData) => {
    const {
      customer_id,
      subtotal,
      currency,
      shipping_address_id,
      billing_address_id,
      notes,
      referral_code,
      quote_id 
    } = orderData;
    
    const initialStatus = 'pending_valuation';

    const query = `
      INSERT INTO orders (
        customer_id, status, subtotal, tax, total, currency,
        shipping_address_id, billing_address_id, notes,
        shipping_method, shipping_cost, payment_method, payment_fee, 
        referral_code, quote_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      customer_id, 
      initialStatus, 
      subtotal, 
      0, 
      subtotal, 
      currency,
      shipping_address_id, 
      billing_address_id, 
      notes, 
      null, 
      0,    
      null, 
      0,    
      referral_code || null,
      quote_id || null 
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 🚀 NUEVO MÉTODO: Insertar ítems con Unidad de Medida
  // Este método es crucial para cuando se crea la orden desde el carrito o cotización
  createItems: async (orderId, items) => {
    const queries = items.map(item => {
      return db.query(`
        INSERT INTO order_items (
          order_id, product_id, product_lot_id, quantity, 
          unit_price, line_total, unit_of_measure -- ✅ Columna añadida
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        orderId, 
        item.product_id, 
        item.product_lot_id, 
        item.quantity, 
        item.unit_price, 
        item.line_total,
        item.unit_of_measure || 'pcs' // ✅ Respaldamos la unidad
      ]);
    });
    return Promise.all(queries);
  },

  // 🚀 NUEVO MÉTODO: Obtener ítems con Unidad de Medida
  // Este es el que alimenta al Modal del Admin y del Cliente
  getItemsByOrderId: async (orderId) => {
    const query = `
      SELECT 
        oi.*, 
        p.description as product_name, 
        p.global_sku,
        pl.lot_number
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN product_lots pl ON oi.product_lot_id = pl.id
      WHERE oi.order_id = $1
    `;
    const result = await db.query(query, [orderId]);
    return result.rows;
  },

  // --- 2. GESTIÓN DE OPCIONES DE ENVÍO (Admin) ---
  
  createShippingOption: async (optionData) => {
    const { order_id, name, description, estimated_days, cost } = optionData;
    
    const query = `
      INSERT INTO shipping_options (order_id, name, description, estimated_days, cost)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [order_id, name, description, estimated_days, cost]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  getShippingOptions: async (orderId) => {
    const query = `SELECT * FROM shipping_options WHERE order_id = $1 ORDER BY cost ASC`;
    try {
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // --- 3. ACTUALIZACIONES FINANCIERAS (Admin) ---

  updateTaxAndStatus: async (orderId, taxAmount) => {
    const query = `
      UPDATE orders 
      SET 
        tax = $1, 
        total = subtotal + $1,
        status = 'waiting_customer_approval'
      WHERE id = $2
      RETURNING *
    `;
    try {
      const result = await db.query(query, [taxAmount, orderId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // --- 4. SELECCIÓN DE CLIENTE (Cierre del Trato) ---

  selectShippingOption: async (orderId, shippingOptionId) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query('UPDATE shipping_options SET is_selected = false WHERE order_id = $1', [orderId]);
      
      const optionRes = await client.query(`
        UPDATE shipping_options 
        SET is_selected = true 
        WHERE id = $1 AND order_id = $2
        RETURNING *
      `, [shippingOptionId, orderId]);

      if (optionRes.rows.length === 0) throw new Error("Opción de envío no válida");
      const selectedOption = optionRes.rows[0];

      const orderRes = await client.query(`
        UPDATE orders 
        SET 
          shipping_method = $1,
          shipping_cost = $2,
          total = subtotal + tax + $2,
          status = 'payment_pending'
        WHERE id = $3
        RETURNING *
      `, [selectedOption.name, selectedOption.cost, orderId]);

      await client.query('COMMIT');
      return orderRes.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  updatePaymentMethod: async (id, method) => {
    const query = `
      UPDATE orders SET payment_method = $1 WHERE id = $2 RETURNING *
    `;
    try {
      const result = await db.query(query, [method, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // --- 5. GESTIÓN DE COMISIONES (Vendedores) ---

  getUnpaidCommissions: async () => {
    const query = `
      SELECT 
        o.referral_code,
        COUNT(o.id) as total_orders,
        SUM(o.subtotal) as total_sales_amount,
        MIN(o.placed_at) as oldest_pending_date
      FROM orders o
      WHERE 
        o.referral_code IS NOT NULL 
        AND o.commission_paid = FALSE 
        AND o.status IN ('delivered', 'shipped') 
      GROUP BY o.referral_code
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  markCommissionsAsPaid: async (referralCode) => {
    const query = `
      UPDATE orders 
      SET 
        commission_paid = TRUE, 
        commission_paid_at = CURRENT_TIMESTAMP
      WHERE 
        referral_code = $1 
        AND commission_paid = FALSE
        AND status IN ('delivered', 'shipped')
      RETURNING id
    `;
    try {
      const result = await db.query(query, [referralCode]);
      return {
        updatedCount: result.rowCount,
        orderIds: result.rows.map(r => r.id)
      };
    } catch (error) {
      throw error;
    }
  },

  // --- 6. TIMELINE Y MENSAJERÍA ---

  addTimelineEntry: async (orderId, userId, statusTo, notes, title) => {
    const query = `
      INSERT INTO order_timeline (order_id, changed_by, status_to, notes, title, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    try {
      const result = await db.query(query, [orderId, userId, statusTo, notes, title]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  getTimeline: async (orderId) => {
    const query = `
      SELECT t.*, u.full_name as changed_by_name 
      FROM order_timeline t
      LEFT JOIN users u ON t.changed_by = u.id
      WHERE t.order_id = $1
      ORDER BY t.created_at DESC
    `;
    try {
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // --- MÉTODOS ESTÁNDAR (Finds & Updates) ---

  findAll: async () => {
    const query = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.company_name as customer_company,
        json_build_object(
          'street', sa.street,
          'street_number', sa.street_number,
          'colony', sa.colony,
          'city', sa.city,
          'state', sa.state,
          'postal_code', sa.postal_code,
          'country', sa.country
        ) as shipping_address_json
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
      ORDER BY o.placed_at DESC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  findByCustomer: async (customerId) => {
    const query = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.full_name as customer_name,
        json_build_object(
          'street', sa.street,
          'street_number', sa.street_number,
          'colony', sa.colony,
          'city', sa.city,
          'state', sa.state,
          'postal_code', sa.postal_code,
          'country', sa.country
        ) as shipping_address_json
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
      WHERE o.customer_id = $1
      ORDER BY o.placed_at DESC
    `;
    try {
      const result = await db.query(query, [customerId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  findById: async (id) => {
    const query = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.full_name as customer_name,
        u.phone as customer_phone, 
        u.company_name as customer_company,
        u.tax_id as customer_tax_id,
        u.country as customer_country,
        
        json_build_object(
          'street', sa.street,
          'street_number', sa.street_number,
          'colony', sa.colony,
          'city', sa.city,
          'state', sa.state,
          'postal_code', sa.postal_code,
          'country', sa.country,
          'phone', u.phone 
        ) as shipping_address_json,
        
        json_build_object(
          'street', ba.street,
          'street_number', ba.street_number,
          'colony', ba.colony,
          'city', ba.city,
          'state', ba.state,
          'postal_code', ba.postal_code,
          'country', ba.country,
          'tax_id', u.tax_id
        ) as billing_address_json

      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
      LEFT JOIN addresses ba ON o.billing_address_id = ba.id
      WHERE o.id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  updateStatus: async (id, status, approved_by = null) => {
    const query = `
      UPDATE orders 
      SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    try {
      const result = await db.query(query, [status, approved_by, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  updateTracking: async (id, trackingNumber) => {
    const query = `
      UPDATE orders 
      SET tracking_number = $1, status = 'shipped'
      WHERE id = $2
      RETURNING *
    `;
    try {
      const result = await db.query(query, [trackingNumber, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  updateEvidence: async (id, filePath) => {
    const query = `
      UPDATE orders 
      SET evidence_file = $1, status = 'payment_review' 
      WHERE id = $2
      RETURNING *
    `;
    try {
      const result = await db.query(query, [filePath, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Order;