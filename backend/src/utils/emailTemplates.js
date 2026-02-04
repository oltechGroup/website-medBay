// backend/src/utils/emailTemplates.js

const path = require('path');

// ✅ Regresamos a la ruta relativa que funcionaba
const ICONS_PATH = path.join(__dirname, '../../../frontend/public/icons');

const theme = {
  colors: {
    primary: '#3b82f6', // Azul MedBay
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
      
      /* Tablas */
      .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      .info-table td { padding: 12px 10px; border-bottom: 1px solid ${theme.colors.accent}; vertical-align: top; }
      .label { font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; width: 35%; letter-spacing: 0.5px; }
      .value { font-size: 14px; font-weight: 600; color: ${theme.colors.secondary}; }
      
      /* Cajas */
      .message-box { background-color: ${theme.colors.accent}; border-left: 4px solid ${theme.colors.primary}; padding: 20px; border-radius: 4px; margin: 20px 0; font-style: italic; color: #475569; }
      .success-box { background-color: #ecfdf5; border-left: 4px solid ${theme.colors.success}; color: #065f46; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      .danger-box { background-color: #fef2f2; border-left: 4px solid ${theme.colors.danger}; color: #991b1b; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      .warning-box { background-color: #fffbeb; border-left: 4px solid ${theme.colors.warning}; color: #92400e; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      .bank-box { background-color: #f0f9ff; border: 1px dashed ${theme.colors.primary}; padding: 15px; border-radius: 8px; margin: 20px 0; }

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
// 📦 TEMPLATES DE ÓRDENES (CLIENTE)
// ==========================================

// 1. CLIENTE: CONFIRMACIÓN DE SOLICITUD
const generateOrderReceivedTemplate = (data) => {
  const content = `
    <p class="subtitle">Hemos recibido tu solicitud de orden <strong>#${data.orderId.slice(0,8)}</strong>.</p>
    
    <div class="warning-box">
      <strong>Estado: Revisión de Stock</strong><br>
      Estamos verificando la disponibilidad inmediata de los lotes solicitados con nuestros proveedores.
    </div>

    <p style="font-size: 13px; color: #64748b; text-align: center;">
      No realices ningún pago aún. Te notificaremos en menos de 24 horas cuando tu orden sea aprobada para proceder.
    </p>

    <div style="margin-top: 20px;">
      <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Resumen de Solicitud</div>
      ${data.items.map(item => `
        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; font-weight: 600; color: ${theme.colors.secondary};">
            ${item.quantity}x ${item.product_name}
            <div style="font-size: 11px; color: #94a3b8; font-weight: normal;">Lote: ${item.lot_number || 'N/A'}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  return wrapHtml(`Solicitud Recibida`, content, { text: 'Ver Mis Pedidos', url: 'http://localhost:3000/orders' });
};

// 2. CLIENTE: APROBACIÓN DE STOCK + DATOS BANCARIOS
const generateOrderApprovedTemplate = (data) => {
  const content = `
    <div class="success-box">
      <strong>¡Buenas noticias!</strong><br>
      Hemos confirmado el stock para tu orden <strong>#${data.orderId.slice(0,8)}</strong>.
    </div>

    <p style="text-align: center; color: ${theme.colors.text}; margin-bottom: 5px;">
      El inventario ha sido reservado por 24 horas.
    </p>
    
    <div class="bank-box">
      <div style="text-align: center; font-weight: bold; color: ${theme.colors.primary}; margin-bottom: 10px; text-transform: uppercase; font-size: 12px;">Instrucciones de Pago</div>
      <table class="info-table" style="margin: 0; background: transparent;">
        <tr><td class="label">Monto Exacto</td><td class="value" style="font-size: 18px;">$${data.total} USD</td></tr>
        <tr><td class="label">Banco</td><td class="value">BBVA México</td></tr>
        <tr><td class="label">Beneficiario</td><td class="value">MedBay S.A. de C.V.</td></tr>
        <tr><td class="label">CLABE</td><td class="value" style="font-family: monospace; letter-spacing: 1px;">012 180 01589634 7890</td></tr>
        <tr><td class="label">Concepto</td><td class="value">ORD-${data.orderId.slice(0,8)}</td></tr>
      </table>
      <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 10px;">
        *Si prefieres pagar con tarjeta, utiliza el botón de abajo para ir a la pasarela de pago segura.
      </p>
    </div>
  `;
  return wrapHtml(`Stock Confirmado: Acción Requerida`, content, { text: 'Subir Comprobante / Pagar', url: 'http://localhost:3000/orders' });
};

// 3. CLIENTE: RECHAZO DE STOCK
const generateOrderRejectedTemplate = (data) => {
  const content = `
    <div class="danger-box">
      <strong>Solicitud Cancelada</strong><br>
      Lamentablemente, uno o más lotes de tu orden <strong>#${data.orderId.slice(0,8)}</strong> ya no están disponibles con el proveedor.
    </div>
    <p>
      Tu orden ha sido cancelada y no se ha generado ningún cobro. Te invitamos a revisar lotes alternativos en nuestra plataforma o solicitar una cotización personalizada.
    </p>
  `;
  return wrapHtml(`Actualización de Orden`, content, { text: 'Ver Catálogo', url: 'http://localhost:3000/products' });
};

// 4. CLIENTE: CONFIRMACIÓN DE ENVÍO
const generateOrderShippedTemplate = (data) => {
  const content = `
    <div class="success-box">
      <strong>¡Tu pedido está en camino!</strong>
    </div>
    
    <p>Tu orden <strong>#${data.orderId.slice(0,8)}</strong> ha sido recolectada por la paquetería.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border: 2px dashed #cbd5e1; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Número de Rastreo</div>
      <div style="font-size: 24px; font-weight: 800; color: ${theme.colors.secondary}; letter-spacing: 2px; margin-top: 5px;">
        ${data.trackingNumber || 'PENDIENTE'}
      </div>
    </div>
  `;
  return wrapHtml(`Orden Enviada`, content, { text: 'Rastrear Paquete', url: 'http://localhost:3000/orders' });
};

// 5. CLIENTE: CONFIRMACIÓN DE COTIZACIÓN CREADA (Nuevo)
// ✅ ACTUALIZADO: Muestra contexto si existe (Lote específico)
const generateQuoteCreatedClientTemplate = (data) => {
  // Verificamos si hay contexto inteligente
  const contextHtml = data.context && data.context.lotNumber ? `
    <div style="margin-top:10px; padding-top:10px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #64748b;">
      <strong>Referencia Específica:</strong><br>
      Solicitud ligada al Lote: <span style="font-family: monospace; color: ${theme.colors.primary};">${data.context.lotNumber}</span>
    </div>
  ` : '';

  const content = `
    <p class="subtitle">Hemos recibido tu solicitud de cotización.</p>
    
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <div style="font-size: 14px; font-weight: bold; color: ${theme.colors.secondary};">${data.productName}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 5px;">SKU: ${data.sku} | Cantidad: ${data.quantity}</div>
      ${contextHtml}
    </div>

    <div class="message-box">
      "Gracias por tu interés. Nuestro equipo de ventas está contactando a los proveedores para conseguirte el mejor precio y fecha de caducidad disponible."
    </div>

    <p style="font-size: 13px; text-align: center; color: #64748b;">
      Recibirás una propuesta formal en un plazo máximo de <strong>48 horas hábiles</strong>.
    </p>
  `;
  return wrapHtml(`Solicitud de Cotización Recibida`, content, { text: 'Ver Mis Cotizaciones', url: 'http://localhost:3000/quotes' });
};

// ==========================================
// 👔 TEMPLATES PARA EL ADMIN
// ==========================================

// 1. ADMIN: NOTIFICACIÓN DE NUEVA ORDEN
const generateNewOrderAdminTemplate = (data) => {
  const content = `
    <p class="subtitle">Se ha generado una nueva solicitud de compra.</p>
    
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">Orden ID</td><td class="value">#${data.orderId.slice(0,8)}</td></tr>
        <tr><td class="label">Cliente</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Monto Total</td><td class="value" style="color: ${theme.colors.primary};">$${data.total} USD</td></tr>
        <tr><td class="label">Items</td><td class="value">${data.itemCount} productos</td></tr>
      </table>
    </div>

    <div class="warning-box" style="text-align: center;">
      <strong>Acción Requerida:</strong><br>
      Verificar disponibilidad de stock y aprobar/rechazar la orden.
    </div>
  `;
  return wrapHtml(`🔔 Nueva Orden Pendiente`, content, { text: 'Gestionar Orden en Dashboard', url: 'http://localhost:3000/dashboard/orders' });
};

// 2. ADMIN: PAGO SUBIDO (Nuevo)
const generatePaymentUploadedTemplate = (data) => {
  const content = `
    <p class="subtitle">Un cliente ha subido un comprobante de pago.</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 20px;">
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">Orden ID</td><td class="value">#${data.orderId.slice(0,8)}</td></tr>
        <tr><td class="label">Cliente</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Total Orden</td><td class="value">$${data.total} USD</td></tr>
      </table>
    </div>

    <div class="success-box" style="text-align: center;">
      <strong>Nuevo Archivo Adjunto:</strong><br>
      Revisa la evidencia de transferencia en el panel.
    </div>
  `;
  return wrapHtml(`💸 Pago Recibido: #${data.orderId.slice(0,8)}`, content, { text: 'Validar Pago', url: 'http://localhost:3000/dashboard/orders' });
};

// 3. ADMIN: COTIZACIÓN ACEPTADA (Nuevo)
const generateQuoteAcceptedAdminTemplate = (data) => {
  const content = `
    <div class="success-box" style="text-align: center; margin-bottom: 25px;">
      <strong style="font-size: 18px;">¡Cotización Aceptada!</strong>
    </div>

    <p class="subtitle">El cliente ha aceptado la propuesta comercial.</p>
    
    <table class="info-table">
        <tr><td class="label">Cotización ID</td><td class="value">#${data.quoteId.slice(0,8)}</td></tr>
        <tr><td class="label">Cliente</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Producto</td><td class="value">${data.productName}</td></tr>
        <tr><td class="label">Cantidad</td><td class="value">${data.quantity}</td></tr>
        <tr><td class="label">Precio Acordado</td><td class="value" style="color: ${theme.colors.success};">$${data.total} USD</td></tr>
    </table>

    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
      El siguiente paso es convertir esta cotización en una Orden de Compra o contactar al cliente para finalizar el pago.
    </p>
  `;
  return wrapHtml(`✅ Cotización Cerrada`, content, { text: 'Procesar Venta', url: 'http://localhost:3000/dashboard/quotes' });
};

// 4. ADMIN: COTIZACIÓN RECHAZADA (Nuevo)
const generateQuoteRejectedAdminTemplate = (data) => {
  const content = `
    <div class="warning-box" style="text-align: center; margin-bottom: 25px;">
      <strong style="font-size: 16px;">Propuesta Rechazada</strong>
    </div>

    <p class="subtitle">El cliente no aceptó la propuesta actual.</p>
    
    <table class="info-table">
        <tr><td class="label">Cotización ID</td><td class="value">#${data.quoteId.slice(0,8)}</td></tr>
        <tr><td class="label">Cliente</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Producto</td><td class="value">${data.productName}</td></tr>
    </table>

    <div class="message-box">
      <strong>Estrategia de Ventas:</strong><br>
      Puedes intentar enviar una contra-propuesta con un mejor precio o buscar un lote diferente.
    </div>
  `;
  return wrapHtml(`⚠️ Cotización Rechazada`, content, { text: 'Ver Detalles y Re-cotizar', url: 'http://localhost:3000/dashboard/quotes' });
};

// ==========================================
// 🛡️ TEMPLATES DE SEGURIDAD / PERFIL (NUEVO)
// ==========================================

// 1. ADMIN: ALERTA DE CAMBIO DE DIRECCIÓN FISCAL
const generateFiscalAddressChangeTemplate = (data) => {
  const content = `
    <div class="warning-box" style="border-left: 4px solid ${theme.colors.warning}; background: #fffbeb;">
      <strong style="color: #b45309;">⚠️ Alerta de Auditoría</strong><br>
      Un usuario ha modificado su dirección de facturación (Fiscal).
    </div>

    <table class="info-table">
      <tr><td class="label">Usuario</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Empresa</td><td class="value">${data.companyName || 'N/A'}</td></tr>
      <tr><td class="label">Email</td><td class="value">${data.userEmail}</td></tr>
    </table>

    <div class="label" style="margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Nueva Dirección Fiscal</div>
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.6; color: ${theme.colors.secondary};">
      ${data.newAddress}
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 15px; text-align: center;">
      Se recomienda verificar que la nueva dirección coincida con la Constancia de Situación Fiscal actualizada.
    </p>
  `;
  return wrapHtml(`⚠️ Actualización Fiscal: ${data.userName}`, content, { text: 'Revisar Perfil de Usuario', url: `http://localhost:3000/dashboard/users/${data.userId}` });
};

// 2. ADMIN: ALERTA DE ACTUALIZACIÓN DE DOCUMENTO
const generateDocumentUpdateTemplate = (data) => {
  const content = `
    <p class="subtitle">Un usuario ha subido una nueva versión de un documento legal.</p>

    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #dbeafe; margin-bottom: 20px;">
      <table class="info-table" style="margin-top: 0; background: transparent;">
        <tr><td class="label">Usuario</td><td class="value">${data.userName}</td></tr>
        <tr><td class="label">Tipo de Documento</td><td class="value" style="text-transform: capitalize;">${data.documentType.replace('_', ' ')}</td></tr>
        <tr><td class="label">Estado Actual</td><td class="value"><span style="background: ${theme.colors.warning}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">EN REVISIÓN</span></td></tr>
      </table>
    </div>

    ${data.notes ? `<div class="message-box"><strong>Nota del Usuario:</strong><br>"${data.notes}"</div>` : ''}

    <div class="success-box" style="text-align: center;">
      <strong>Acción Requerida:</strong><br>
      Validar la autenticidad del nuevo archivo adjunto.
    </div>
  `;
  return wrapHtml(`📄 Documento Actualizado: ${data.userName}`, content, { text: 'Validar Documento', url: `http://localhost:3000/dashboard/documents` });
};

// ==========================================
// 📥 TEMPLATES GENERALES (COTIZACIÓN INICIAL Y CONTACTO)
// ==========================================

const generateQuoteTemplate = (data) => {
  // ✅ ACTUALIZADO: Bloque Inteligente para el ADMIN
  // Si viene con contexto (Lote, Precio Ref), lo mostramos destacado.
  const contextHtml = data.context ? `
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe; margin: 20px 0;">
      <div style="font-size: 11px; font-weight: bold; color: #1e40af; text-transform: uppercase; margin-bottom: 8px;">Contexto Técnico (Origen)</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.context.lotNumber ? `<tr><td style="font-size: 13px; color: #64748b; padding: 2px 0;">Lote Visto:</td><td style="font-size: 13px; font-weight: bold; color: #1e3a8a; text-align: right;">${data.context.lotNumber}</td></tr>` : ''}
        ${data.context.referencePrice ? `<tr><td style="font-size: 13px; color: #64748b; padding: 2px 0;">Precio Referencia:</td><td style="font-size: 13px; font-weight: bold; color: #1e3a8a; text-align: right;">$${data.context.referencePrice} USD</td></tr>` : ''}
        ${data.context.expiryDate ? `<tr><td style="font-size: 13px; color: #64748b; padding: 2px 0;">Caducidad:</td><td style="font-size: 13px; font-weight: bold; color: #1e3a8a; text-align: right;">${data.context.expiryDate.split('T')[0]}</td></tr>` : ''}
      </table>
    </div>
  ` : '';

  const content = `
    <p class="subtitle">Nueva solicitud de cotización (Entrante).</p>
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
      <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Producto de Interés</div>
      <div style="font-size: 16px; font-weight: 800; color: ${theme.colors.secondary}; margin-bottom: 10px;">${data.productName}</div>
      <table class="info-table" style="margin-top: 0;">
        <tr><td class="label">SKU Global</td><td class="value" style="font-family: monospace;">${data.sku}</td></tr>
        <tr><td class="label">Cantidad</td><td class="value" style="color: ${theme.colors.primary}; font-size: 16px;">${data.quantity} Unidades</td></tr>
      </table>
      
      ${contextHtml}

    </div>
    <div class="label" style="margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Datos del Solicitante</div>
    <table class="info-table">
      <tr><td class="label">Nombre</td><td class="value">${data.userName}</td></tr>
      <tr><td class="label">Email</td><td class="value"><a href="mailto:${data.userEmail}" style="color:${theme.colors.primary}">${data.userEmail}</a></td></tr>
      ${data.phone ? `<tr><td class="label">Teléfono</td><td class="value">${data.phone}</td></tr>` : ''}
    </table>
    ${data.message ? `<div class="label" style="margin-top: 25px;">Notas Adicionales:</div><div class="message-box">"${data.message}"</div>` : ''}
  `;
  return wrapHtml(`Nueva Cotización Requerida`, content, { text: 'Gestionar en Dashboard', url: 'https://medbay.com/dashboard/quotes' });
};

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
      </table>
    </div>
    <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">
      El usuario ha adjuntado documentación que requiere revisión manual.
    </p>
  `;
  return wrapHtml(`Validación de Cuenta Requerida`, content, { text: 'Validar Documentos en Dashboard', url: 'https://medbay.com/dashboard' });
};

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
    <p>Ingresa a tu panel de usuario para aceptar esta oferta.</p>
  `;
  return wrapHtml(`Respuesta a tu Cotización #${data.sku}`, content, { text: 'Ver Mis Cotizaciones', url: 'https://medbay.com/quotes' });
};

const generateResponseTemplate = (title, message, isSuccess = true) => {
  const boxClass = isSuccess ? 'success-box' : 'danger-box';
  const content = `
    <div class="${boxClass}">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <p style="font-size: 13px; color: #64748b;">
      Si tienes alguna pregunta adicional, nuestro equipo de soporte está disponible para ayudarte.
    </p>
  `;
  return wrapHtml(title, content, null);
};

// ✅ Restuarado para adjuntar archivo físico con ruta relativa
const getBrandingAttachments = () => {
  return [
    {
      filename: 'logocompletoblanco.png',
      path: ICONS_PATH + '/logocompletoblanco.png', // Ajuste para asegurar la ruta correcta
      cid: 'logomedbayblanco'
    }
  ];
};

module.exports = { 
  // Cotizaciones (Admin)
  generateQuoteTemplate,
  generateQuoteAcceptedAdminTemplate,
  generateQuoteRejectedAdminTemplate,
  
  // Cotizaciones (Cliente)
  generateQuoteCreatedClientTemplate,
  generateQuoteResponseTemplate,
  
  // Órdenes (Cliente)
  generateOrderReceivedTemplate,
  generateOrderApprovedTemplate,
  generateOrderRejectedTemplate,
  generateOrderShippedTemplate,
  
  // Órdenes (Admin)
  generateNewOrderAdminTemplate, 
  generatePaymentUploadedTemplate,

  // Seguridad / Perfil (Nuevos)
  generateFiscalAddressChangeTemplate,
  generateDocumentUpdateTemplate,

  // Otros
  generateContactTemplate, 
  generateRegisterTemplate, 
  generateResponseTemplate,
  getBrandingAttachments 
};