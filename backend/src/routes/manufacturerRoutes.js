//backend/src/routes/manufacturerRoutes.js

const express = require('express');
const router = express.Router();
const manufacturerController = require('../controllers/manufacturerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas para fabricantes
router.post('/', manufacturerController.create);
router.get('/', manufacturerController.getAll);
router.get('/search/:name', manufacturerController.getByName); // ✅ CORREGIDO: getByName en lugar de findByName
router.get('/:id', manufacturerController.getById);
router.put('/:id', manufacturerController.update);
router.delete('/:id', manufacturerController.delete);

module.exports = router;