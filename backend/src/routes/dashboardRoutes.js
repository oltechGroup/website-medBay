// backend/src/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas requieren ser Admin
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.requireRole(['admin', 'superadmin']));

// Obtener Inbox Unificado
router.get('/inbox', dashboardController.getUnifiedInbox);

// Eliminar item (solo notificaciones simples)
router.delete('/inbox/:source/:id', dashboardController.deleteItem);

module.exports = router;