//backend/src/routes/contactRoutes.js

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Ruta para recibir formularios (Cliente -> Admin)
router.post('/', contactController.sendContactEmail);

// Nueva Ruta para RESPONDER (Admin -> Cliente)
router.post('/reply', contactController.replyToEmail);

module.exports = router;