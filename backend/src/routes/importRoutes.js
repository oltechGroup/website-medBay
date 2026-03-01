// backend/src/routes/importRoutes.js

const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// ✅ 1. IMPORTAMOS EL MIDDLEWARE ESPECIALIZADO DE IMÁGENES
const uploadImages = require('../middleware/uploadImages');

// Configuración Multer (Carga de archivos EXCEL) - INTACTO
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `import-${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB límite para Excels grandes
});

// 1. Verificar que el usuario esté logueado (Cualquier rol)
router.use(authMiddleware.verifyToken);

// 2. 🛡️ BLINDAJE DE SEGURIDAD GENERAL: Ahora permite a Admin y a Proveedor
router.use(authMiddleware.requireRole(['admin', 'supplier']));

// --- RUTAS PROTEGIDAS ---

// 1. Proveedor Rápido (✅ CANDADO ESPECÍFICO: Solo Admin puede crear a otros proveedores)
router.post('/quick-supplier', authMiddleware.requireRole(['admin']), importController.createQuickSupplier);

// 2. Subida y Previsualización de Excel 
router.post('/upload', upload.single('file'), importController.uploadFile);
router.get('/preview/:upload_id', importController.getPreview);

// 3. NUEVA RUTA: ENTRADA MANUAL 
router.post('/manual', uploadImages.single('image'), importController.processManualImport);

// 4. Gestión de Plantillas de Mapeo
router.get('/mapping-template', importController.getMappingTemplate);
router.post('/mapping-template', importController.saveMappingTemplate);

// 5. Limpieza de Inventario (Por Proveedor + Categoría)
router.post('/clean-catalog', importController.cleanCatalog);

// 6. Procesamiento (El motor pesado para Excel)
router.post('/process', importController.processImport);

// 7. Monitoreo y Estadísticas
router.get('/active-status', importController.getActiveStatus);
router.get('/progress/:upload_id', importController.getProgress);
router.get('/history', importController.getHistory);
router.get('/stats', importController.getStats);

module.exports = router;