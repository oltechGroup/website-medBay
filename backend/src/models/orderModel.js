// backend/src/models/orderModel.js

const db = require('../config/database');

const Order = {
  // --- 1. CREAR ORDEN (Inicio del Flujo B2B) ---
  // El cliente solo envía items y dirección. No hay pago ni envío definido aún.
  create: async (orderData) => {
    const {
      customer_id,
      subtotal,
      currency,
      shipping_address_id,
      billing_address_id,
      notes,
      referral_code
    } = orderData;
    
    // Estado inicial por defecto: 'pending_valuation'
    const initialStatus = 'pending_valuation';

    const query = `
      INSERT INTO orders (
        customer_id, status, subtotal, tax, total, currency,
        shipping_address_id, billing_address_id, notes,
        shipping_method, shipping_cost, payment_method, payment_fee, referral_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      customer_id, 
      initialStatus, 
      subtotal, 
      0, // Tax inicial en 0 (Admin lo calcula después)
      subtotal, // Total inicial = Subtotal (sin envío ni tax aún)
      currency,
      shipping_address_id, 
      billing_address_id, 
      notes, 
      null, // shipping_method (Se define después)
      0,    // shipping_cost (Se define después)
      null, // payment_method (Se define al final)
      0,    // payment_fee
      referral_code || null
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // --- 2. GESTIÓN DE OPCIONES DE ENVÍO (Admin) ---
  
  // Guardar una opción de envío propuesta por el Admin
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

  // Obtener las opciones de envío de una orden
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

  // Admin establece el IMPUESTO manual y cambia estado a "Esperando Cliente"
  updateTaxAndStatus: async (orderId, taxAmount) => {
    const query = `
      UPDATE orders 
      SET 
        tax = $1, 
        -- Recalculamos total parcial (Subtotal + Tax), el envío sigue siendo 0 hasta que el cliente elija
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

  // El Cliente elige una opción de envío -> Se fija el precio final y el método
  selectShippingOption: async (orderId, shippingOptionId) => {
    const client = await db.pool.connect(); // Usamos transacción para seguridad
    
    try {
      await client.query('BEGIN');

      // A. Marcar la opción como seleccionada en la tabla shipping_options
      // Primero desmarcamos todas (por seguridad) y luego marcamos la elegida
      await client.query('UPDATE shipping_options SET is_selected = false WHERE order_id = $1', [orderId]);
      
      const optionRes = await client.query(`
        UPDATE shipping_options 
        SET is_selected = true 
        WHERE id = $1 AND order_id = $2
        RETURNING *
      `, [shippingOptionId, orderId]);

      if (optionRes.rows.length === 0) throw new Error("Opción de envío no válida");
      const selectedOption = optionRes.rows[0];

      // B. Actualizar la Orden con el costo, método y NUEVO TOTAL
      // Total = Subtotal + Tax + CostoEnvío
      const orderRes = await client.query(`
        UPDATE orders 
        SET 
          shipping_method = $1,
          shipping_cost = $2,
          total = subtotal + tax + $2,
          status = 'payment_pending' -- Ahora sí, pasa a esperar pago
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

  // Guardar método de pago final (cuando el cliente paga)
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

  // --- MÉTODOS ESTÁNDAR (Finds & Updates) ---

  findAll: async () => {
    const query = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.company_name as customer_company
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
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
        u.full_name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
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
          'city', sa.city,
          'state', sa.state,
          'postal_code', sa.postal_code,
          'country', sa.country,
          'phone', u.phone 
        ) as shipping_address_json,
        
        json_build_object(
          'street', ba.street,
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