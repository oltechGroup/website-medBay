// backend/src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Middleware global para estas rutas: Verificar Token y que sea ADMIN
router.use(authMiddleware.verifyToken, authMiddleware.requireRole(['admin']));

// --- GESTIÓN DE SOLICITUDES DE REGISTRO ---

// 1. Autorizar cuenta (Cambia estado a 'active' y envía correo de bienvenida)
router.post('/users/approve', adminController.approveUser);

// 2. Rechazar cuenta (Cambia estado a 'rejected' y envía correo de notificación)
router.post('/users/reject', adminController.rejectUser);

// 3. Respuesta Manual (Solo envía correo, sin cambiar estado necesariamente)
router.post('/users/reply-manual', adminController.manualReply);

module.exports = router;