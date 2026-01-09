// backend/src/controllers/dashboardController.js

const db = require('../config/database');

const dashboardController = {
  
  // OBTENER BANDEJA DE ENTRADA UNIFICADA
  getUnifiedInbox: async (req, res) => {
    try {
      // 1. Obtener Notificaciones (Contacto, Registro, etc.)
      const notificationsQuery = `
        SELECT id, type, sender_name, sender_email, subject, content, created_at, 'notification' as source 
        FROM notifications 
        ORDER BY created_at DESC
      `;

      // 2. Obtener Órdenes Activas
      // ✅ CORRECCIÓN: Usamos 'o.placed_at' en lugar de 'o.created_at'
      const ordersQuery = `
        SELECT 
          o.id, 
          'Nueva Orden' as type,
          u.full_name as sender_name,
          u.email as sender_email,
          CONCAT('Orden #', LEFT(o.id::text, 8), ' - ', o.status) as subject,
          o.total as amount,
          o.currency,
          o.placed_at as created_at, -- ✅ Alias para uniformidad
          'order' as source,
          o.status
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        WHERE o.status IN ('pending_review', 'payment_review') 
        ORDER BY o.placed_at DESC
      `;

      // 3. Obtener Cotizaciones Pendientes
      const quotesQuery = `
        SELECT 
          q.id,
          'Solicitud de Cotización' as type,
          COALESCE(u.full_name, q.guest_info->>'name') as sender_name,
          COALESCE(u.email, q.guest_info->>'email') as sender_email,
          CONCAT('Cotización: ', q.product_request->>'product_name') as subject,
          q.product_request,
          q.created_at,
          'quote' as source,
          q.status
        FROM quotes q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.status = 'pending'
        ORDER BY q.created_at DESC
      `;

      // Ejecutar consultas en paralelo
      const [notifRes, orderRes, quoteRes] = await Promise.all([
        db.query(notificationsQuery),
        db.query(ordersQuery),
        db.query(quotesQuery)
      ]);

      // --- NORMALIZACIÓN DE DATOS ---

      const formattedNotifications = notifRes.rows.map(n => ({
        id: n.id.toString(),
        original_id: n.id,
        type: n.type, // 'Contacto General' o 'Registro Usuario'
        source: 'notification',
        sender_name: n.sender_name,
        sender_email: n.sender_email,
        subject: n.subject,
        created_at: n.created_at,
        data: n.content
      }));

      const formattedOrders = orderRes.rows.map(o => ({
        id: o.id,
        original_id: o.id,
        type: 'Orden de Compra',
        source: 'order',
        sender_name: o.sender_name,
        sender_email: o.sender_email,
        subject: o.subject,
        created_at: o.created_at,
        status: o.status,
        data: { total: o.amount, currency: o.currency }
      }));

      const formattedQuotes = quoteRes.rows.map(q => ({
        id: q.id,
        original_id: q.id,
        type: 'Cotización',
        source: 'quote',
        sender_name: q.sender_name,
        sender_email: q.sender_email,
        subject: q.subject,
        created_at: q.created_at,
        status: q.status,
        data: q.product_request
      }));

      // Fusionar y Ordenar por fecha
      const unifiedInbox = [
        ...formattedNotifications, 
        ...formattedOrders, 
        ...formattedQuotes
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json(unifiedInbox);

    } catch (error) {
      console.error('Error obteniendo inbox unificado:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  },

  // ELIMINAR ITEM
  deleteItem: async (req, res) => {
    const { id, source } = req.params;
    
    try {
      if (source === 'notification') {
        await db.query('DELETE FROM notifications WHERE id = $1', [id]);
        return res.json({ success: true, message: 'Notificación eliminada' });
      } 
      
      return res.status(400).json({ error: 'Acción no permitida para este tipo de elemento' });

    } catch (error) {
      console.error('Error eliminando item:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = dashboardController;