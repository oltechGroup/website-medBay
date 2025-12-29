// backend/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
// Importamos la configuración de Multer que creamos en la Fase 1
const upload = require('../config/multerConfig'); 

// --- RUTAS PÚBLICAS ---

// AHORA: Inyectamos 'upload.single' para procesar el archivo ANTES de llegar al controlador
router.post('/register', upload.single('documentFile'), userController.register);

// --- RUTAS PROTEGIDAS (Requieren Token) ---

router.get('/', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), userController.getAllUsers);
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);

module.exports = router;
module.exports = router;