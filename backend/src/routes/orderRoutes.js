// backend/src/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const uploadEvidence = require('../middleware/uploadEvidence'); // Necesitaremos crear este middleware brevemente

// 🔒 Todas las rutas requieren autenticación
router.use(authMiddleware.verifyToken);

// --- RUTAS DE CLIENTE ---
// Obtener mis órdenes (El usuario logueado)
router.get('/my-orders', orderController.getMyOrders);

// Crear una nueva orden (Checkout)
router.post('/', orderController.create);

// Subir evidencia de pago (Foto/PDF)
// Usamos un middleware 'uploadEvidence' que configuraremos abajo
router.post('/:id/evidence', uploadEvidence.single('file'), orderController.uploadEvidence);

// --- RUTAS DE ADMIN ---
// Obtener todas las órdenes
router.get('/', orderController.getAll);

// Obtener detalle de una orden específica
router.get('/:id', orderController.getById);

// Actualizar estado (Aprobar/Rechazar)
router.put('/:id/status', orderController.updateStatus);

module.exports = router;