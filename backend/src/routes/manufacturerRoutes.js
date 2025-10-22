// backend/src/routes/manufacturerRoutes.js

const express = require('express');
const router = express.Router();
const manufacturerController = require('../controllers/manufacturerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas existentes
router.post('/', manufacturerController.create);
router.get('/', manufacturerController.getAll);
router.get('/search/:name', manufacturerController.findByName);

// Nuevas rutas para CRUD completo
router.get('/:id', manufacturerController.getById);
router.put('/:id', manufacturerController.update);
router.delete('/:id', manufacturerController.delete);

module.exports = router;