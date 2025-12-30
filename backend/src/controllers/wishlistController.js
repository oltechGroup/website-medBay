// backend/src/controllers/wishlistController.js

const Wishlist = require('../models/wishlistModel');

const wishlistController = {
  // --- OBTENER FAVORITOS ---
  getWishlist: async (req, res) => {
    try {
      const userId = req.user.id;
      const items = await Wishlist.getByUser(userId);
      res.json(items);
    } catch (error) {
      console.error('Error obteniendo wishlist:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- AGREGAR ---
  add: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      await Wishlist.add(userId, productId);
      res.json({ success: true, message: 'Producto agregado a favoritos' });

    } catch (error) {
      console.error('Error agregando a wishlist:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- ELIMINAR ---
  remove: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params; // Aquí 'id' es el productId

      const deleted = await Wishlist.remove(userId, id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Ítem no encontrado en favoritos' });
      }

      res.json({ success: true, message: 'Producto eliminado de favoritos' });

    } catch (error) {
      console.error('Error eliminando de wishlist:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- VERIFICAR ESTADO (Para UI) ---
  checkStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params; // productId
      const exists = await Wishlist.checkStatus(userId, id);
      res.json({ isInWishlist: exists });
    } catch (error) {
      console.error('Error verificando wishlist:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = wishlistController;