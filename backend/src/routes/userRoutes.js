const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Ruta para registrar usuario (pública)
router.post('/register', userController.register);

// Ruta para obtener todos los usuarios (protegida - solo admin)
router.get('/', 
  authMiddleware.verifyToken, 
  authMiddleware.requireRole(['admin']),
  userController.getAllUsers
);

// Ruta para obtener usuario por ID (protegida - usuario propio o admin)
router.get('/:id', 
  authMiddleware.verifyToken, 
  (req, res, next) => {
    // Verificar que el usuario está viendo su propio perfil o es admin
    if (req.user.id !== req.params.id && req.user.verification_level !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para ver este usuario' });
    }
    next();
  },
  userController.getUserById
);

module.exports = router;