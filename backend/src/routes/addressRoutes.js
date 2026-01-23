// backend/src/routes/addressRoutes.js

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middleware/auth');

// 🔒 Todas las rutas de direcciones requieren autenticación
router.use(authMiddleware.verifyToken);

// Obtener todas las direcciones del usuario
router.get('/', addressController.getAddresses);

// Crear una nueva dirección
router.post('/', addressController.createAddress);

// ✅ NUEVO: Actualizar una dirección existente (Alerta si es fiscal)
router.put('/:id', addressController.updateAddress);

// Eliminar una dirección específica
router.delete('/:id', addressController.deleteAddress);

module.exports = router;