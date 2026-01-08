// backend/src/models/orderModel.js

const db = require('../config/database');

const Order = {
  // Crear una nueva orden (Actualizado Fase 2)
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
      // ✅ Nuevos campos Fase 2
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

  // Obtener todas las órdenes con información relacionada
  findAll: async () => {
    const query = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.full_name as customer_name,
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

  // Obtener orden por ID (Incluye los nuevos campos automáticamente por el SELECT *)
  findById: async (id) => {
    const query = `
      SELECT 
        o.*,
        u.email as customer_email,
        u.full_name as customer_name,
        u.company_name as customer_company,
        u.tax_id as customer_tax_id,
        u.country as customer_country,
        -- Traer también info de direcciones para mostrar en el detalle
        sa.street as shipping_street, sa.city as shipping_city, sa.postal_code as shipping_zip,
        ba.street as billing_street, ba.city as billing_city, ba.postal_code as billing_zip
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

  // Actualizar estado de orden (Mantenido igual, útil para flujo de aprobación)
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

  // ✅ NUEVO: Subir Evidencia de Pago (Para que el cliente suba su comprobante)
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
  },

  // Actualizar información general de orden
  update: async (id, orderData) => {
    const {
      status,
      subtotal,
      tax,
      total,
      notes,
      review_deadline
    } = orderData;
    
    const query = `
      UPDATE orders 
      SET status = $1, subtotal = $2, tax = $3, total = $4, notes = $5, review_deadline = $6
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [status, subtotal, tax, total, notes, review_deadline, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Order;