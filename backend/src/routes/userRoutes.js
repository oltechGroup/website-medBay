// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// ✅ CORRECCIÓN: Usamos el middleware que sí existe en tu proyecto
// 'uploadEvidence' permite imágenes y PDFs, ideal para las cédulas/actas.
const uploadEvidence = require('../middleware/uploadEvidence'); 

// --- RUTAS PÚBLICAS ---

// Registro de usuarios
// Usamos .single('documentFile') porque así se llama el campo en tu Frontend
router.post('/register', uploadEvidence.single('documentFile'), userController.register);

// --- RUTAS PROTEGIDAS (Requieren Token) ---

router.get('/', authMiddleware.verifyToken, authMiddleware.requireRole(['admin']), userController.getAllUsers);
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);

module.exports = router;