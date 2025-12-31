// backend/src/utils/emailTemplates.js

const path = require('path');

// Ajusta la ruta relativa según tu estructura de carpetas
const ICONS_PATH = path.join(__dirname, '../../../frontend/public/icons');

const theme = {
  colors: {
    primary: '#3b82f6', // Azul MedBay
    secondary: '#0f172a', // Slate 900
    bg: '#f8fafc',
    text: '#334155',
    accent: '#f1f5f9'
  }
};

// --- BASE HTML WRAPPER (Para no repetir código) ---
const wrapHtml = (title, content, showAdminButton = false) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica', 'Arial', sans-serif; background-color: ${theme.colors.bg}; margin: 0; padding: 0; color: ${theme.colors.text}; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
      .header { background-color: ${theme.colors.secondary}; padding: 30px 20px; text-align: center; }
      .logo { width: 150px; height: auto; }
      .body { padding: 40px 30px; }
      .title { color: ${theme.colors.secondary}; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 20px; text-align: center; }
      .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      .info-table td { padding: 12px 10px; border-bottom: 1px solid ${theme.colors.accent}; }
      .label { font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; width: 35%; }
      .value { font-size: 14px; font-weight: 600; color: ${theme.colors.secondary}; }
      .message-box { background-color: ${theme.colors.accent}; border-left: 4px solid ${theme.colors.primary}; padding: 20px; border-radius: 4px; margin: 20px 0; font-style: italic; }
      .btn { display: block; width: fit-content; margin: 30px auto 0; background: ${theme.colors.primary}; color: white; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 14px; }
      .footer { background-color: ${theme.colors.accent}; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
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
        ${showAdminButton ? `<a href="https://medbay.com/dashboard" class="btn">Gestionar en Dashboard</a>` : ''}
      </div>
      <div class="footer">
        <p>© 2025 MedBay - Soluciones Médicas Integrales.</p>
      </div>
    </div>
  </body>
  </html>
`;

// --- 1. TEMPLATE COTIZACIÓN (Admin) ---
const generateQuoteTemplate = (data) => {
  const content = `
    <p style="text-align: center; margin-bottom: 30px;">
      El usuario <strong>${data.userName}</strong> ha solicitado cotización para el siguiente producto sin stock visible.
    </p>

    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">Producto</td><td class="value">${data.productName}</td></tr>
        <tr><td class="label">SKU Global</td><td class="value" style="font-family: monospace;">${data.sku}</td></tr>
        <tr><td class="label">Fabricante</td><td class="value">${data.manufacturer}</td></tr>
        <tr><td class="label">Cantidad</td><td class="value" style="color: ${theme.colors.primary}; font-size: 16px;">${data.quantity} Unidades</td></tr>
        <tr><td class="label">Tipo Requerido</td><td class="value">${data.type}</td></tr>
      </table>
    </div>

    <div class="label" style="margin-top: 20px;">Datos del Solicitante:</div>
    <table class="info-table">
      <tr><td class="label">Nombre</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Email</td><td class="value"><a href="mailto:${data.userEmail}" style="color:${theme.colors.primary}">${data.userEmail}</a></td></tr>
    </table>

    ${data.message ? `<div class="label" style="margin-top: 20px;">Notas Adicionales:</div><div class="message-box">"${data.message}"</div>` : ''}
  `;
  return wrapHtml(`Nueva Solicitud de Cotización`, content, true);
};

// --- 2. TEMPLATE CONTACTO GENERAL (Admin) ---
const generateContactTemplate = (data) => {
  const content = `
    <table class="info-table">
      <tr><td class="label">Remitente</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Email</td><td class="value">${data.userEmail}</td></tr>
      <tr><td class="label">Asunto</td><td class="value">${data.subject}</td></tr>
    </table>
    
    <div class="label" style="margin-top: 20px;">Mensaje:</div>
    <div class="message-box">${data.message}</div>
  `;
  return wrapHtml(`Nuevo Mensaje de Contacto`, content, true);
};

// --- 3. TEMPLATE RESPUESTA (Cliente) ---
const generateResponseTemplate = (message) => {
  const content = `
    <p>Estimado cliente,</p>
    <p>En respuesta a su solicitud reciente, nuestro equipo administrativo le informa:</p>
    <div class="message-box" style="background: #fff; border-left-color: ${theme.colors.secondary};">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <p>Quedamos a su disposición para cualquier duda adicional.</p>
  `;
  // NOTA: Aquí showAdminButton es false
  return wrapHtml(`Respuesta a su Solicitud MedBay`, content, false);
};

const getBrandingAttachments = () => {
  return [
    {
      filename: 'logocompletoblanco.png',
      path: path.join(ICONS_PATH, 'logocompletoblanco.png'),
      cid: 'logomedbayblanco'
    }
  ];
};

module.exports = { 
  generateQuoteTemplate, 
  generateContactTemplate, 
  generateResponseTemplate,
  getBrandingAttachments 
};