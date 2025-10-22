const express = require('express');
const router = express.Router();
const productLotController = require('../controllers/productLotController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

router.post('/', productLotController.create);
router.get('/', productLotController.getAll);
router.get('/:id', productLotController.getById);
router.put('/:id', productLotController.update);
router.delete('/:id', productLotController.delete);

module.exports = router;