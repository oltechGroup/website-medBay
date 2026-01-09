// backend/src/controllers/notificationController.js

const { Pool } = require('pg');
const db = require('../config/database'); 

// OBTENER NOTIFICACIONES DE ADMIN (Bandeja de entrada general)
const getNotifications = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ELIMINAR NOTIFICACIÓN (Admin)
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM notifications WHERE id = $1', [id]);
    res.json({ success: true, message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ✅ OBTENER ALERTAS PARA EL CLIENTE (CORREGIDO)
const getClientAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Buscar Cotizaciones con Propuesta (Esperando respuesta del cliente)
    // Nota: 'quotes' SÍ tiene updated_at porque la creamos recientemente así
    const quotesQuery = `
      SELECT 
        id, 
        'quote' as type, 
        CONCAT('Propuesta recibida: ', product_request->>'product_name') as subject,
        'Admin ha enviado una propuesta. Revisa y decide.' as message,
        updated_at as created_at
      FROM quotes 
      WHERE user_id = $1 AND status = 'proposal_sent'
    `;

    // 2. Buscar Órdenes que requieren acción o informativas
    // ✅ CORRECCIÓN: Usamos 'placed_at' en lugar de 'updated_at'
    const ordersQuery = `
      SELECT 
        id, 
        'order' as type,
        CASE 
          WHEN status = 'payment_pending' THEN CONCAT('Stock Aprobado: Orden #', LEFT(id::text, 8))
          WHEN status = 'shipped' THEN CONCAT('Enviado: Orden #', LEFT(id::text, 8))
          WHEN status = 'rejected' THEN CONCAT('Cancelada: Orden #', LEFT(id::text, 8))
          ELSE CONCAT('Actualización: Orden #', LEFT(id::text, 8))
        END as subject,
        status as message, 
        placed_at as created_at -- ✅ AQUÍ ESTABA EL ERROR
      FROM orders 
      WHERE customer_id = $1 
      AND status IN ('payment_pending', 'shipped', 'rejected')
      -- Filtramos por fecha de creación (placed_at)
      AND placed_at > NOW() - INTERVAL '7 days' 
    `;

    const [quotesRes, ordersRes] = await Promise.all([
      db.query(quotesQuery, [userId]),
      db.query(ordersQuery, [userId])
    ]);

    // Unir y ordenar por fecha reciente
    const alerts = [
      ...quotesRes.rows,
      ...ordersRes.rows
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(alerts);

  } catch (error) {
    console.error('Error obteniendo alertas de cliente:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { 
  getNotifications, 
  deleteNotification,
  getClientAlerts 
};