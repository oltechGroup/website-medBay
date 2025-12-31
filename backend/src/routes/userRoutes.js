// backend/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multerConfig'); 

// --- RUTAS PÚBLICAS ---

// Registro de usuarios (con carga de archivo único 'documentFile')
router.post('/register', upload.single('documentFile'), userController.register);

// --- RUTAS PROTEGIDAS (Requieren Token) ---

router.get('/', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), userController.getAllUsers);
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);

module.exports = router;