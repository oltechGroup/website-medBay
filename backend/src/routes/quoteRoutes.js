// backend/src/routes/quoteRoutes.js

const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const authMiddleware = require('../middleware/auth'); 

// --- RUTAS PÚBLICAS ---
// Ninguna por ahora, según tu regla de negocio.

// --- RUTAS PROTEGIDAS (Requieren Login) ---
// ✅ CAMBIO IMPORTANTE: Usamos verifyToken para OBLIGAR inicio de sesión
router.post('/', authMiddleware.verifyToken, quoteController.createRequest);

// Obtener mis cotizaciones
router.get('/my-quotes', authMiddleware.verifyToken, quoteController.getMyQuotes);

// Responder a una propuesta
router.put('/:id/respond', authMiddleware.verifyToken, quoteController.respondToProposal);

// --- RUTAS ADMIN ---
router.get('/', authMiddleware.verifyToken, quoteController.getAll);
router.get('/:id', authMiddleware.verifyToken, quoteController.getById);
router.put('/:id/proposal', authMiddleware.verifyToken, quoteController.sendProposal);

module.exports = router;