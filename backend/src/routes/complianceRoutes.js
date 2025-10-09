const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas de cumplimiento normativo
router.post('/tasks', authMiddleware.requireRole(['admin', 'compliance_reviewer']), complianceController.createTask);
router.get('/tasks', authMiddleware.requireRole(['admin', 'compliance_reviewer']), complianceController.getAllTasks);
router.get('/tasks/my-tasks', authMiddleware.requireRole(['admin', 'compliance_reviewer']), complianceController.getMyTasks);
router.put('/tasks/:id/status', authMiddleware.requireRole(['admin', 'compliance_reviewer']), complianceController.updateTaskStatus);
router.post('/orders/:orderId/reviews', authMiddleware.requireRole(['admin', 'compliance_reviewer']), complianceController.createOrderReview);
router.get('/orders/:orderId/reviews', complianceController.getOrderReviews);

module.exports = router;