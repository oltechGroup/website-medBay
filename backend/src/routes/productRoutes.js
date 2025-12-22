// backend/src/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productImageController = require('../controllers/productImageController');
const authMiddleware = require('../middleware/auth');
const uploadImages = require('../middleware/uploadImages');

// ==========================================
// 🔓 RUTAS PÚBLICAS (Cliente y Catálogo)
// ==========================================

// Búsqueda y Estadísticas
router.get('/search', productController.search);
router.get('/stats/overview', productController.getStats);

// Filtros y exportaciones especiales
router.get('/filters/without-categories', productController.getProductsWithoutCategories);
router.get('/export/without-images', productController.exportProductsWithoutImages);

// ✅ NUEVAS RUTAS: Lotes y Categorías de un producto específico
// (Estas son las que solucionan el Error 404 en el Frontend)
router.get('/:id/lots', productController.getProductLots);
router.get('/:id/categories', productController.getProductCategories);
router.get('/:id/images', productController.getProductImages);

// Obtener productos (General e Individual)
router.get('/', productController.getAll);
router.get('/:id', productController.getById);


// ==========================================
// 🔒 RUTAS PROTEGIDAS (Solo Administrador)
// ==========================================
// De aquí para abajo, se requiere Token
router.use(authMiddleware.verifyToken);

// Gestión de Productos (Crear, Editar, Borrar)
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

// Operaciones Masivas
router.post('/batch/categories', productController.batchAssignCategories);

// Gestión de Imágenes (Uploads)
router.post('/:id/images/upload', uploadImages.array('images', 10), productImageController.upload);
router.post('/:id/images/upload-with-metadata', uploadImages.array('images', 10), productImageController.uploadMultipleWithMetadata);
router.put('/images/:id/primary', productImageController.setPrimary);
router.delete('/images/:id', productImageController.delete);

module.exports = router;