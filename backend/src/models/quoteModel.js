// backend/src/models/quoteModel.js

const db = require('../config/database');

const Quote = {
  // 1. Crear una nueva solicitud (Cliente pide)
  create: async (userId, guestInfo, productRequest) => {
    const query = `
      INSERT INTO quotes (
        user_id, 
        guest_info, 
        product_request, 
        status
      )
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `;
    
    // productRequest debe ser objeto: { product_name, sku, quantity_asked, notes, quote_context }
    const values = [userId, guestInfo, productRequest];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 2. Obtener todas (Para el Dashboard Admin)
  findAll: async () => {
    const query = `
      SELECT q.*, 
             u.email as user_email, 
             u.full_name as user_name
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  // 3. Obtener mis cotizaciones (Para el Cliente)
  findByUser: async (userId) => {
    const query = `
      SELECT * FROM quotes 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // 4. Obtener por ID
  findById: async (id) => {
    const query = `
      SELECT q.*, 
             u.email as registered_email, 
             u.full_name as registered_name,
             u.phone as user_phone
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // 5. Enviar Propuesta (Admin responde)
  updateProposal: async (id, proposalData) => {
    const query = `
      UPDATE quotes 
      SET 
        admin_proposal = $1,
        status = 'proposal_sent',
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    // proposalData: { quantity_found, expiry_date, lot_type, unit_price, notes }
    const result = await db.query(query, [proposalData, id]);
    return result.rows[0];
  },

  // 6. Cliente Responde (Aceptar/Rechazar)
  updateStatus: async (id, status) => {
    const query = `
      UPDATE quotes 
      SET 
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0];
  },

  // 7. ✅ Eliminar Cotización (Admin limpia)
  delete: async (id) => {
    const query = 'DELETE FROM quotes WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = Quote;