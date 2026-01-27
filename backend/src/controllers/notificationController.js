// backend/src/controllers/notificationController.js

const db = require('../config/database'); 

// OBTENER NOTIFICACIONES DE ADMIN (Bandeja de entrada general)
const getNotifications = async (req, res) => {
  try {
    // Obtenemos notificaciones enriquecidas con source_id para enlaces rápidos
    const result = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
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

// ✅ OBTENER ALERTAS PARA EL CLIENTE (Dashboard /notifications)
const getClientAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Buscar Cotizaciones con Propuesta (Esperando respuesta del cliente)
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
    const ordersQuery = `
      SELECT 
        id, 
        'order' as type,
        CASE 
          -- ✅ CASO NUEVO: Cuando el Admin envió la cotización (Tax + Envío)
          WHEN status = 'waiting_customer_approval' THEN CONCAT('Propuesta de Envío: Orden #', LEFT(id::text, 8))
          WHEN status = 'payment_pending' THEN CONCAT('Stock Aprobado: Orden #', LEFT(id::text, 8))
          WHEN status = 'shipped' THEN CONCAT('Enviado: Orden #', LEFT(id::text, 8))
          WHEN status = 'rejected' THEN CONCAT('Cancelada: Orden #', LEFT(id::text, 8))
          ELSE CONCAT('Actualización: Orden #', LEFT(id::text, 8))
        END as subject,
        
        CASE 
          -- ✅ MENSAJES CLAROS PARA ACCIÓN
          WHEN status = 'waiting_customer_approval' THEN 'Admin ha calculado envío e impuestos. Revisa para continuar.'
          WHEN status = 'payment_pending' THEN 'La orden está lista para pago. Sube tu evidencia.'
          WHEN status = 'shipped' THEN 'Tu pedido ha sido enviado. Haz clic para ver el tracking.'
          ELSE status
        END as message,
        
        placed_at as created_at
      FROM orders 
      WHERE customer_id = $1 
      -- ✅ Filtramos los estados relevantes para notificar
      AND status IN ('waiting_customer_approval', 'payment_pending', 'shipped', 'rejected')
      -- Filtramos por fecha (últimos 30 días para cubrir ciclos B2B largos)
      AND placed_at > NOW() - INTERVAL '30 days' 
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