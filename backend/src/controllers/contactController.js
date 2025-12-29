//backend/src/controllers/contactController.js

const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const { generateHtml, getBrandingAttachments } = require('../utils/emailTemplates');

// Configuración de Base de Datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- FUNCIÓN 1: RECIBIR MENSAJE (DEL CLIENTE AL ADMIN) ---
const sendContactEmail = async (req, res) => {
  const { nombre, email, asunto, mensaje, tipo = 'Contacto General', ...rest } = req.body;
  const archivosAdjuntos = req.files || []; 

  try {
    // Datos para la tabla del correo
    const datosParaCorreo = {
      Nombre: nombre,
      Email: email,
      ...rest 
    };

    // Generar HTML
    const htmlContent = generateHtml(
      `Nuevo Mensaje: ${asunto || 'Sin Asunto'}`, 
      datosParaCorreo, 
      mensaje 
    );

    // Adjuntos
    const finalAttachments = [...getBrandingAttachments(), ...archivosAdjuntos];

    // Guardar en DB
    const contenidoCompleto = { mensaje, extra_data: rest, tiene_adjuntos: archivosAdjuntos.length > 0 };
    await pool.query(
      'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
      [tipo, nombre, email, asunto, JSON.stringify(contenidoCompleto)]
    );

    // Enviar correo al Admin
    await transporter.sendMail({
      from: `"${nombre} | MedBay Web" <${process.env.EMAIL_USER}>`,
      to: "medbay.info02@gmail.com",
      replyTo: email,
      subject: `🔔 ${tipo}: ${asunto}`,
      html: htmlContent,
      attachments: finalAttachments
    });

    res.status(200).json({ success: true, message: 'Mensaje recibido y registrado.' });
  } catch (error) {
    console.error('🔥 Error en sendContactEmail:', error);
    res.status(500).json({ success: false, error: 'Error al procesar la solicitud.' });
  }
};

// --- FUNCIÓN 2: RESPONDER MENSAJE (DEL ADMIN AL CLIENTE) ---
const replyToEmail = async (req, res) => {
  const { targetEmail, subject, message, originalSubject } = req.body;

  if (!targetEmail || !message) {
    return res.status(400).json({ success: false, error: 'Faltan datos obligatorios (email o mensaje).' });
  }

  try {
    // 1. Preparar el Asunto (Si no pone uno nuevo, usamos RE: Original)
    const finalSubject = subject || `RE: ${originalSubject || 'Soporte MedBay'}`;

    // 2. Generar el HTML Premium
    // Usamos el mismo generador, pero no pasamos "datos" (tabla vacía) para que solo se vea el mensaje limpio.
    const htmlContent = generateHtml(
      `Respuesta a su solicitud`, // Título del correo
      {}, // Sin tabla de datos, solo queremos texto
      message // El mensaje del administrador
    );

    // 3. Adjuntos de marca (Logos)
    const brandingAttachments = getBrandingAttachments();

    // 4. Enviar el correo al CLIENTE
    await transporter.sendMail({
      from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
      to: targetEmail, // Aquí va el correo del cliente que extrajimos de la notificación
      subject: finalSubject,
      html: htmlContent,
      attachments: brandingAttachments
    });

    res.status(200).json({ success: true, message: 'Respuesta enviada correctamente.' });

  } catch (error) {
    console.error('🔥 Error en replyToEmail:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al enviar la respuesta.',
      details: error.message 
    });
  }
};

module.exports = { sendContactEmail, replyToEmail };