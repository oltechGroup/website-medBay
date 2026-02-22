//backend/src/routes/manufacturerRoutes.js
const express = require('express');
const router = express.Router();
const manufacturerController = require('../controllers/manufacturerController');
const authMiddleware = require('../middleware/auth');

// ==========================================
// 🔓 RUTAS PÚBLICAS (Lectura)
// ==========================================
// Permite que los fabricantes se carguen en el catálogo público
router.get('/', manufacturerController.getAll);
router.get('/search/:name', manufacturerController.getByName);
router.get('/:id', manufacturerController.getById);

// ==========================================
// 🔒 RUTAS PROTEGIDAS (Admin)
// ==========================================
router.use(authMiddleware.verifyToken);

router.post('/', manufacturerController.create);
router.put('/:id', manufacturerController.update);
router.delete('/:id', manufacturerController.delete);

module.exports = router;