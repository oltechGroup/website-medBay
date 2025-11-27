const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const auth = require('../middleware/auth'); // Middleware de autenticación

// Aplicar autenticación a todas las rutas de países
// CORRECCIÓN: Usar auth.verifyToken en lugar de auth
router.use(auth.verifyToken);

// 📊 RUTAS DE CONSULTA
router.get('/', countryController.getAll); // Con paginación y búsqueda
router.get('/stats', countryController.getStats); // Estadísticas
router.get('/currency/:currencyCode', countryController.getByCurrency); // Por moneda
router.get('/:code', countryController.getByCode); // Por código

// ✏️ RUTAS DE GESTIÓN
router.post('/', countryController.create); // Crear país
router.put('/:code', countryController.update); // Actualizar país
router.delete('/:code', countryController.delete); // Eliminar país

module.exports = router;