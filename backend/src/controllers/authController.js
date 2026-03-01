// backend/src/controllers/authController.js

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  }
};

module.exports = authController;