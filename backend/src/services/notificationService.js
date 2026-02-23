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
  generateResponseTemplate, // ✅ We need this for manual messages
  getBrandingAttachments
} = require('../utils/emailTemplates');

// --- DATA HELPERS ---

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

  if (orderRes.rows.length === 0) throw new Error('Order not found');

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
  if (result.rows.length === 0) throw new Error('Quote not found');
  
  const quote = result.rows[0];
  
  if (!quote.user_email && quote.guest_info) {
    quote.user_email = quote.guest_info.email;
    quote.user_name = quote.guest_info.name;
    quote.user_phone = quote.guest_info.phone;
  }

  return quote;
};

// --- HELPER TO CREATE DASHBOARD NOTIFICATION (ADMIN) ---
const createAdminNotification = async ({ type, senderName, senderEmail, subject, content, source, sourceId }) => {
  try {
    // ✅ Ensure we use the source and source_id columns created in SQL
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
    console.log(`[DB] Notification type '${type}' saved for Admin.`);
  } catch (error) {
    console.error('[NotificationService] Error saving to DB:', error);
  }
};

const NotificationService = {
  
  // ==========================
  // 📦 ORDER FLOW
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
        subject: `✅ Request Received: Order #${data.id.slice(0,8)}`,
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
        from: `"MedBay System" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `🔔 New Pending Order: #${data.id.slice(0,8)}`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'New Order',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `Order #${data.id.slice(0,8)} requires a quote`,
        source: 'order',
        sourceId: data.id,
        content: {
          total: data.total,
          currency: data.currency,
          items_count: data.items.length
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyOrderCreated:', error);
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
        subject: `🎉 Proposal Ready: Order #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyOrderApproved:', error);
    }
  },

  notifyOrderRejected: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const html = generateOrderRejectedTemplate({ orderId: data.id });

      await transporter.sendMail({
        from: `"MedBay Orders" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `⚠️ Update on your Order #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyOrderRejected:', error);
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
        from: `"MedBay System" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `💸 Payment Received: Order #${data.id.slice(0,8)}`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Payment Received',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `Payment for Order #${data.id.slice(0,8)}`,
        source: 'order',
        sourceId: data.id,
        content: {
          total: data.total,
          status: 'Review Required'
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyPaymentUploaded:', error);
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
        subject: `🚚 Your order has been shipped: #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyOrderShipped:', error);
    }
  },

  // ✅ NEW: COMPLETION EVENT (DELIVERED)
  notifyOrderDelivered: async (orderId) => {
    try {
      const data = await getFullOrderData(orderId);
      
      const html = generateResponseTemplate(
        "Order Completed", 
        `Hello ${data.user_name},\n\nWe have registered that your order #${orderId.slice(0,8)} has been successfully delivered.\nThank you for trusting MedBay.`, 
        true
      );

      await transporter.sendMail({
        from: `"MedBay Logistics" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `✅ Order Delivered: #${data.id.slice(0,8)}`,
        html: html,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyOrderDelivered:', error);
    }
  },

  // ✅ NEW: MANUAL MESSAGE SENDING (CONCIERGE)
  sendCustomEmail: async (toEmail, subject, message, title = "Update on your account") => {
    try {
      const html = generateResponseTemplate(title, message, true);

      await transporter.sendMail({
        from: `"MedBay Support" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        html: html,
        attachments: getBrandingAttachments()
      });
      console.log(`[Email] Custom message sent to ${toEmail}`);
    } catch (error) {
      console.error('[NotificationService] Error in sendCustomEmail:', error);
      throw error; // Throw the error so the controller can catch it if necessary
    }
  },

  // ==========================
  // 💬 QUOTE FLOW
  // ==========================

  notifyQuoteCreated: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      const req = data.product_request;
      const context = req.quote_context || null;

      const htmlAdmin = generateQuoteTemplate({
        userName: data.user_name || 'Guest',
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
        subject: `🔔 New Quote Request: ${req.product_name}`,
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
        from: `"MedBay Support" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `We have received your quote request`,
        html: htmlClient,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Quote Request',
        senderName: data.user_name || 'Guest',
        senderEmail: data.user_email,
        subject: `Quote: ${req.product_name}`,
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
      console.error('[NotificationService] Error in notifyQuoteCreated:', error);
    }
  },

  notifyQuoteProposalSent: async (quoteId) => {
    try {
      const data = await getFullQuoteData(quoteId);
      const req = data.product_request;
      const prop = data.admin_proposal;

      const htmlClient = generateQuoteResponseTemplate({
        userName: data.user_name || 'Customer',
        productName: req.product_name,
        sku: req.sku,
        quantity: req.quantity_asked,
        message: prop.admin_notes || 'Proposal attached.' 
      });

      await transporter.sendMail({
        from: `"MedBay Sales" <${process.env.EMAIL_USER}>`,
        to: data.user_email,
        subject: `📋 Commercial Proposal: ${req.product_name}`,
        html: htmlClient,
        attachments: getBrandingAttachments()
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyQuoteProposalSent:', error);
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
        from: `"MedBay System" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `✅ Quote ACCEPTED by Customer`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Quote Accepted',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `Sale Closed! ${data.product_request.product_name}`,
        source: 'quote',
        sourceId: data.id,
        content: {
          status: 'accepted',
          total: total
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyQuoteAccepted:', error);
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
        from: `"MedBay System" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `❌ Quote REJECTED by Customer`,
        html: htmlAdmin,
        attachments: getBrandingAttachments()
      });

      await createAdminNotification({
        type: 'Quote Rejected',
        senderName: data.user_name,
        senderEmail: data.user_email,
        subject: `Rejection: ${data.product_request.product_name}`,
        source: 'quote',
        sourceId: data.id,
        content: {
          status: 'rejected'
        }
      });

    } catch (error) {
      console.error('[NotificationService] Error in notifyQuoteRejected:', error);
    }
  }
};

module.exports = NotificationService;