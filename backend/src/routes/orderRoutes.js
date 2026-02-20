// backend/src/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const uploadEvidence = require('../middleware/uploadEvidence'); 

// 🔒 Todas las rutas requieren autenticación
router.use(authMiddleware.verifyToken);

// ==========================================
// 👤 RUTAS DE CLIENTE
// ==========================================

// Obtener mis órdenes
router.get('/my-orders', orderController.getMyOrders);

// Paso 1: Crear una solicitud de orden (Sin pago ni envío aún)
router.post('/', orderController.create);

// Paso 2: Seleccionar método de envío (Aceptación de cotización)
router.post('/:id/select-shipping', orderController.selectShippingMethod);

// Paso 3: Subir evidencia de pago (Foto/PDF)
router.post('/:id/evidence', uploadEvidence.single('file'), orderController.uploadEvidence);


// ==========================================
// 🤝 RUTAS COMPARTIDAS (Cliente dueño y Admin)
// ==========================================

// Obtener detalle de una orden específica (El controlador verifica que sea el dueño o Admin)
router.get('/:id', orderController.getById);


// ==========================================
// 🛡️ RUTAS DE ADMIN
// ==========================================

// Obtener todas las órdenes
router.get('/', authMiddleware.requireRole(['admin']), orderController.getAll);

// Actualizar estado general (Bitácora / Cambios manuales)
router.put('/:id/status', authMiddleware.requireRole(['admin']), orderController.updateStatus);

// Gestión de Valuación (Cotización)
// Agregar una opción de envío a la orden
router.post('/:id/shipping-options', authMiddleware.requireRole(['admin']), orderController.addShippingOption);

// Finalizar valuación (Guardar Tax y Enviar al Cliente)
router.post('/:id/valuation', authMiddleware.requireRole(['admin']), orderController.submitValuation);

// Enviar mensaje de seguimiento (Concierge)
router.post('/:id/message', authMiddleware.requireRole(['admin']), orderController.sendUpdateMessage);

module.exports = router;