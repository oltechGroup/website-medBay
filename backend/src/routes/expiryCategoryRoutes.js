const express = require('express');
const router = express.Router();
const expiryCategoryController = require('../controllers/expiryCategoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

router.post('/', expiryCategoryController.create);
router.get('/', expiryCategoryController.getAll);
router.get('/:id', expiryCategoryController.getById);
router.put('/:id', expiryCategoryController.update);
router.delete('/:id', expiryCategoryController.delete);

module.exports = router;