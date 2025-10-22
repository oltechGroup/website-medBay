const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

// Rutas para países
router.get('/', countryController.getAll);
router.get('/:code', countryController.getByCode);
router.post('/', countryController.create);
router.put('/:code', countryController.update);
router.delete('/:code', countryController.delete);

module.exports = router;