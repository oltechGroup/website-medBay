// backend/src/controllers/contactController.js

const nodemailer = require('nodemailer');
const db = require('../config/database'); 
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
  const { 
    nombre, email, asunto, mensaje, tipo = 'Contacto General',
    product_id, product_sku, product_name, requested_quantity, requested_type, manufacturer
  } = req.body;

  const archivosAdjuntos = req.files || []; 

  try {
    let htmlContent = '';
    let dbContent = {}; 
    let source = 'notification'; 
    let sourceId = null;

    // === LÓGICA DE SELECCIÓN DE TEMPLATE (ENTRANTE) ===
    if (tipo === 'Solicitud de Cotización') {
      source = 'quote'; 
      sourceId = product_id ? String(product_id) : null; // Nos aseguramos que sea string para varchar(255)

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
      const contactData = {
        userName: nombre,
        userEmail: email,
        subject: asunto,
        message: mensaje
      };
      htmlContent = generateContactTemplate(contactData);

      dbContent = {
        mensaje,
        contact_details: { ...req.body } 
      };
    }

    // --- 1. PROCESO CRÍTICO: GUARDAR EN BASE DE DATOS ---
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
        source,    
        sourceId   
      ]
    );

    // --- 2. PROCESO SECUNDARIO: ENVIAR CORREO AL ADMIN ---
    // Lo blindamos para que si falla Nodemailer, el cliente igual vea el mensaje de éxito.
    try {
      await transporter.sendMail({
        from: `"${nombre} | MedBay Web" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com", 
        replyTo: email,
        subject: `🔔 ${tipo}: ${asunto}`,
        html: htmlContent,
        attachments: [...getBrandingAttachments(), ...archivosAdjuntos]
      });
    } catch (emailError) {
      console.error('⚠️ Advertencia: Mensaje guardado en BD, pero falló el envío de correo al Admin:', emailError);
    }

    // --- 3. RESPUESTA DE ÉXITO ---
    res.status(200).json({ success: true, message: 'Solicitud procesada correctamente.' });

  } catch (error) {
    console.error('🔥 Error crítico en sendContactEmail (Base de datos):', error);
    res.status(500).json({ success: false, error: 'Error interno al guardar el mensaje.' });
  }
};

// --- RESPONDER (Admin -> Cliente) ---
const replyToEmail = async (req, res) => {
  const { 
    targetEmail, 
    subject, 
    message, 
    originalSubject,
    quoteDetails, 
    recipientName 
  } = req.body;

  if (!targetEmail || !message) {
    return res.status(400).json({ success: false, error: 'Faltan datos obligatorios (email o mensaje).' });
  }

  try {
    const finalSubject = subject || `RE: ${originalSubject || 'Soporte MedBay'}`;
    let htmlContent = '';

    if (quoteDetails) {
      htmlContent = generateQuoteResponseTemplate({
        userName: recipientName || 'Cliente',
        productName: quoteDetails.name,
        sku: quoteDetails.sku,
        quantity: quoteDetails.quantity,
        message: message
      });
    } else {
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
    // Como la única función de este endpoint es enviar un correo, si falla, SÍ devolvemos el error.
    res.status(500).json({ success: false, error: 'No se pudo enviar el correo de respuesta.' });
  }
};

module.exports = { sendContactEmail, replyToEmail };