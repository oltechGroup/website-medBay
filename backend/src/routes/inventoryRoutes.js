const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// ✅ DASHBOARD Y MÉTRICAS
router.get('/dashboard', inventoryController.getDashboard);
router.get('/suppliers-metrics', inventoryController.getSuppliersMetrics);

// ✅ CRUD DE LOTES
router.get('/lots', inventoryController.getLots);
router.get('/lots/:id', inventoryController.getLotById);
router.post('/lots', inventoryController.createLot);
router.put('/lots/:id', inventoryController.updateLot);
router.delete('/lots/:id', inventoryController.deleteLot);

// ✅ CATÁLOGOS ESPECIALIZADOS
router.get('/catalog/supplier/:supplier_id/status/:status', inventoryController.getCatalogBySupplier);

// ✅ DATOS PARA FORMULARIOS
router.get('/form-data', inventoryController.getFormData);
router.post('/product-suppliers', inventoryController.findOrCreateProductSupplier);


module.exports = router;