// backend/src/routes/quoteRoutes.js

const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const authMiddleware = require('../middleware/auth'); 

// ==========================================
// 🔒 RUTAS CLIENTE (Requieren Login)
// ==========================================

// Crear nueva solicitud
router.post('/', authMiddleware.verifyToken, quoteController.createRequest);

// Obtener mis cotizaciones
router.get('/my-quotes', authMiddleware.verifyToken, quoteController.getMyQuotes);

// Responder a una propuesta (Aceptar/Rechazar)
router.put('/:id/respond', authMiddleware.verifyToken, quoteController.respondToProposal);


// ==========================================
// 🛡️ RUTAS ADMIN (Requieren Login + Verificación en Controller)
// ==========================================

// Obtener todas las cotizaciones
router.get('/', authMiddleware.verifyToken, quoteController.getAll);

// Obtener detalle de una cotización
router.get('/:id', authMiddleware.verifyToken, quoteController.getById);

// Enviar propuesta al cliente
router.put('/:id/proposal', authMiddleware.verifyToken, quoteController.sendProposal);

// ✅ NUEVO: Eliminar/Descartar cotización
router.delete('/:id', authMiddleware.verifyToken, quoteController.delete);

module.exports = router;