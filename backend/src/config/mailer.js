// backend/src/config/mailer.js
const nodemailer = require('nodemailer');

// Configuración centralizada del transporte de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificación de conexión al iniciar (Opcional, útil para debug)
transporter.verify().then(() => {
  console.log('📧 Servicio de Correo Listo');
}).catch((err) => {
  console.error('🔥 Error en servicio de correo:', err);
});

module.exports = transporter;