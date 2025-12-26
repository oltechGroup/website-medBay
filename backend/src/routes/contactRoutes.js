//backend/src/routes/contactRoutes.js

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Ruta para recibir el formulario
router.post('/', contactController.sendContactEmail);

module.exports = router;