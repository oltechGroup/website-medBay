const express = require('express');
const router = express.Router();
const manufacturerController = require('../controllers/manufacturerController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

router.post('/', manufacturerController.create);
router.get('/', manufacturerController.getAll);
router.get('/search/:name', manufacturerController.findByName);

module.exports = router;