//backend/src/routes/importRoutes.js

const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuración Multer (Carga de archivos)
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

// Middleware de Auth para todo el módulo
router.use(authMiddleware.verifyToken);

// 1. Proveedor Rápido
router.post('/quick-supplier', importController.createQuickSupplier);

// 2. Subida y Previsualización
router.post('/upload', upload.single('file'), importController.uploadFile);
router.get('/preview/:upload_id', importController.getPreview);

// 3. Gestión de Plantillas de Mapeo
router.get('/mapping-template', importController.getMappingTemplate);
router.post('/mapping-template', importController.saveMappingTemplate);

// 4. Limpieza de Inventario (Por Proveedor + Categoría)
router.post('/clean-catalog', importController.cleanCatalog);

// 5. Procesamiento (El motor pesado)
router.post('/process', importController.processImport);

// 6. Monitoreo y Estadísticas
router.get('/progress/:upload_id', importController.getProgress);
router.get('/history', importController.getHistory);
router.get('/stats', importController.getStats);

module.exports = router;