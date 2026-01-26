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
// ✅ NUEVA RUTA
router.post('/:id/select-shipping', orderController.selectShippingMethod);

// Paso 3: Subir evidencia de pago (Foto/PDF)
router.post('/:id/evidence', uploadEvidence.single('file'), orderController.uploadEvidence);


// ==========================================
// 🛡️ RUTAS DE ADMIN
// ==========================================

// Obtener todas las órdenes
router.get('/', orderController.getAll);

// Obtener detalle de una orden específica (Incluye shipping options)
router.get('/:id', orderController.getById);

// Actualizar estado general (Bitácora / Cambios manuales)
router.put('/:id/status', orderController.updateStatus);

// Gestión de Valuación (Cotización)
// ✅ NUEVA RUTA: Agregar una opción de envío a la orden
router.post('/:id/shipping-options', orderController.addShippingOption);

// ✅ NUEVA RUTA: Finalizar valuación (Guardar Tax y Enviar al Cliente)
router.post('/:id/valuation', orderController.submitValuation);

module.exports = router;