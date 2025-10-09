const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

router.post('/', categoryController.create);
router.get('/', categoryController.getAll);

module.exports = router;