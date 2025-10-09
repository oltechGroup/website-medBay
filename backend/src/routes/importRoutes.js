const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Guardar con timestamp para evitar duplicados
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Validar que sea un archivo Excel
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB límite para archivos grandes
  }
});

// Middleware para manejar errores de multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Límite: 50MB' });
    }
  }
  res.status(400).json({ error: error.message });
};

router.use(authMiddleware.verifyToken);

// Rutas de importación
router.post('/upload', upload.single('excelFile'), importController.uploadFile, handleUploadError);
router.get('/supplier/:supplierId', importController.getUploadsBySupplier);
router.get('/upload/:uploadId', importController.getUploadDetails);
router.post('/templates', importController.saveMappingTemplate);
router.get('/templates/supplier/:supplierId', importController.getTemplatesBySupplier);
router.post('/process/:uploadId', importController.processUpload);
router.get('/report/:uploadId', importController.getImportReport);

module.exports = router;