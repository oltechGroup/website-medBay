//backend/src/controllers/contactController.js

const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const { 
  generateQuoteTemplate, 
  generateContactTemplate, 
  generateResponseTemplate, 
  getBrandingAttachments 
} = require('../utils/emailTemplates');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

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
    // Campos específicos de cotización
    product_id, product_sku, product_name, requested_quantity, requested_type, manufacturer
  } = req.body;

  const archivosAdjuntos = req.files || []; 

  try {
    let htmlContent = '';
    let dbContent = {}; // Lo que se guardará en el JSONB de la base de datos

    // === LÓGICA DE SELECCIÓN DE TEMPLATE ===
    if (tipo === 'Solicitud de Cotización') {
      // 1. Caso Cotización
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
        contact_details: { ...req.body } // Guardamos todo lo extra por si acaso
      };
    }

    // Guardar notificación en DB
    await pool.query(
      'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
      [tipo, nombre, email, asunto, JSON.stringify(dbContent)]
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
  const { targetEmail, subject, message, originalSubject } = req.body;

  if (!targetEmail || !message) {
    return res.status(400).json({ success: false, error: 'Datos incompletos.' });
  }

  try {
    const finalSubject = subject || `RE: ${originalSubject || 'Soporte MedBay'}`;
    
    // Usamos el template de respuesta limpio (sin botón de dashboard)
    const htmlContent = generateResponseTemplate(message);

    await transporter.sendMail({
      from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: finalSubject,
      html: htmlContent,
      attachments: getBrandingAttachments()
    });

    res.status(200).json({ success: true, message: 'Respuesta enviada.' });

  } catch (error) {
    console.error('🔥 Error en replyToEmail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendContactEmail, replyToEmail };