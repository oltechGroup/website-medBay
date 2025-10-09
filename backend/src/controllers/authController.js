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

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          verification_level: user.verification_level 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Actualizar last_login (opcional, puedes implementarlo después)

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

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });

    } catch (error) {
      console.error('Error verificando token:', error);
      res.status(401).json({ error: 'Token inválido' });
    }
  }
};

module.exports = authController;