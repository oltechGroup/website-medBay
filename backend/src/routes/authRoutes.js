// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ==========================================
// 🔐 RUTAS DE AUTENTICACIÓN ESTÁNDAR
// ==========================================

// Ruta para login
router.post('/login', authController.login);

// Ruta para verificar token
router.get('/verify', authController.verifyToken);

// ==========================================
// 🔄 RUTAS DE RECUPERACIÓN DE CONTRASEÑA
// ==========================================

// 1. Solicitar enlace de recuperación (Recibe { email })
router.post('/request-password-reset', authController.requestPasswordReset);

// 2. Restablecer contraseña (Recibe { token, newPassword })
router.post('/reset-password', authController.resetPassword);

module.exports = router;