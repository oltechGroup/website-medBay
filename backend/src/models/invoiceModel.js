const db = require('../config/database');

const Invoice = {
  // Crear una nueva factura
  create: async (invoiceData) => {
    const {
      order_id,
      total,
      tax_breakdown,
      avalara_transaction_id,
      pdf_path,
      created_by
    } = invoiceData;
    
    const query = `
      INSERT INTO invoices (
        order_id, total, tax_breakdown, avalara_transaction_id, pdf_path, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [order_id, total, tax_breakdown, avalara_transaction_id, pdf_path, created_by];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las facturas
  findAll: async () => {
    const query = `
      SELECT 
        i.*,
        o.total as order_total,
        u.email as customer_email,
        u.full_name as customer_name,
        u.company_name as customer_company
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      LEFT JOIN users u ON o.customer_id = u.id
      ORDER BY i.created_at DESC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener factura por ID
  findById: async (id) => {
    const query = `
      SELECT 
        i.*,
        o.total as order_total,
        o.subtotal,
        o.tax,
        o.currency,
        o.placed_at,
        u.email as customer_email,
        u.full_name as customer_name,
        u.company_name as customer_company,
        u.tax_id as customer_tax_id,
        u.country as customer_country
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE i.id = $1
    `;
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener factura por order_id
  findByOrderId: async (order_id) => {
    const query = `
      SELECT 
        i.*,
        o.total as order_total,
        o.subtotal,
        o.tax,
        o.currency,
        o.placed_at,
        u.email as customer_email,
        u.full_name as customer_name,
        u.company_name as customer_company,
        u.tax_id as customer_tax_id,
        u.country as customer_country
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE i.order_id = $1
    `;
    
    try {
      const result = await db.query(query, [order_id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar factura
  update: async (id, invoiceData) => {
    const {
      total,
      tax_breakdown,
      avalara_transaction_id,
      pdf_path
    } = invoiceData;
    
    const query = `
      UPDATE invoices 
      SET total = $1, tax_breakdown = $2, avalara_transaction_id = $3, pdf_path = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [total, tax_breakdown, avalara_transaction_id, pdf_path, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Invoice;