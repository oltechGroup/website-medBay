// backend/src/services/notificationService.js

const db = require('../config/database');
const transporter = require('../config/mailer');
const { 
  generateOrderReceivedTemplate,
  generateOrderApprovedTemplate,
  generateOrderRejectedTemplate,
  generateOrderShippedTemplate,
  generateNewOrderAdminTemplate,
  generatePaymentUploadedTemplate,
  generateQuoteTemplate,
  generateQuoteResponseTemplate,
  generateQuoteCreatedClientTemplate,
  generateQuoteAcceptedAdminTemplate,
  generateQuoteRejectedAdminTemplate,
  generateResponseTemplate, // ✅ Lo necesitamos para los mensajes manuales
  getBrandingAttachments
} = require('../utils/emailTemplates');

// --- HELPERS DE DATOS ---

const getFullOrderData = async (orderId) => {
  const orderQuery = `
    SELECT 
      o.id, o.total, o.currency, o.status, o.payment_method, o.shipping_method,
      u.email as user_email, u.full_name as user_name
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    WHERE o.id = $1
  `;
  
  const itemsQuery = `
    SELECT 
      oi.quantity, 
      p.description as product_name, 
      pl.lot_number
    FROM order_items oi
    LEFT JOIN product_lots pl ON oi.product_lot_id = pl.id
    LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
    LEFT JOIN products p ON ps.product_id = p.id
    WHERE oi.order_id = $1
  `;

  const orderRes = await db.query(orderQuery, [orderId]);
  const itemsRes = await db.query(itemsQuery, [orderId]);

  if (orderRes.rows.length === 0) throw new Error('Orden no encontrada');

  return {
    ...orderRes.rows[0],
    items: itemsRes.rows
  };
};

const getFullQuoteData = async (quoteId) => {
  const query = `
    SELECT 
      q.*,
      u.email as user_email, 
      u.full_name as user_name,
      u.phone as user_phone
    FROM quotes q
    LEFT JOIN users u ON q.user_id = u.id
    WHERE q.id = $1
  `;
  const result = await db.query(query, [quoteId]);
  if (result.rows.length === 0) throw new Error('Cotización no encontrada');
  
  const quote = result.rows[0];
  
  if (!quote.user_email && quote.guest_info) {
    quote.user_email = quote.guest_info.email;
    quote.user_name = quote.guest_info.name;
    quote.user_phone = quote.guest_info.phone;
  }

  return quote;
};

// --- HELPER PARA CREAR NOTIFICACIÓN EN DASHBOARD (ADMIN) ---
const createAdminNotification = async ({ type, senderName, senderEmail, subject, content, source, sourceId }) => {
  try {
    // ✅ Nos aseguramos de usar las columnas source y source_id que creamos en SQL
    const query = `
      INSERT INTO notifications (type, sender_name, sender_email, subject, content, source, source_id, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false)
    `;
    await db.query(query, [
      type, 
      senderName, 
      senderEmail, 
      subject, 
      JSON.stringify(content), 
      source, 
      sourceId 
    ]);
    console.log(`[DB] Notificación tipo '${type}' guardada para Admin.`);
  } catch (error) {
    console.error('[NotificationService] Error guardando en DB:', error);
  }
};

