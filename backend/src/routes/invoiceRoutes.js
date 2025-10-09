const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas de facturas
router.post('/', authMiddleware.requireRole(['admin']), invoiceController.create);
router.get('/', authMiddleware.requireRole(['admin']), invoiceController.getAll);
router.get('/:id', invoiceController.getById);
router.get('/order/:orderId', invoiceController.getByOrderId);

module.exports = router;