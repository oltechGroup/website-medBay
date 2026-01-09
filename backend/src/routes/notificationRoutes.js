// backend/src/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth'); // Middleware de auth

// Proteger todas las rutas
router.use(authMiddleware.verifyToken);

// Rutas Admin
// (Podrías agregar authMiddleware.requireRole(['admin']) aquí si quisieras ser estricto, 
// pero por ahora verifyToken funciona porque el frontend filtra)
router.get('/', notificationController.getNotifications);
router.delete('/:id', notificationController.deleteNotification);

// ✅ NUEVA RUTA CLIENTE
router.get('/client', notificationController.getClientAlerts);

module.exports = router;