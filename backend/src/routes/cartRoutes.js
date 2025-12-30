//backend/src/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');

// 🔒 Todas las rutas del carrito requieren autenticación
router.use(authMiddleware.verifyToken);

// Obtener el carrito actual
router.get('/', cartController.getCart);

// Agregar ítem (Lote específico)
router.post('/', cartController.addToCart);

// Actualizar cantidad de un ítem
router.put('/:id', cartController.updateItem);

// Eliminar un ítem específico
router.delete('/:id', cartController.removeItem);

// Vaciar todo el carrito
router.delete('/', cartController.clearCart);

module.exports = router;