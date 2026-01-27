// backend/src/controllers/contactController.js

const nodemailer = require('nodemailer');
const db = require('../config/database'); // ✅ Usamos la conexión centralizada
const { 
  generateQuoteTemplate, 
  generateContactTemplate, 
  generateResponseTemplate,      
  generateQuoteResponseTemplate, 
  getBrandingAttachments 
} = require('../utils/emailTemplates');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- ENVIAR MENSAJE (Cliente -> Admin) ---
const sendContactEmail = async (req, res) => {
  // Extraemos todos los campos posibles
  const { 
    nombre, email, asunto, mensaje, tipo = 'Contacto General',
    // Campos específicos de cotización manual (Formulario antiguo)
    product_id, product_sku, product_name, requested_quantity, requested_type, manufacturer
  } = req.body;

  const archivosAdjuntos = req.files || []; 

  try {
    let htmlContent = '';
    let dbContent = {}; // Lo que se guardará en el JSONB
    let source = 'notification'; // Por defecto es notificación general
    let sourceId = null;

    // === LÓGICA DE SELECCIÓN DE TEMPLATE (ENTRANTE) ===
    if (tipo === 'Solicitud de Cotización') {
      // 1. Caso Cotización Manual
      source = 'quote'; // Esto permite filtrar en el Inbox como cotización
      sourceId = product_id || null; // Si hay ID de producto, lo usamos de referencia

      const quoteData = {
        userName: nombre,
        userEmail: email,
        productName: product_name,
        sku: product_sku,
        manufacturer: manufacturer,
        quantity: requested_quantity,
        type: requested_type,
        message: mensaje
      };
      htmlContent = generateQuoteTemplate(quoteData);
      
      // Estructura para DB (Dashboard)
      dbContent = {
        mensaje,
        product_details: {
          id: product_id,
          name: product_name,
          sku: product_sku,
          manufacturer,
          quantity: requested_quantity,
          type: requested_type
        },
        contact_info: { nombre, email }
      };

    } else {
      // 2. Caso Contacto General
      const contactData = {
        userName: nombre,
        userEmail: email,
        subject: asunto,
        message: mensaje
      };
      htmlContent = generateContactTemplate(contactData);

      // Estructura para DB (Dashboard)
      dbContent = {
        mensaje,
        contact_details: { ...req.body } 
      };
    }

    // ✅ Guardar notificación en DB con campos nuevos (source, source_id)
    await db.query(
      `INSERT INTO notifications 
       (type, sender_name, sender_email, subject, content, source, source_id, is_read) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [
        tipo, 
        nombre, 
        email, 
        asunto, 
        JSON.stringify(dbContent),
        source,    // 'quote' o 'notification'
        sourceId   // ID opcional para vincular
      ]
    );

    // Enviar Correo al Admin
    await transporter.sendMail({
      from: `"${nombre} | MedBay Web" <${process.env.EMAIL_USER}>`,
      to: "medbay.info02@gmail.com", // Tu correo de admin
      replyTo: email,
      subject: `🔔 ${tipo}: ${asunto}`,
      html: htmlContent,
      attachments: [...getBrandingAttachments(), ...archivosAdjuntos]
    });

    res.status(200).json({ success: true, message: 'Solicitud procesada correctamente.' });

  } catch (error) {
    console.error('🔥 Error en sendContactEmail:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
};

// --- RESPONDER (Admin -> Cliente) ---
const replyToEmail = async (req, res) => {
  const { 
    targetEmail, 
    subject, 
    message, 
    originalSubject,
    // Datos opcionales para respuesta de cotización
    quoteDetails, // { name, sku, quantity... }
    recipientName 
  } = req.body;

  if (!targetEmail || !message) {
    return res.status(400).json({ success: false, error: 'Faltan datos obligatorios (email o mensaje).' });
  }

  try {
    const finalSubject = subject || `RE: ${originalSubject || 'Soporte MedBay'}`;
    let htmlContent = '';

    // === LÓGICA DE SELECCIÓN DE TEMPLATE (SALIENTE) ===
    if (quoteDetails) {
      // ✅ 1. Respuesta a Cotización (Diseño Específico)
      htmlContent = generateQuoteResponseTemplate({
        userName: recipientName || 'Cliente',
        productName: quoteDetails.name,
        sku: quoteDetails.sku,
        quantity: quoteDetails.quantity,
        message: message
      });
    } else {
      // ✅ 2. Respuesta General (Diseño Estándar)
      htmlContent = generateResponseTemplate('Respuesta a su Solicitud', message, true);
    }

    await transporter.sendMail({
      from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: finalSubject,
      html: htmlContent,
      attachments: getBrandingAttachments()
    });

    res.status(200).json({ success: true, message: 'Respuesta enviada correctamente.' });

  } catch (error) {
    console.error('🔥 Error en replyToEmail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendContactEmail, replyToEmail };