// backend/src/utils/emailTemplates.js
const path = require('path');

/**
 * Mapeo de rutas de imágenes. 
 * Asumimos que backend y frontend son carpetas hermanas.
 * Ajusta '../frontend' si tu estructura de carpetas es diferente.
 */
const ICONS_PATH = path.join(__dirname, '../../../frontend/public/icons');

const theme = {
  colors: {
    primary: '#3b82f6', // Azul MedBay
    secondary: '#0f172a', // Slate 900
    bg: '#f8fafc',
    text: '#334155',
    white: '#ffffff'
  }
};

/**
 * Genera el HTML del correo
 * @param {string} title - Título principal del correo
 * @param {object} data - Objeto con la información a mostrar (Clave: Valor)
 * @param {string} mainMessage - El mensaje principal o cuerpo del correo
 */
const generateHtml = (title, data, mainMessage) => {
  
  // Convertimos el objeto 'data' en filas de tabla HTML dinámicamente
  let dataRows = '';
  for (const [key, value] of Object.entries(data)) {
    // Solo mostramos campos que tengan valor y no sean internos
    if (value && key !== 'mensaje' && key !== 'adjuntos') {
      // Formateamos la clave (ej: "telefono_contacto" -> "Telefono Contacto")
      const label = key.replace(/_/g, ' ').toUpperCase();
      dataRows += `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; width: 30%; vertical-align: top;">
            ${label}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #0f172a; font-weight: 500;">
            ${value}
          </td>
        </tr>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: ${theme.colors.bg}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background-color: ${theme.colors.secondary}; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background-color: #f1f5f9; padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; }
        .logo-main { width: 180px; height: auto; }
        .logo-footer { width: 40px; height: auto; opacity: 0.5; margin-bottom: 10px; }
        .title { color: ${theme.colors.secondary}; font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 20px; }
        .message-box { background: #f8fafc; border-left: 4px solid ${theme.colors.primary}; padding: 20px; color: ${theme.colors.text}; font-style: italic; margin-bottom: 30px; border-radius: 4px; }
        .btn { display: inline-block; background: ${theme.colors.primary}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:logomedbayblanco" alt="MedBay" class="logo-main"/>
        </div>

        <div class="content">
          <h1 class="title">${title}</h1>
          
          ${mainMessage ? `<div class="message-box">"${mainMessage}"</div>` : ''}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
            ${dataRows}
          </table>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://medbay.com/admin" class="btn">Ir al Panel Administrativo</a>
          </div>
        </div>

        <div class="footer">
          <img src="cid:logomedbayicon" alt="MedBay Icon" class="logo-footer"/>
          <p>© 2025 MedBay - Global Access to Medical Devices.<br>
          Este es un correo automático, por favor no responder directamente.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Devuelve los adjuntos necesarios para que las imágenes se vean (CID embedding)
 */
const getBrandingAttachments = () => {
  return [
    {
      filename: 'logocompletoblanco.png',
      path: path.join(ICONS_PATH, 'logocompletoblanco.png'),
      cid: 'logomedbayblanco' // Mismo ID que en el HTML src="cid:..."
    },
    {
      filename: 'logomed.png',
      path: path.join(ICONS_PATH, 'logomed.png'),
      cid: 'logomedbayicon'
    }
  ];
};

module.exports = { generateHtml, getBrandingAttachments };