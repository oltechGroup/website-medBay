// backend/src/utils/emailTemplates.js

const path = require('path');

// Ajusta la ruta relativa a donde tengas tus iconos en el backend o frontend
// Nota: Asegúrate de que esta ruta apunte correctamente a tu carpeta public/icons
const ICONS_PATH = path.join(__dirname, '../../../frontend/public/icons');

const theme = {
  colors: {
    primary: '#3b82f6', // Azul MedBay
    secondary: '#0f172a', // Slate 900
    success: '#10b981', // Emerald
    danger: '#ef4444', // Red
    bg: '#f8fafc',
    text: '#334155',
    accent: '#f1f5f9',
    white: '#ffffff'
  }
};

// --- BASE HTML WRAPPER (Estructura General) ---
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
      
      /* Tablas de Datos */
      .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      .info-table td { padding: 12px 10px; border-bottom: 1px solid ${theme.colors.accent}; vertical-align: top; }
      .label { font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; width: 35%; letter-spacing: 0.5px; }
      .value { font-size: 14px; font-weight: 600; color: ${theme.colors.secondary}; }
      
      /* Cajas de Mensaje */
      .message-box { background-color: ${theme.colors.accent}; border-left: 4px solid ${theme.colors.primary}; padding: 20px; border-radius: 4px; margin: 20px 0; font-style: italic; color: #475569; }
      .success-box { background-color: #ecfdf5; border-left: 4px solid ${theme.colors.success}; color: #065f46; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      .danger-box { background-color: #fef2f2; border-left: 4px solid ${theme.colors.danger}; color: #991b1b; padding: 15px; border-radius: 4px; margin-bottom: 20px; }

      /* Botones */
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
        <p>© 2025 MedBay - Global Access to Medical Devices.<br>Este es un mensaje automático del sistema.</p>
      </div>
    </div>
  </body>
  </html>
`;

// ==========================================
// 📥 TEMPLATES ENTRANTES (CLIENTE -> ADMIN)
// ==========================================

// 1. SOLICITUD DE COTIZACIÓN
const generateQuoteTemplate = (data) => {
  const content = `
    <p class="subtitle">Un usuario ha solicitado precio e inventario para un producto.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
      <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Producto de Interés</div>
      <div style="font-size: 16px; font-weight: 800; color: ${theme.colors.secondary}; margin-bottom: 10px;">${data.productName}</div>
      
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">SKU Global</td><td class="value" style="font-family: monospace;">${data.sku}</td></tr>
        <tr><td class="label">Fabricante</td><td class="value">${data.manufacturer}</td></tr>
        <tr><td class="label">Cantidad</td><td class="value" style="color: ${theme.colors.primary}; font-size: 16px;">${data.quantity} Unidades</td></tr>
        <tr><td class="label">Tipo</td><td class="value">${data.type}</td></tr>
      </table>
    </div>

    <div class="label" style="margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Datos del Solicitante</div>
    <table class="info-table">
      <tr><td class="label">Nombre</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Email</td><td class="value"><a href="mailto:${data.userEmail}" style="color:${theme.colors.primary}">${data.userEmail}</a></td></tr>
      ${data.phone ? `<tr><td class="label">Teléfono</td><td class="value">${data.phone}</td></tr>` : ''}
    </table>

    ${data.message ? `<div class="label" style="margin-top: 25px;">Notas Adicionales:</div><div class="message-box">"${data.message}"</div>` : ''}
  `;
  return wrapHtml(`Nueva Cotización Requerida`, content, { text: 'Gestionar en Dashboard', url: 'https://medbay.com/dashboard' });
};

// 2. CONTACTO GENERAL
const generateContactTemplate = (data) => {
  const content = `
    <p class="subtitle">Has recibido un nuevo mensaje desde el formulario de contacto.</p>
    
    <table class="info-table">
      <tr><td class="label">Remitente</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Email</td><td class="value">${data.userEmail}</td></tr>
      ${data.phone ? `<tr><td class="label">Teléfono</td><td class="value">${data.phone}</td></tr>` : ''}
      <tr><td class="label">Asunto</td><td class="value">${data.subject}</td></tr>
    </table>
    
    <div class="label" style="margin-top: 25px;">Mensaje:</div>
    <div class="message-box">${data.message}</div>
  `;
  return wrapHtml(`Nuevo Mensaje de Contacto`, content, { text: 'Responder en Dashboard', url: 'https://medbay.com/dashboard' });
};

// 3. REGISTRO DE USUARIO (NUEVO DISEÑO BONITO) ✅
const generateRegisterTemplate = (data) => {
  const content = `
    <p class="subtitle">Nueva solicitud de acceso a la plataforma B2B.</p>

    <div style="text-align: center; margin-bottom: 25px;">
      <span style="background: ${theme.colors.secondary}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
        Perfil: ${data.roleName}
      </span>
    </div>

    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px;">
      <table class="info-table" style="margin: 0;">
        <tr style="background: #f8fafc;"><td colspan="2" style="font-weight: bold; color: ${theme.colors.primary}; padding: 10px;">Información Personal</td></tr>
        <tr><td class="label">Nombre</td><td class="value">${data.fullName}</td></tr>
        <tr><td class="label">Email</td><td class="value">${data.email}</td></tr>
        <tr><td class="label">Teléfono</td><td class="value">${data.phone || 'N/A'}</td></tr>
        
        <tr style="background: #f8fafc;"><td colspan="2" style="font-weight: bold; color: ${theme.colors.primary}; padding: 10px; border-top: 1px solid #e2e8f0;">Datos Fiscales</td></tr>
        <tr><td class="label">Empresa</td><td class="value">${data.company || 'Persona Física'}</td></tr>
        <tr><td class="label">RFC / Tax ID</td><td class="value" style="font-family: monospace;">${data.taxId || 'N/A'}</td></tr>
        
        <tr style="background: #f8fafc;"><td colspan="2" style="font-weight: bold; color: ${theme.colors.primary}; padding: 10px; border-top: 1px solid #e2e8f0;">Domicilio Fiscal</td></tr>
        <tr><td colspan="2" class="value" style="font-weight: 500; line-height: 1.5;">${data.fullAddress}</td></tr>
      </table>
    </div>
    
    <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">
      El usuario ha adjuntado documentación que requiere revisión manual.
    </p>
  `;
  return wrapHtml(`Validación de Cuenta Requerida`, content, { text: 'Validar Documentos en Dashboard', url: 'https://medbay.com/dashboard' });
};


// ==========================================
// 📤 TEMPLATES SALIENTES (ADMIN -> CLIENTE)
// ==========================================

// 4. RESPUESTA A COTIZACIÓN (NUEVO) ✅
const generateQuoteResponseTemplate = (data) => {
  const content = `
    <p>Estimado/a <strong>${data.userName}</strong>,</p>
    <p>Hemos procesado tu solicitud de cotización para el siguiente producto:</p>

    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${theme.colors.secondary};">
      <div style="font-size: 14px; font-weight: bold; color: ${theme.colors.secondary};">${data.productName}</div>
      <div style="font-size: 12px; color: #64748b;">Cantidad Solicitada: ${data.quantity} | SKU: ${data.sku}</div>
    </div>

    <p style="font-weight: bold; color: ${theme.colors.primary};">Respuesta de nuestro equipo:</p>
    <div class="message-box" style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${theme.colors.success};">
      ${data.message.replace(/\n/g, '<br>')}
    </div>

    <p>Si deseas proceder con la compra o tienes más dudas, puedes responder directamente a este correo.</p>
  `;
  return wrapHtml(`Respuesta a tu Cotización #${data.sku}`, content, { text: 'Ver Catálogo Completo', url: 'https://medbay.com/products' });
};

// 5. RESPUESTA GENERAL / APROBACIÓN / RECHAZO
const generateResponseTemplate = (title, message, isSuccess = true) => {
  // Detectamos si es un mensaje de éxito o alerta para cambiar el color
  const boxClass = isSuccess ? 'success-box' : 'danger-box';
  
  const content = `
    <div class="${boxClass}">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <p style="font-size: 13px; color: #64748b;">
      Si tienes alguna pregunta adicional, nuestro equipo de soporte está disponible para ayudarte.
    </p>
  `;
  return wrapHtml(title, content, null); // Sin botón de acción por defecto
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
  generateRegisterTemplate, 
  generateQuoteResponseTemplate,
  generateResponseTemplate,
  getBrandingAttachments 
};