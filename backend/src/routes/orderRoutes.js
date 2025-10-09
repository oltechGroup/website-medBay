const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas de órdenes
router.post('/', orderController.create);
router.get('/', authMiddleware.requireRole(['admin']), orderController.getAll);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getById);
router.put('/:id/status', authMiddleware.requireRole(['admin']), orderController.updateStatus);

module.exports = router;