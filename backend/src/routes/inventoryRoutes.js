// src/routes/inventoryRoutes.js - VERSIÓN ACTUALIZADA CON DROPSHIPPING
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// =============================================
// RUTAS EXISTENTES (COMPATIBILIDAD)
// =============================================
router.post('/lots', inventoryController.createLot);
router.get('/lots', inventoryController.getAllLots);
router.get('/lots/product/:productId', inventoryController.getLotsByProduct);
router.get('/lots/near-expiry', inventoryController.getNearExpiryLots);
router.put('/lots/:lotId/quantity', inventoryController.updateLotQuantity);
router.put('/lots/:lotId/reserve', inventoryController.reserveLotQuantity);
router.put('/lots/:lotId/release', inventoryController.releaseLotQuantity);

// =============================================
// NUEVAS RUTAS PARA EL FRONTEND MEJORADO
// =============================================

// Obtener todos los lotes con información completa (incluye productos sin lotes)
router.get('/lots-complete', inventoryController.getInventoryLots);

// Crear lote para producto que no tiene lote
router.post('/create-lot-for-product', inventoryController.createLotForProduct);

// Obtener categorías de expiración
router.get('/expiry-categories', inventoryController.getExpiryCategories);

// Ajustar inventario manualmente
router.post('/adjustments', inventoryController.adjustInventory);

// Actualizar estado de un lote
router.patch('/lots/:id/status', inventoryController.updateLotStatus);

// Actualizar categoría de expiración de un lote
router.patch('/lots/:id/expiry-category', inventoryController.updateExpiryCategory);

// =============================================
// NUEVAS RUTAS PARA DROPSHIPPING
// =============================================

// Resumen de proveedores y catálogos
router.get('/suppliers-summary', inventoryController.getSuppliersCatalogSummary);

// Catálogo por proveedor y categoría
router.get('/catalog/supplier/:supplier_id/category/:sales_category', inventoryController.getCatalogBySupplierAndCategory);

// Dashboard de inventario
router.get('/dashboard', inventoryController.getInventoryDashboard);

module.exports = router;