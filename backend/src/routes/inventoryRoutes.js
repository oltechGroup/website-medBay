// backend/src/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');

// ==========================================
// 🔓 RUTAS PÚBLICAS (Vitrina Abierta)
// ==========================================
// Permite que cualquier visitante vea los lotes y catálogos

// ✅ Ver Catálogo por Proveedor (Público para la vitrina)
router.get('/catalog/supplier/:supplier_id/status/:status', inventoryController.getCatalogBySupplier);

// ✅ Ver Lista de Lotes y Detalle Individual (Público)
router.get('/lots', inventoryController.getLots);
router.get('/lots/:id', inventoryController.getLotById);

// ✅ Datos para Formularios (Público para que carguen selects en búsquedas)
router.get('/form-data', inventoryController.getFormData);


// ==========================================
// 🔒 RUTAS PROTEGIDAS (Requieren Login)
// ==========================================
// A partir de aquí, nadie pasa sin Token válido
router.use(authMiddleware.verifyToken);

// ✅ Dashboard y Métricas (Información sensible de negocio)
router.get('/dashboard', inventoryController.getDashboard);
router.get('/suppliers-metrics', inventoryController.getSuppliersMetrics);

// ✅ Gestión de Inventario (Solo usuarios registrados/admin pueden modificar)
router.post('/lots', inventoryController.createLot);
router.put('/lots/:id', inventoryController.updateLot);
router.delete('/lots/:id', inventoryController.deleteLot);

// ✅ Relaciones Proveedor-Producto (Creación)
router.post('/product-suppliers', inventoryController.findOrCreateProductSupplier);

module.exports = router;