const NotificationService = {
  
  // ==========================
  // 📦 FLUJO DE ÓRDENES
  // ==========================

  notifyOrderCreated: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const htmlClient = generateOrderReceivedTemplate({
        orderId: data.id,
        items: data.items
      });

      await transporter.sendMail({
        from: `"MedBay Orders" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `✅ Solicitud Recibida: Orden #${data.id.slice(0,8)}`,
        html: htmlClient,
        attachments: getBrandingAttachments()
      });

      const htmlAdmin = generateNewOrderAdminTemplate({
        orderId: data.id,
        userName: data.user_name,
        total: data.total,
        itemCount: data.items.length
      });

      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `🔔 Nueva Orden Pendiente: #${data.id.slice(0,8)}`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Nueva Orden',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `Orden #${data.id.slice(0,8)} requiere cotización`,
        source: 'order',
        sourceId: data.id,
        content: {
          total: data.total,
          currency: data.currency,
          items_count: data.items.length
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderCreated:', error);
    }
  },

  notifyOrderApproved: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const html = generateOrderApprovedTemplate({
        orderId: data.id,
        total: data.total,
        paymentMethod: data.payment_method
      });

      await transporter.sendMail({
        from: `"MedBay Orders" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `🎉 Propuesta Lista: Orden #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderApproved:', error);
    }
  },

  notifyOrderRejected: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const html = generateOrderRejectedTemplate({ orderId: data.id });

      await transporter.sendMail({
        from: `"MedBay Orders" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `⚠️ Actualización sobre tu Orden #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderRejected:', error);
    }
  },

  notifyPaymentUploaded: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);

      const htmlAdmin = generatePaymentUploadedTemplate({
        orderId: data.id,
        userName: data.user_name,
        total: data.total
      });

      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `💸 Pago Recibido: Orden #${data.id.slice(0,8)}`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Pago Recibido',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `Pago para Orden #${data.id.slice(0,8)}`,
        source: 'order',
        sourceId: data.id,
        content: {
          total: data.total,
          status: 'Revisión Requerida'
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyPaymentUploaded:', error);
    }
  },

  notifyOrderShipped: async (orderId, trackingNumber) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const html = generateOrderShippedTemplate({
        orderId: data.id,
        trackingNumber: trackingNumber
      });

      await transporter.sendMail({
        from: `"MedBay Logistics" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `🚚 Tu pedido ha sido enviado: #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderShipped:', error);
    }
  },

  // ✅ NUEVO: EVENTO CULMINACIÓN (ENTREGADO)
  notifyOrderDelivered: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const html = generateResponseTemplate(
        "Pedido Completado", 
        `Hola ${data.user_name},\n\nHemos registrado que tu orden #${orderId.slice(0,8)} ha sido entregada exitosamente.\nGracias por confiar en MedBay.`, 
        true
      );

      await transporter.sendMail({
        from: `"MedBay Logistics" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `✅ Pedido Entregado: #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderDelivered:', error);
    }
  },

  // ✅ NUEVO: ENVÍO DE MENSAJES MANUALES (CONCIERGE)
  sendCustomEmail: async (toEmail, subject, message, title = "Actualización de tu cuenta") => {
    try {
      const html = generateResponseTemplate(title, message, true);

      await transporter.sendMail({
        from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        html: html,
        attachments: getBrandingAttachments()
      });
      console.log(`[Email] Mensaje personalizado enviado a ${toEmail}`);
    } catch (error) {
      console.error('[NotificationService] Error en sendCustomEmail:', error);
      throw error; // Lanzamos el error para que el controlador lo atrape si es necesario
    }
  },

  // ==========================
  // 💬 FLUJO DE COTIZACIONES
  // ==========================

  notifyQuoteCreated: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      const req = data.product_request;
      const context = req.quote_context || null;

      const htmlAdmin = generateQuoteTemplate({
        userName: data.user_name || 'Invitado',
        userEmail: data.user_email,
        phone: data.user_phone,
        productName: req.product_name,
        sku: req.sku,
        quantity: req.quantity_asked,
        message: req.notes,
        context: context 
      });

      await transporter.sendMail({
        from: `"MedBay Web" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `🔔 Nueva Solicitud de Cotización: ${req.product_name}`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      const htmlClient = generateQuoteCreatedClientTemplate({
        productName: req.product_name,
        sku: req.sku,
        quantity: req.quantity_asked,
        context: context 
      });

      await transporter.sendMail({
        from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `Hemos recibido tu solicitud de cotización`,
        html: htmlClient,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Solicitud de Cotización',
        senderName: data.user_name || 'Invitado',
        senderEmail: data.user_email,
        subject: `Cotización: ${req.product_name}`,
        source: 'quote',
        sourceId: data.id,
        content: {
          product_name: req.product_name,
          quantity: req.quantity_asked,
          sku: req.sku,
          context: context
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteCreated:', error);
    }
  },

  notifyQuoteProposalSent: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      const req = data.product_request;
      const prop = data.admin_proposal;

      const htmlClient = generateQuoteResponseTemplate({
        userName: data.user_name || 'Cliente',
        productName: req.product_name,
        sku: req.sku,
        quantity: req.quantity_asked,
        message: prop.admin_notes || 'Propuesta adjunta.' 
      });

      await transporter.sendMail({
        from: `"Ventas MedBay" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `📋 Propuesta Comercial: ${req.product_name}`,
        html: htmlClient,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteProposalSent:', error);
    }
  },

  notifyQuoteAccepted: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      const prop = data.admin_proposal || {};
      const total = (prop.unit_price || 0) * (prop.quantity_found || 0);
      
      const htmlAdmin = generateQuoteAcceptedAdminTemplate({
        quoteId: data.id,
        userName: data.user_name,
        productName: data.product_request.product_name,
        quantity: prop.quantity_found,
        total: total
      });

      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `✅ Cotización ACEPTADA por Cliente`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Cotización Aceptada',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `¡Venta Cerrada! ${data.product_request.product_name}`,
        source: 'quote',
        sourceId: data.id,
        content: {
          status: 'accepted',
          total: total
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteAccepted:', error);
    }
  },

  notifyQuoteRejected: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      
      const htmlAdmin = generateQuoteRejectedAdminTemplate({
        quoteId: data.id,
        userName: data.user_name,
        productName: data.product_request.product_name
      });

      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `❌ Cotización RECHAZADA por Cliente`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Cotización Rechazada',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `Rechazo: ${data.product_request.product_name}`,
        source: 'quote',
        sourceId: data.id,
        content: {
          status: 'rejected'
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteRejected:', error);
    }
  }
};

module.exports = NotificationService;