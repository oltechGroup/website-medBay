//backend/src/routes/wishlistRoutes.js

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/auth');

// 🔒 Todas las rutas de favoritos requieren autenticación
router.use(authMiddleware.verifyToken);

// Obtener lista completa
router.get('/', wishlistController.getWishlist);

// Agregar producto a favoritos
router.post('/', wishlistController.add);

// Verificar si un producto específico está en favoritos (para pintar el ❤️)
router.get('/:id/status', wishlistController.checkStatus);

// Eliminar producto de favoritos (ID del producto)
router.delete('/:id', wishlistController.remove);

module.exports = router;