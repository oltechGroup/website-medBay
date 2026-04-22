// backend/src/controllers/authController.js

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Nativo de Node.js para generar tokens seguros
const transporter = require('../config/mailer');
const { generatePasswordResetTemplate, getBrandingAttachments } = require('../utils/emailTemplates');

const authController = {
  // Login de usuario
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      // Buscar usuario por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // ✅ VALIDACIÓN: Verificar estado de la cuenta
      // Solo permitimos el acceso si el estado es 'active'
      if (user.account_status !== 'active') {
        let errorMessage = 'Acceso denegado. Tu cuenta no está activa.';
        
        if (user.account_status === 'pending') {
          errorMessage = '⏳ Tu cuenta está en proceso de revisión. Te notificaremos vía correo cuando sea aprobada.';
        } else if (user.account_status === 'rejected') {
          errorMessage = '⛔ Tu solicitud de registro ha sido rechazada.';
        } else if (user.account_status === 'suspended') {
          errorMessage = '🔒 Tu cuenta ha sido suspendida. Contacta a soporte.';
        }

        // Retornamos 403 Forbidden para indicar que las credenciales son válidas, 
        // pero no tiene permiso por su estatus.
        return res.status(403).json({ error: errorMessage });
      }

      // ✅ MODIFICADO: Agregamos supplier_id al Payload del Token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          verification_level: user.verification_level,
          supplier_id: user.supplier_id // <--- ESTO ES VITAL PARA LA SEGURIDAD B2B
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Actualizar last_login (opcional)
      // await User.updateLastLogin(user.id); 

      // No devolver la contraseña
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        message: 'Login exitoso',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Verificar token (para el frontend)
  verifyToken: async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      // ✅ DOBLE SEGURIDAD: 
      // Si el admin suspende al usuario mientras tiene sesión iniciada,
      // esta validación lo sacará en su próxima navegación.
      if (user.account_status !== 'active') {
        return res.status(403).json({ error: 'Tu cuenta ya no está activa.' });
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });

    } catch (error) {
      console.error('Error verificando token:', error);
      res.status(401).json({ error: 'Token inválido' });
    }
  },

  // ==========================================================
  // 🔐 NUEVAS FUNCIONES PARA RECUPERACIÓN DE CONTRASEÑA
  // ==========================================================

  // 1. Solicitar el enlace de recuperación
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'El correo electrónico es requerido' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'No existe una cuenta registrada con este correo electrónico' });
      }

      // Generar token seguro de 32 bytes en formato hexadecimal
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Establecer expiración de 15 minutos desde el momento actual
      const expires = new Date(Date.now() + 15 * 60 * 1000); 

      // Guardar el token y la fecha en la base de datos
      await User.savePasswordResetToken(user.id, resetToken, expires);

      // URL del frontend donde el usuario ingresará la nueva contraseña
      const frontendUrl = process.env.FRONTEND_URL || 'https://www.medbaysupply.com';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      // Generar el HTML usando la plantilla recién creada
      const htmlContent = generatePasswordResetTemplate({
        userName: user.full_name,
        resetUrl: resetUrl
      });

      // Enviar el correo
      await transporter.sendMail({
        from: `"Soporte MedBay" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Recuperación de Contraseña - MedBay',
        html: htmlContent,
        attachments: getBrandingAttachments()
      });

      res.json({ message: 'Se han enviado las instrucciones de recuperación a tu correo electrónico' });

    } catch (error) {
      console.error('Error al solicitar recuperación de contraseña:', error);
      res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud' });
    }
  },

  // 2. Restablecer la contraseña usando el token
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'El token y la nueva contraseña son requeridos' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Verificar si el token existe y no ha expirado
      const user = await User.findByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.' });
      }

      // Encriptar la nueva contraseña con 12 rondas (para mantener consistencia con el registro actual)
      const password_hash = await bcrypt.hash(newPassword, 12);

      // Guardar la nueva contraseña y limpiar el token
      await User.updatePassword(user.id, password_hash);

      res.json({ message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.' });

    } catch (error) {
      console.error('Error al restablecer la contraseña:', error);
      res.status(500).json({ error: 'Error interno del servidor al actualizar la contraseña' });
    }
  }
};

module.exports = authController;