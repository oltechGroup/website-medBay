const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas de documentos
router.post('/', documentController.create);
router.get('/', authMiddleware.requireRole(['admin']), documentController.getAll);
router.get('/my-documents', documentController.getMyDocuments);
router.get('/:id', documentController.getById);
router.put('/:id/status', authMiddleware.requireRole(['admin']), documentController.updateStatus);
router.delete('/:id', documentController.delete);

module.exports = router;