const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

// Rutas para monedas
router.get('/', currencyController.getAll);
router.get('/:code', currencyController.getByCode);
router.post('/', currencyController.create);
router.put('/:code', currencyController.update);
router.delete('/:code', currencyController.delete);

module.exports = router;