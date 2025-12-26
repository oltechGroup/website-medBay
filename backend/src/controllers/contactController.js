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

// Configuración de Nodemailer (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendContactEmail = async (req, res) => {
  // Extraemos lo básico, pero dejamos '...rest' para capturar cualquier otro campo nuevo
  const { nombre, email, asunto, mensaje, tipo = 'Contacto General', ...rest } = req.body;
  
  // Si envías archivos desde el frontend, vendrán en req.files (si usas multer)
  // Aquí asumo que por ahora es JSON, pero preparo la lógica.
  const archivosAdjuntos = req.files || []; 

  try {
    // 1. Preparar datos para el correo
    // Juntamos los datos explícitos con los extras para mostrarlos en la tabla del correo
    const datosParaCorreo = {
      Nombre: nombre,
      Email: email,
      ...rest // Aquí entrarían campos como 'Empresa', 'Telefono', 'Cantidad', etc. si los hubiera
    };

    // 2. Generar HTML Premium
    const htmlContent = generateHtml(
      `Nuevo Mensaje: ${asunto || 'Sin Asunto'}`, // Título
      datosParaCorreo, // Datos para la tabla
      mensaje // Mensaje principal destacado
    );

    // 3. Preparar adjuntos (Logos + Archivos del usuario si los hubiera)
    const brandingAttachments = getBrandingAttachments();
    // Combinamos logos con archivos del usuario
    const finalAttachments = [...brandingAttachments, ...archivosAdjuntos];

    // 4. Guardar en Base de Datos (Notificación para Admin)
    // Guardamos TODO el cuerpo en 'content' para no perder datos si cambias el formulario
    const contenidoCompleto = { mensaje, extra_data: rest, tiene_adjuntos: archivosAdjuntos.length > 0 };
    
    await pool.query(
      'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
      [tipo, nombre, email, asunto, JSON.stringify(contenidoCompleto)]
    );

    // 5. Enviar el Correo
    await transporter.sendMail({
      from: `"${nombre} | MedBay Web" <${process.env.EMAIL_USER}>`,
      to: "medbay.info02@gmail.com", // Tu correo donde recibes las alertas
      replyTo: email, // Para que al dar "Responder" le escribas al cliente
      subject: `🔔 ${tipo}: ${asunto}`,
      html: htmlContent,
      attachments: finalAttachments
    });

    res.status(200).json({ success: true, message: 'Correo enviado y notificación registrada.' });

  } catch (error) {
    console.error('🔥 Error en sendContactEmail:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la solicitud.',
      debug: error.message 
    });
  }
};

module.exports = { sendContactEmail };
