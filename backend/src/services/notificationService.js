// backend/src/services/notificationService.js

const db = require('../config/database');
const transporter = require('../config/mailer');
const { 
  generateOrderReceivedTemplate,
  generateOrderApprovedTemplate,
  generateOrderRejectedTemplate,
  generateOrderShippedTemplate,
  // Templates de cotización
  generateQuoteTemplate,
  generateQuoteResponseTemplate,
  // ✅ NUEVO: Template Admin Orden
  generateNewOrderAdminTemplate,
  getBrandingAttachments
} = require('../utils/emailTemplates');

// Helper para obtener datos completos de la orden para el correo
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

// Helper para obtener datos completos de la cotización
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
  
  // Si no hay user_id (usuario invitado), usar guest_info
  if (!quote.user_email && quote.guest_info) {
    quote.user_email = quote.guest_info.email;
    quote.user_name = quote.guest_info.name;
    quote.user_phone = quote.guest_info.phone;
  }

  return quote;
};

const NotificationService = {
  
  // ==========================
  // 📦 FLUJO DE ÓRDENES
  // ==========================

  // 1. EVENTO: ORDEN CREADA (Cliente solicita)
  notifyOrderCreated: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      // A) Correo al CLIENTE (Confirmación de recibido)
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

      // B) Correo al ADMIN (AVISO DE NUEVA ORDEN) -> ✅ AHORA CON DISEÑO
      const htmlAdmin = generateNewOrderAdminTemplate({
        orderId: data.id,
        userName: data.user_name,
        total: data.total,
        itemCount: data.items.length
      });

      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com", // Tu correo admin
        subject: `🔔 Nueva Orden Pendiente de Revisión: #${data.id.slice(0,8)}`,
        html: htmlAdmin, // Usamos el HTML bonito
        attachments: getBrandingAttachments()
      });

      console.log(`[Email] Orden Creada notificada a ${data.user_email} y Admin`);

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderCreated:', error);
    }
  },

  // 2. EVENTO: STOCK APROBADO (Admin aprueba -> Cliente debe pagar)
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
        subject: `🎉 Stock Confirmado: Orden #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

      console.log(`[Email] Aprobación notificada a ${data.user_email}`);

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderApproved:', error);
    }
  },

  // 3. EVENTO: STOCK RECHAZADO (Admin rechaza)
  notifyOrderRejected: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const html = generateOrderRejectedTemplate({
        orderId: data.id
      });

      await transporter.sendMail({
        from: `"MedBay Orders" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `⚠️ Actualización sobre tu Orden #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

      console.log(`[Email] Rechazo notificado a ${data.user_email}`);

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderRejected:', error);
    }
  },

  // 4. EVENTO: PAGO SUBIDO (Cliente sube evidencia -> Admin debe validar)
  notifyPaymentUploaded: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);

      // Solo al Admin (Texto simple está bien aquí o podemos hacer template después)
      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `💸 Pago Recibido: Orden #${data.id.slice(0,8)}`,
        text: `El cliente ${data.user_name} ha subido su comprobante de pago. Entra al Dashboard para validarlo y procesar el envío.`
      });

      console.log(`[Email] Pago subido notificado al Admin`);

    } catch (error) {
      console.error('[NotificationService] Error en notifyPaymentUploaded:', error);
    }
  },

  // 5. EVENTO: ORDEN ENVIADA (Admin pone tracking)
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

      console.log(`[Email] Envío notificado a ${data.user_email}`);

    } catch (error) {
      console.error('[NotificationService] Error en notifyOrderShipped:', error);
    }
  },

  // ==========================
  // 💬 FLUJO DE COTIZACIONES
  // ==========================

  // 6. EVENTO: COTIZACIÓN SOLICITADA (Cliente pide)
  notifyQuoteCreated: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      const req = data.product_request; // JSONB

      // A) Email al Admin (Usamos template existente)
      const htmlAdmin = generateQuoteTemplate({
        userName: data.user_name || 'Invitado',
        userEmail: data.user_email,
        phone: data.user_phone,
        productName: req.product_name,
        sku: req.sku,
        quantity: req.quantity_asked,
        message: req.notes
      });

      await transporter.sendMail({
        from: `"MedBay Web" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `🔔 Nueva Solicitud de Cotización: ${req.product_name}`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      // B) Email Confirmación al Cliente
      await transporter.sendMail({
        from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `Hemos recibido tu solicitud de cotización`,
        text: `Hola ${data.user_name || ''}, hemos recibido tu interés en el producto ${req.product_name}. Nuestro equipo comercial te enviará una propuesta formal a la brevedad.`
      });

      console.log(`[Email] Cotización creada notificada`);

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteCreated:', error);
    }
  },

  // 7. EVENTO: PROPUESTA ENVIADA (Admin responde con datos)
  notifyQuoteProposalSent: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      const req = data.product_request;
      const prop = data.admin_proposal; // JSONB con la oferta

      const htmlClient = generateQuoteResponseTemplate({
        userName: data.user_name || 'Cliente',
        productName: req.product_name,
        sku: req.sku,
        quantity: req.quantity_asked,
        message: `
          <p>Hemos encontrado disponibilidad para tu solicitud:</p>
          <ul>
            <li><strong>Cantidad Disponible:</strong> ${prop.quantity_found} unidades</li>
            <li><strong>Precio Unitario:</strong> $${prop.unit_price} USD</li>
            <li><strong>Tipo de Lote:</strong> ${prop.lot_type === 'expired' ? 'Caducado (Uso educativo)' : 'Vigente'}</li>
            <li><strong>Fecha de Caducidad:</strong> ${new Date(prop.expiry_date).toLocaleDateString()}</li>
          </ul>
          <p><strong>Nota del Vendedor:</strong> ${prop.admin_notes || 'Sin notas adicionales.'}</p>
          <p style="margin-top: 10px;">Ingresa a tu panel para aceptar o rechazar esta oferta.</p>
        `
      });

      await transporter.sendMail({
        from: `"Ventas MedBay" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `📋 Propuesta Comercial: ${req.product_name}`,
        html: htmlClient,
        attachments: getBrandingAttachments()
      });

      console.log(`[Email] Propuesta enviada a ${data.user_email}`);

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteProposalSent:', error);
    }
  },

  // 8. EVENTO: CLIENTE ACEPTA PROPUESTA
  notifyQuoteAccepted: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      
      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `✅ Cotización ACEPTADA por Cliente`,
        text: `El cliente ${data.user_name} ha ACEPTADO la propuesta para ${data.product_request.product_name}. Procede a contactarlo para cerrar la venta o generar la orden manual.`
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteAccepted:', error);
    }
  },

  // 9. EVENTO: CLIENTE RECHAZA PROPUESTA
  notifyQuoteRejected: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      
      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `❌ Cotización RECHAZADA por Cliente`,
        text: `El cliente ${data.user_name} ha RECHAZADO la propuesta para ${data.product_request.product_name}.`
      });

    } catch (error) {
      console.error('[NotificationService] Error en notifyQuoteRejected:', error);
    }
  }
};

module.exports = NotificationService;