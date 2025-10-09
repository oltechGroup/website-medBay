const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para login
router.post('/login', authController.login);

// Ruta para verificar token
router.get('/verify', authController.verifyToken);

module.exports = router;