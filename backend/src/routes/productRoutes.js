const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware.verifyToken);

// Rutas de productos
router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/search', productController.search);
router.get('/:id', productController.getById);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

module.exports = router;