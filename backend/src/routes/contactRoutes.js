//backend/src/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Ruta para recibir formularios (Cliente -> Admin)
// Nota: Como el frontend envía JSON, no necesitamos middleware de archivos aquí.
router.post('/', contactController.sendContactEmail);

// Ruta para RESPONDER (Admin -> Cliente)
router.post('/reply', contactController.replyToEmail);

module.exports = router;