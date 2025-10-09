const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const userController = {
  // Registrar nuevo usuario
  register: async (req, res) => {
    try {
      const { email, password, full_name, company_name, tax_id, country, verification_level } = req.body;

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      // Hash de la contraseña
      const password_hash = await bcrypt.hash(password, 12);

      // Crear usuario
      const newUser = await User.create({
        email,
        password_hash,
        full_name,
        company_name,
        tax_id,
        country,
        verification_level: verification_level || 'consumer_basic'
      });

      // No devolver la contraseña
      const { password_hash: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los usuarios
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener usuario por ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = userController;