//backend/src/routes/countryRoutes.js
const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController'); 
const auth = require('../middleware/auth'); 

// ==========================================
// 🔓 RUTAS PÚBLICAS (Accesibles para todos)
// ==========================================
// IMPORTANTE: Estas deben ir ANTES del middleware de auth
router.get('/', countryController.getAll); 
router.get('/stats', countryController.getStats);
router.get('/currency/:currencyCode', countryController.getByCurrency); 
router.get('/:code', countryController.getByCode); 

// ==========================================
// 🔒 RUTAS PROTEGIDAS (Solo Admin/Usuarios Logueados)
// ==========================================
// A partir de esta línea, se requiere Token
router.use(auth.verifyToken);

// 🚀 NUEVA RUTA: Sincronización manual de monedas
// Debe ir antes de rutas con parámetros genéricos para evitar conflictos
router.post('/sync', countryController.syncExchangeRates);

router.post('/', countryController.create); 
router.put('/:code', countryController.update); 
router.delete('/:code', countryController.delete); 

module.exports = router;