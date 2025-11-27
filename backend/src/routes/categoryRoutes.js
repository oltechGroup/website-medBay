// backend/src/routes/categoryRoutes.js

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

router.post('/', categoryController.create);
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

router.post('/batch/products', categoryController.batchAssignProducts);
router.get('/filters/without-products', categoryController.getWithoutProducts);
router.get('/stats/overview', categoryController.getStats);

module.exports = router;