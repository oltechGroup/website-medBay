// backend/src/controllers/adminController.js

const User = require('../models/userModel');
const Address = require('../models/addressModel');
const nodemailer = require('nodemailer');
// ✅ IMPORTANTE: Importamos generateResponseTemplate
const { generateResponseTemplate, getBrandingAttachments } = require('../utils/emailTemplates');

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
        Hola <strong>${userName || 'Usuario'}</strong>,
        
        Tu documentación ha sido validada exitosamente y tu cuenta empresarial está <strong>ACTIVA</strong>.
        
        Ya puedes iniciar sesión para acceder a precios mayoristas, gestión de lotes y facturación automática.
        
        Bienvenido a la red de suministros médicos más confiable.
      `;
      
      // ✅ Usamos generateResponseTemplate con flag true (éxito/verde)
      const htmlContent = generateResponseTemplate('Cuenta Activada', message, true);

      await transporter.sendMail({
        from: `"Admin MedBay" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: subject,
        html: htmlContent,
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
        Hola <strong>${userName || 'Usuario'}</strong>,
        
        Hemos revisado tu solicitud de registro.
        Tu solicitud no ha sido aprobada debido a:
        
        <strong>${reason}</strong>
        
        Tus datos han sido eliminados de nuestro sistema por seguridad. Puedes volver a intentarlo con la documentación corregida.
      `;

      // ✅ Usamos generateResponseTemplate con flag false (alerta/rojo)
      const htmlContent = generateResponseTemplate('Solicitud Rechazada', message, false);

      await transporter.sendMail({
        from: `"Verificación MedBay" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: subject,
        html: htmlContent,
        attachments: getBrandingAttachments()
      });

      // 2. LIMPIEZA PROFUNDA DE DB
      await Address.deleteAllByUserId(userId);
      await User.delete(userId);

      res.json({ success: true, message: 'Usuario rechazado y eliminado.' });

    } catch (error) {
      console.error('Error en rejectUser:', error);
      res.status(500).json({ error: 'Error al rechazar usuario.' });
    }
  },

  // RESPUESTA MANUAL
  manualReply: async (req, res) => {
    try {
        const { userEmail, subject, message } = req.body;
        if (!userEmail || !message) return res.status(400).json({ error: 'Faltan datos' });

        // ✅ Usamos generateResponseTemplate (neutro/verde por defecto)
        const htmlContent = generateResponseTemplate(subject || 'Mensaje de Soporte', message, true);
        
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