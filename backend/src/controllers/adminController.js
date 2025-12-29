// backend/src/controllers/adminController.js

const User = require('../models/userModel');
const Address = require('../models/addressModel'); // <--- IMPORTANTE
const nodemailer = require('nodemailer');
const { generateHtml, getBrandingAttachments } = require('../utils/emailTemplates');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const adminController = {

  // APROBAR
  approveUser: async (req, res) => {
    try {
      const { userId, userEmail, userName } = req.body;
      if (!userId) return res.status(400).json({ error: 'ID requerido' });

      await User.updateStatus(userId, 'active');

      const subject = "🎉 ¡Tu cuenta en MedBay ha sido Aprobada!";
      const message = `
        <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
        <p>Tu documentación ha sido validada y tu cuenta empresarial está <strong>ACTIVA</strong>.</p>
        <p>Bienvenido a la red de suministros médicos más confiable.</p>
      `;
      
      await transporter.sendMail({
        from: `"Admin MedBay" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: subject,
        html: generateHtml('Cuenta Activada', {}, message),
        attachments: getBrandingAttachments()
      });

      res.json({ success: true, message: 'Usuario autorizado.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al autorizar.' });
    }
  },

  // RECHAZAR Y BORRAR TODO
  rejectUser: async (req, res) => {
    try {
      const { userId, userEmail, userName, reason } = req.body;
      if (!userId) return res.status(400).json({ error: 'ID de usuario requerido' });

      // 1. Enviar correo de rechazo primero
      const subject = "Actualización sobre tu solicitud en MedBay";
      const message = `
        <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
        <p>Hemos revisado tu solicitud de registro.</p>
        <p style="color: #ef4444; font-weight: bold;">Tu solicitud no ha sido aprobada.</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p>Tus datos han sido eliminados de nuestro sistema por seguridad.</p>
      `;

      await transporter.sendMail({
        from: `"Verificación MedBay" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: subject,
        html: generateHtml('Solicitud Rechazada', {}, message),
        attachments: getBrandingAttachments()
      });

      // 2. LIMPIEZA PROFUNDA DE DB
      // Primero borramos direcciones asociadas
      await Address.deleteAllByUserId(userId);
      // Luego borramos al usuario (Postgres debería borrar docs y notifs por cascade, pero esto asegura la dirección)
      await User.delete(userId);

      res.json({ success: true, message: 'Usuario rechazado y eliminado de la base de datos.' });

    } catch (error) {
      console.error('Error en rejectUser:', error);
      res.status(500).json({ error: 'Error al rechazar usuario.' });
    }
  },

  manualReply: async (req, res) => {
    try {
        const { userEmail, subject, message } = req.body;
        if (!userEmail || !message) return res.status(400).json({ error: 'Faltan datos' });

        const htmlContent = generateHtml(subject || 'Mensaje de Soporte', {}, message);
        await transporter.sendMail({
            from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: subject || 'Mensaje respecto a tu cuenta MedBay',
            html: htmlContent,
            attachments: getBrandingAttachments()
        });
        res.json({ success: true, message: 'Mensaje enviado.' });
    } catch (e) { 
        console.error(e); 
        res.status(500).json({error: 'Error'}); 
    }
  }
};

module.exports = adminController;