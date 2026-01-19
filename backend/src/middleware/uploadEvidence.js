// backend/src/middleware/uploadEvidence.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ CORRECCIÓN: Usamos __dirname para navegar relativo a este archivo.
const evidenceDir = path.join(__dirname, '../../uploads/evidence');

// Crear carpeta si no existe
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, evidenceDir);
  },
  filename: function (req, file, cb) {
    // Nombre único: evidence-TIMESTAMP-RANDOM.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptamos Imágenes y PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Formato no válido. Solo imágenes o PDF.'), false);
  }
};

const uploadEvidence = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = uploadEvidence;