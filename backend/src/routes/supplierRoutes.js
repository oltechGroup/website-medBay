const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas de proveedores
router.post('/', supplierController.create);
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.delete);

module.exports = router;