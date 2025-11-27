// backend/src/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productImageController = require('../controllers/productImageController');
const authMiddleware = require('../middleware/auth');
const uploadImages = require('../middleware/uploadImages');

router.use(authMiddleware.verifyToken);

router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/search', productController.search);
router.get('/:id', productController.getById);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

router.get('/stats/overview', productController.getStats);
router.get('/export/without-images', productController.exportProductsWithoutImages);

// ✅ NUEVAS RUTAS PARA OPERACIONES MASIVAS
router.post('/batch/categories', productController.batchAssignCategories);
router.get('/filters/without-categories', productController.getProductsWithoutCategories);

// Rutas de imágenes
router.post('/:id/images/upload', uploadImages.array('images', 10), productImageController.upload);
router.post('/:id/images/upload-with-metadata', uploadImages.array('images', 10), productImageController.uploadMultipleWithMetadata);
router.get('/:id/images', productController.getProductImages);
router.put('/images/:id/primary', productImageController.setPrimary);
router.delete('/images/:id', productImageController.delete);

module.exports = router;