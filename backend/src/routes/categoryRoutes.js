//backend/src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

// ==========================================
// 🔓 RUTAS PÚBLICAS (Lectura)
// ==========================================
// Permite que el catálogo cargue categorías sin estar logueado
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// ==========================================
// 🔒 RUTAS PROTEGIDAS (Admin)
// ==========================================
// De aquí en adelante, se requiere Token de autenticación
router.use(authMiddleware.verifyToken);

router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

// Operaciones de gestión y estadísticas
router.post('/batch/products', categoryController.batchAssignProducts);
router.get('/filters/without-products', categoryController.getWithoutProducts);
router.get('/stats/overview', categoryController.getStats);

module.exports = router;