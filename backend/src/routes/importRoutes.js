const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const authMiddleware = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.verifyToken);

// Configurar multer para upload de archivos
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Rutas de importación
router.post('/upload', upload.single('file'), importController.uploadFile);
router.get('/preview/:upload_id', importController.getPreview);
router.get('/mapping-template', importController.getMappingTemplate);
router.post('/mapping-template', importController.saveMappingTemplate);
router.post('/clean-catalog', importController.cleanCatalog);
router.post('/process', importController.processImport);

module.exports = router;