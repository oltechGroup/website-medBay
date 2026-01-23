// backend/src/routes/documentRoutes.js

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');
// ✅ NUEVO: Importamos el middleware de subida (Multer)
const uploadEvidence = require('../middleware/uploadEvidence'); 

router.use(authMiddleware.verifyToken);

// Rutas de documentos

// Crear nuevo documento (Subida inicial fuera de registro)
// Nota: Tu controlador original usa 'documentFile' o 'file' dependiendo de multer. 
// Asegúrate que tu middleware use .single('documentFile') si así lo manda el front.
router.post('/', uploadEvidence.single('documentFile'), documentController.create);

// ✅ NUEVO: Reemplazar documento existente (Subir nueva versión)
router.put('/:id/replace', uploadEvidence.single('documentFile'), documentController.replaceDocument);

// Obtener todos (Admin)
router.get('/', authMiddleware.requireRole(['admin']), documentController.getAll);

// Obtener mis documentos
router.get('/my-documents', documentController.getMyDocuments);

// Obtener por ID
router.get('/:id', documentController.getById);

// Actualizar estado (Admin - Aprobar/Rechazar)
router.put('/:id/status', authMiddleware.requireRole(['admin']), documentController.updateStatus);

// Eliminar documento
router.delete('/:id', documentController.delete);

module.exports = router;