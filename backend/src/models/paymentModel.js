const db = require('../config/database');

const Payment = {
  // Crear intento de pago
  create: async (paymentData) => {
    const {
      order_id,
      provider,
      intent_id,
      status,
      amount,
      currency
    } = paymentData;
    
    const query = `
      INSERT INTO payment_intents (
        order_id, provider, intent_id, status, amount, currency
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [order_id, provider, intent_id, status, amount, currency];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar estado de pago
  updateStatus: async (id, status, captured_at = null) => {
    const query = `
      UPDATE payment_intents 
      SET status = $1, captured_at = $2
      WHERE id = $3
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [status, captured_at, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener pagos por orden
  findByOrder: async (orderId) => {
    const query = 'SELECT * FROM payment_intents WHERE order_id = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Payment;