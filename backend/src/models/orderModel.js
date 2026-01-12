// backend/src/models/orderModel.js

const db = require('../config/database');

const Order = {
  // Crear una nueva orden
  create: async (orderData) => {
    const {
      customer_id,
      status,
      subtotal,
      tax,
      total,
      currency,
      shipping_address_id,
      billing_address_id,
      notes,
      review_deadline,
      shipping_method,
      shipping_cost,
      payment_method,
      payment_fee,
      referral_code,
      evidence_file
    } = orderData;
    
    const query = `
      INSERT INTO orders (
        customer_id, status, subtotal, tax, total, currency,
        shipping_address_id, billing_address_id, notes, review_deadline,
        shipping_method, shipping_cost, payment_method, payment_fee, referral_code, evidence_file
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      customer_id, 
      status, 
      subtotal, 
      tax, 
      total, 
      currency,
      shipping_address_id, 
      billing_address_id, 
      notes, 
      review_deadline,
      shipping_method || 'standard',
      shipping_cost || 0,
      payment_method,
      payment_fee || 0,
      referral_code || null,
      evidence_file || null
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las órdenes (Admin)
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

  // Obtener órdenes por cliente
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

  // ✅ CORREGIDO: Obtener orden por ID
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
        
        -- Construcción de objetos JSON para las direcciones
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
          'tax_id', u.tax_id  -- ✅ CORREGIDO: Usamos u.tax_id en vez de ba.tax_id
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

  // Actualizar estado de orden
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

  // Actualizar Número de Rastreo
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

  // Subir Evidencia de Pago
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