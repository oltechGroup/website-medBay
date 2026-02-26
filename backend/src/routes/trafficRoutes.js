// backend/src/routes/trafficRoutes.js

const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');
const authMiddleware = require('../middleware/auth');

// ==========================================
// 🔓 RUTA PÚBLICA (El Radar)
// ==========================================
// Esta ruta NO lleva middleware de autenticación porque cualquier 
// visitante (incluso sin cuenta) debe poder registrar su visita.
router.post('/ping', trafficController.ping);

// ==========================================
// 🔒 RUTA PROTEGIDA (El Panel de Control)
// ==========================================
// Solo los administradores logueados pueden pedir las estadísticas.
router.get(
  '/stats', 
  authMiddleware.verifyToken, 
  authMiddleware.requireRole(['admin']), 
  trafficController.getStats
);

module.exports = router;