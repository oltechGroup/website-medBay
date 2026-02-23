// backend/src/utils/emailTemplates.js

const path = require('path');
const fs = require('fs'); // ✅ IMPORTANT: Needed to verify file existence

// Define the expected path (but do not blindly trust it)
const ICONS_RELATIVE_PATH = '../../../frontend/public/icons';

const theme = {
  colors: {
    primary: '#3b82f6', // MedBay Blue
    secondary: '#0f172a', // Slate 900
    success: '#10b981', // Emerald
    danger: '#ef4444', // Red
    warning: '#f59e0b', // Amber
    bg: '#f8fafc',
    text: '#334155',
    accent: '#f1f5f9',
    white: '#ffffff'
  }
};

// --- BASE HTML WRAPPER ---
const wrapHtml = (title, content, actionButton = null) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: 'Helvetica', 'Arial', sans-serif; background-color: ${theme.colors.bg}; margin: 0; padding: 0; color: ${theme.colors.text}; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
      .header { background-color: ${theme.colors.secondary}; padding: 30px 20px; text-align: center; }
      .logo { width: 160px; height: auto; }
      .body { padding: 40px 30px; }
      .title { color: ${theme.colors.secondary}; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 10px; text-align: center; }
      .subtitle { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 30px; margin-top: 0; }
      
      /* Tables */
      .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      .info-table td { padding: 12px 10px; border-bottom: 1px solid ${theme.colors.accent}; vertical-align: top; }
      .label { font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; width: 35%; letter-spacing: 0.5px; }
      .value { font-size: 14px; font-weight: 600; color: ${theme.colors.secondary}; }
      
      /* Boxes */
      .message-box { background-color: ${theme.colors.accent}; border-left: 4px solid ${theme.colors.primary}; padding: 20px; border-radius: 4px; margin: 20px 0; font-style: italic; color: #475569; }
      .success-box { background-color: #ecfdf5; border-left: 4px solid ${theme.colors.success}; color: #065f46; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      .danger-box { background-color: #fef2f2; border-left: 4px solid ${theme.colors.danger}; color: #991b1b; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      .warning-box { background-color: #fffbeb; border-left: 4px solid ${theme.colors.warning}; color: #92400e; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      .bank-box { background-color: #f0f9ff; border: 1px dashed ${theme.colors.primary}; padding: 15px; border-radius: 8px; margin: 20px 0; }

      /* Buttons */
      .btn-container { text-align: center; margin-top: 35px; }
      .btn { display: inline-block; background: ${theme.colors.secondary}; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(15, 23, 42, 0.2); }
      
      .footer { background-color: ${theme.colors.accent}; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="cid:logomedbayblanco" alt="MedBay" class="logo"/>
      </div>
      <div class="body">
        <h1 class="title">${title}</h1>
        ${content}
        ${actionButton ? `<div class="btn-container"><a href="${actionButton.url}" class="btn">${actionButton.text}</a></div>` : ''}
      </div>
      <div class="footer">
        <p>© 2025 MedBay - Global Access to Medical Devices.<br>This is an automated system message.</p>
      </div>
    </div>
  </body>
  </html>
`;

// ==========================================
// 📦 ORDER TEMPLATES (CUSTOMER)
// ==========================================

// 1. CUSTOMER: REQUEST CONFIRMATION
const generateOrderReceivedTemplate = (data) => {
  const content = `
    <p class="subtitle">We have received your order request <strong>#${data.orderId.slice(0,8)}</strong>.</p>
    
    <div class="warning-box">
      <strong>Status: Stock Review</strong><br>
      We are checking the immediate availability of the requested lots with our suppliers.
    </div>

    <p style="font-size: 13px; color: #64748b; text-align: center;">
      Do not make any payments yet. We will notify you in less than 24 hours when your order is approved to proceed.
    </p>

    <div style="margin-top: 20px;">
      <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Request Summary</div>
      ${data.items.map(item => `
        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; font-weight: 600; color: ${theme.colors.secondary};">
            ${item.quantity}x ${item.product_name}
            <div style="font-size: 11px; color: #94a3b8; font-weight: normal;">Lot: ${item.lot_number || 'N/A'}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  return wrapHtml(`Request Received`, content, { text: 'View My Orders', url: 'https://medbaysupply.com/orders' });
};

// 2. CUSTOMER: STOCK APPROVAL + BANK DETAILS
const generateOrderApprovedTemplate = (data) => {
  const content = `
    <div class="success-box">
      <strong>Good news!</strong><br>
      We have confirmed the stock for your order <strong>#${data.orderId.slice(0,8)}</strong>.
    </div>

    <p style="text-align: center; color: ${theme.colors.text}; margin-bottom: 5px;">
      The inventory has been reserved for 24 hours.
    </p>
    
    <div class="bank-box">
      <div style="text-align: center; font-weight: bold; color: ${theme.colors.primary}; margin-bottom: 10px; text-transform: uppercase; font-size: 12px;">Payment Instructions</div>
      <table class="info-table" style="margin: 0; background: transparent;">
        <tr><td class="label">Exact Amount</td><td class="value" style="font-size: 18px;">$${data.total} USD</td></tr>
        <tr><td class="label">Bank</td><td class="value">BBVA Mexico</td></tr>
        <tr><td class="label">Beneficiary</td><td class="value">MedBay S.A. de C.V.</td></tr>
        <tr><td class="label">CLABE</td><td class="value" style="font-family: monospace; letter-spacing: 1px;">012 180 01589634 7890</td></tr>
        <tr><td class="label">Concept</td><td class="value">ORD-${data.orderId.slice(0,8)}</td></tr>
      </table>
      <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 10px;">
        *If you prefer to pay by card, use the button below to go to the secure payment gateway.
      </p>
    </div>
  `;
  return wrapHtml(`Stock Confirmed: Action Required`, content, { text: 'Upload Receipt / Pay', url: 'https://medbaysupply.com/orders' });
};

// 3. CUSTOMER: STOCK REJECTION
const generateOrderRejectedTemplate = (data) => {
  const content = `
    <div class="danger-box">
      <strong>Request Cancelled</strong><br>
      Unfortunately, one or more lots from your order <strong>#${data.orderId.slice(0,8)}</strong> are no longer available from the supplier.
    </div>
    <p>
      Your order has been cancelled and no charges have been generated. We invite you to review alternative lots on our platform or request a customized quote.
    </p>
  `;
  return wrapHtml(`Order Update`, content, { text: 'View Catalog', url: 'https://medbaysupply.com/products' });
};

// 4. CUSTOMER: SHIPPING CONFIRMATION
const generateOrderShippedTemplate = (data) => {
  const content = `
    <div class="success-box">
      <strong>Your order is on its way!</strong>
    </div>
    
    <p>Your order <strong>#${data.orderId.slice(0,8)}</strong> has been picked up by the courier.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border: 2px dashed #cbd5e1; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Tracking Number</div>
      <div style="font-size: 24px; font-weight: 800; color: ${theme.colors.secondary}; letter-spacing: 2px; margin-top: 5px;">
        ${data.trackingNumber || 'PENDING'}
      </div>
    </div>
  `;
  return wrapHtml(`Order Shipped`, content, { text: 'Track Package', url: 'https://medbaysupply.com/orders' });
};

// 5. CUSTOMER: QUOTE CREATION CONFIRMATION
const generateQuoteCreatedClientTemplate = (data) => {
  const contextHtml = data.context && data.context.lotNumber ? `
    <div style="margin-top:10px; padding-top:10px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #64748b;">
      <strong>Specific Reference:</strong><br>
      Request linked to Lot: <span style="font-family: monospace; color: ${theme.colors.primary};">${data.context.lotNumber}</span>
    </div>
  ` : '';

  const content = `
    <p class="subtitle">We have received your quote request.</p>
    
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <div style="font-size: 14px; font-weight: bold; color: ${theme.colors.secondary};">${data.productName}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 5px;">SKU: ${data.sku} | Quantity: ${data.quantity}</div>
      ${contextHtml}
    </div>

    <div class="message-box">
      "Thank you for your interest. Our sales team is contacting suppliers to get you the best price and available expiration date."
    </div>

    <p style="font-size: 13px; text-align: center; color: #64748b;">
      You will receive a formal proposal within a maximum of <strong>48 business hours</strong>.
    </p>
  `;
  return wrapHtml(`Quote Request Received`, content, { text: 'View My Quotes', url: 'https://medbaysupply.com/quotes' });
};

// ==========================================
// 👔 TEMPLATES FOR ADMIN
// ==========================================

// 1. ADMIN: NEW ORDER NOTIFICATION
const generateNewOrderAdminTemplate = (data) => {
  const content = `
    <p class="subtitle">A new purchase request has been generated.</p>
    
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">Order ID</td><td class="value">#${data.orderId.slice(0,8)}</td></tr>
        <tr><td class="label">Customer</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Total Amount</td><td class="value" style="color: ${theme.colors.primary};">$${data.total} USD</td></tr>
        <tr><td class="label">Items</td><td class="value">${data.itemCount} products</td></tr>
      </table>
    </div>

    <div class="warning-box" style="text-align: center;">
      <strong>Action Required:</strong><br>
      Verify stock availability and approve/reject the order.
    </div>
  `;
  return wrapHtml(`🔔 New Pending Order`, content, { text: 'Manage Order in Dashboard', url: 'https://medbaysupply.com/dashboard/orders' });
};

// 2. ADMIN: PAYMENT UPLOADED
const generatePaymentUploadedTemplate = (data) => {
  const content = `
    <p class="subtitle">A customer has uploaded a payment receipt.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 20px;">
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">Order ID</td><td class="value">#${data.orderId.slice(0,8)}</td></tr>
        <tr><td class="label">Customer</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Order Total</td><td class="value">$${data.total} USD</td></tr>
      </table>
    </div>

    <div class="success-box" style="text-align: center;">
      <strong>New Attachment:</strong><br>
      Review the transfer evidence in the dashboard.
    </div>
  `;
  return wrapHtml(`💸 Payment Received: #${data.orderId.slice(0,8)}`, content, { text: 'Validate Payment', url: 'https://medbaysupply.com/dashboard/orders' });
};

// 3. ADMIN: QUOTE ACCEPTED
const generateQuoteAcceptedAdminTemplate = (data) => {
  const content = `
    <div class="success-box" style="text-align: center; margin-bottom: 25px;">
      <strong style="font-size: 18px;">Quote Accepted!</strong>
    </div>

    <p class="subtitle">The customer has accepted the commercial proposal.</p>
    
    <table class="info-table">
        <tr><td class="label">Quote ID</td><td class="value">#${data.quoteId.slice(0,8)}</td></tr>
        <tr><td class="label">Customer</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Product</td><td class="value">${data.productName}</td></tr>
        <tr><td class="label">Quantity</td><td class="value">${data.quantity}</td></tr>
        <tr><td class="label">Agreed Price</td><td class="value" style="color: ${theme.colors.success};">$${data.total} USD</td></tr>
    </table>

    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
      The next step is to convert this quote into a Purchase Order or contact the customer to finalize the payment.
    </p>
  `;
  return wrapHtml(`✅ Quote Closed`, content, { text: 'Process Sale', url: 'https://medbaysupply.com/dashboard/quotes' });
};

// 4. ADMIN: QUOTE REJECTED
const generateQuoteRejectedAdminTemplate = (data) => {
  const content = `
    <div class="warning-box" style="text-align: center; margin-bottom: 25px;">
      <strong style="font-size: 16px;">Proposal Rejected</strong>
    </div>

    <p class="subtitle">The customer did not accept the current proposal.</p>
    
    <table class="info-table">
        <tr><td class="label">Quote ID</td><td class="value">#${data.quoteId.slice(0,8)}</td></tr>
        <tr><td class="label">Customer</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Product</td><td class="value">${data.productName}</td></tr>
    </table>

    <div class="message-box">
      <strong>Sales Strategy:</strong><br>
      You can try sending a counter-proposal with a better price or find a different lot.
    </div>
  `;
  return wrapHtml(`⚠️ Quote Rejected`, content, { text: 'View Details and Re-quote', url: 'https://medbaysupply.com/dashboard/quotes' });
};

// ==========================================
// 🛡️ SECURITY / PROFILE TEMPLATES
// ==========================================

// 1. ADMIN: FISCAL ADDRESS CHANGE ALERT
const generateFiscalAddressChangeTemplate = (data) => {
  const content = `
    <div class="warning-box" style="border-left: 4px solid ${theme.colors.warning}; background: #fffbeb;">
      <strong style="color: #b45309;">⚠️ Audit Alert</strong><br>
      A user has modified their billing (Fiscal) address.
    </div>

    <table class="info-table">
      <tr><td class="label">User</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Company</td><td class="value">${data.companyName || 'N/A'}</td></tr>
      <tr><td class="label">Email</td><td class="value">${data.userEmail}</td></tr>
    </table>

    <div class="label" style="margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">New Fiscal Address</div>
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.6; color: ${theme.colors.secondary};">
      ${data.newAddress}
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 15px; text-align: center;">
      It is recommended to verify that the new address matches the updated Tax Situation Certificate.
    </p>
  `;
  return wrapHtml(`⚠️ Fiscal Update: ${data.userName}`, content, { text: 'Review User Profile', url: `https://medbaysupply.com/dashboard/users/${data.userId}` });
};

// 2. ADMIN: DOCUMENT UPDATE ALERT
const generateDocumentUpdateTemplate = (data) => {
  const content = `
    <p class="subtitle">A user has uploaded a new version of a legal document.</p>

    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #dbeafe; margin-bottom: 20px;">
      <table class="info-table" style="margin-top: 0; background: transparent;">
        <tr><td class="label">User</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Document Type</td><td class="value" style="text-transform: capitalize;">${data.documentType.replace('_', ' ')}</td></tr>
        <tr><td class="label">Current Status</td><td class="value"><span style="background: ${theme.colors.warning}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">UNDER REVIEW</span></td></tr>
      </table>
    </div>

    ${data.notes ? `<div class="message-box"><strong>User Note:</strong><br>"${data.notes}"</div>` : ''}

    <div class="success-box" style="text-align: center;">
      <strong>Action Required:</strong><br>
      Validate the authenticity of the new attached file.
    </div>
  `;
  return wrapHtml(`📄 Document Updated: ${data.userName}`, content, { text: 'Validate Document', url: `https://medbaysupply.com/dashboard/documents` });
};

// ==========================================
// 📥 GENERAL TEMPLATES
// ==========================================

const generateQuoteTemplate = (data) => {
  const contextHtml = data.context ? `
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: bold; color: #1e40af; text-transform: uppercase; margin-bottom: 8px;">Technical Context (Origin)</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.context.lotNumber ? `<tr><td style="font-size: 13px; color: #64748b; padding: 2px 0;">Viewed Lot:</td><td style="font-size: 13px; font-weight: bold; color: #1e3a8a; text-align: right;">${data.context.lotNumber}</td></tr>` : ''}
        ${data.context.referencePrice ? `<tr><td style="font-size: 13px; color: #64748b; padding: 2px 0;">Ref Price:</td><td style="font-size: 13px; font-weight: bold; color: #1e3a8a; text-align: right;">$${data.context.referencePrice} USD</td></tr>` : ''}
        ${data.context.expiryDate ? `<tr><td style="font-size: 13px; color: #64748b; padding: 2px 0;">Expiration:</td><td style="font-size: 13px; font-weight: bold; color: #1e3a8a; text-align: right;">${data.context.expiryDate.split('T')[0]}</td></tr>` : ''}
      </table>
    </div>
  ` : '';

  const content = `
    <p class="subtitle">New quote request (Incoming).</p>
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
      <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Product of Interest</div>
      <div style="font-size: 16px; font-weight: 800; color: ${theme.colors.secondary}; margin-bottom: 10px;">${data.productName}</div>
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">Global SKU</td><td class="value" style="font-family: monospace;">${data.sku}</td></tr>
        <tr><td class="label">Quantity</td><td class="value" style="color: ${theme.colors.primary}; font-size: 16px;">${data.quantity} Units</td></tr>
      </table>
      
      ${contextHtml}

    </div>
    <div class="label" style="margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Requester Details</div>
    <table class="info-table">
      <tr><td class="label">Name</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Email</td><td class="value"><a href="mailto:${data.userEmail}" style="color:${theme.colors.primary}">${data.userEmail}</a></td></tr>
      ${data.phone ? `<tr><td class="label">Phone</td><td class="value">${data.phone}</td></tr>` : ''}
    </table>
    ${data.message ? `<div class="label" style="margin-top: 25px;">Additional Notes:</div><div class="message-box">"${data.message}"</div>` : ''}
  `;
  return wrapHtml(`New Quote Required`, content, { text: 'Manage in Dashboard', url: 'https://medbaysupply.com/dashboard/quotes' });
};

const generateContactTemplate = (data) => {
  const content = `
    <p class="subtitle">You have received a new message from the contact form.</p>
    <table class="info-table">
      <tr><td class="label">Sender</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Email</td><td class="value">${data.userEmail}</td></tr>
      ${data.phone ? `<tr><td class="label">Phone</td><td class="value">${data.phone}</td></tr>` : ''}
      <tr><td class="label">Subject</td><td class="value">${data.subject}</td></tr>
    </table>
    <div class="label" style="margin-top: 25px;">Message:</div>
    <div class="message-box">${data.message}</div>
  `;
  return wrapHtml(`New Contact Message`, content, { text: 'Reply in Dashboard', url: 'https://medbaysupply.com/dashboard' });
};

const generateRegisterTemplate = (data) => {
  const content = `
    <p class="subtitle">New B2B platform access request.</p>
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="background: ${theme.colors.secondary}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
        Profile: ${data.roleName}
      </span>
    </div>
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px;">
      <table class="info-table" style="margin: 0;">
        <tr style="background: #f8fafc;"><td colspan="2" style="font-weight: bold; color: ${theme.colors.primary}; padding: 10px;">Personal Information</td></tr>
        <tr><td class="label">Name</td><td class="value">${data.fullName}</td></tr>
        <tr><td class="label">Email</td><td class="value">${data.email}</td></tr>
        <tr><td class="label">Phone</td><td class="value">${data.phone || 'N/A'}</td></tr>
        <tr style="background: #f8fafc;"><td colspan="2" style="font-weight: bold; color: ${theme.colors.primary}; padding: 10px; border-top: 1px solid #e2e8f0;">Fiscal Data</td></tr>
        <tr><td class="label">Company</td><td class="value">${data.company || 'Individual'}</td></tr>
        <tr><td class="label">RFC / Tax ID</td><td class="value" style="font-family: monospace;">${data.taxId || 'N/A'}</td></tr>
      </table>
    </div>
    <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">
      The user has attached documentation that requires manual review.
    </p>
  `;
  return wrapHtml(`Account Validation Required`, content, { text: 'Validate Documents in Dashboard', url: 'https://medbaysupply.com/dashboard' });
};

const generateQuoteResponseTemplate = (data) => {
  const content = `
    <p>Dear <strong>${data.userName}</strong>,</p>
    <p>We have processed your quote request for the following product:</p>
    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${theme.colors.secondary};">
      <div style="font-size: 14px; font-weight: bold; color: ${theme.colors.secondary};">${data.productName}</div>
      <div style="font-size: 12px; color: #64748b;">Requested Quantity: ${data.quantity} | SKU: ${data.sku}</div>
    </div>
    <p style="font-weight: bold; color: ${theme.colors.primary};">Response from our team:</p>
    <div class="message-box" style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${theme.colors.success};">
      ${data.message.replace(/\n/g, '<br>')}
    </div>
    <p>Log in to your user panel to accept this offer.</p>
  `;
  return wrapHtml(`Response to your Quote #${data.sku}`, content, { text: 'View My Quotes', url: 'https://medbaysupply.com/quotes' });
};

const generateResponseTemplate = (title, message, isSuccess = true) => {
  const boxClass = isSuccess ? 'success-box' : 'danger-box';
  const content = `
    <div class="${boxClass}">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <p style="font-size: 13px; color: #64748b;">
      If you have any additional questions, our support team is available to help you.
    </p>
  `;
  return wrapHtml(title, content, null);
};

// ==========================================
// 🩹 ARMORED FUNCTION (500 ERROR FIX)
// ==========================================
// Verifies if the logo physically exists. If not, returns empty array
// to prevent Nodemailer from crashing when trying to read a non-existent path.
const getBrandingAttachments = () => {
  const logoPath = path.join(__dirname, ICONS_RELATIVE_PATH, 'logocompletoblanco.png');
  
  if (fs.existsSync(logoPath)) {
    return [
      {
        filename: 'logocompletoblanco.png',
        path: logoPath,
        cid: 'logomedbayblanco'
      }
    ];
  } else {
    // Warning log for the developer, but DOES NOT break the flow
    console.warn(`[EMAIL WARNING] Logo not found at: ${logoPath}. Sending email without branding.`);
    return [];
  }
};

module.exports = { 
  // Quotes (Admin)
  generateQuoteTemplate,
  generateQuoteAcceptedAdminTemplate,
  generateQuoteRejectedAdminTemplate,
  
  // Quotes (Customer)
  generateQuoteCreatedClientTemplate,
  generateQuoteResponseTemplate,
  
  // Orders (Customer)
  generateOrderReceivedTemplate,
  generateOrderApprovedTemplate,
  generateOrderRejectedTemplate,
  generateOrderShippedTemplate,
  
  // Orders (Admin)
  generateNewOrderAdminTemplate, 
  generatePaymentUploadedTemplate,

  // Security / Profile (New)
  generateFiscalAddressChangeTemplate,
  generateDocumentUpdateTemplate,

  // Others
  generateContactTemplate, 
  generateRegisterTemplate, 
  generateResponseTemplate,
  getBrandingAttachments 
};