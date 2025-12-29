// backend/src/config/multerConfig.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que existan las carpetas
const ensureDirectories = () => {
  const dirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads/documents'), // Para PDFs legales
    path.join(process.cwd(), 'uploads/images')     // Para otros usos
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Si el campo del formulario es 'document', va a /documents, si no a /images
    if (file.fieldname === 'documentFile' || file.mimetype === 'application/pdf') {
      cb(null, path.join(process.cwd(), 'uploads/documents'));
    } else {
      cb(null, path.join(process.cwd(), 'uploads/images'));
    }
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp-random-nombreoriginal
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos (Solo PDF e Imágenes)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Formato de archivo no soportado. Solo PDF, JPG, PNG.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: fileFilter
});

module.exports = upload;