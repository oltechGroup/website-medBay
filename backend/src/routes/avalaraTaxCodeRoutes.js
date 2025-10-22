const express = require('express');
const router = express.Router();
const avalaraTaxCodeController = require('../controllers/avalaraTaxCodeController');

// Rutas para códigos fiscales
router.get('/', avalaraTaxCodeController.getAll);
router.get('/:id', avalaraTaxCodeController.getById);
router.post('/', avalaraTaxCodeController.create);
router.put('/:id', avalaraTaxCodeController.update);
router.delete('/:id', avalaraTaxCodeController.delete);

module.exports = router;