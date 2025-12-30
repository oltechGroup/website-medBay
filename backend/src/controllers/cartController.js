// backend/src/controllers/cartController.js

const Cart = require('../models/cartModel');

const cartController = {
  // --- OBTENER CARRITO ---
  getCart: async (req, res) => {
    try {
      const userId = req.user.id; // Viene del token (authMiddleware)
      const cartItems = await Cart.getCart(userId);
      
      // Opcional: Calcular resumen del carrito aquí
      const summary = cartItems.reduce((acc, item) => {
        acc.totalItems += item.cart_quantity;
        acc.subtotal += item.cart_quantity * parseFloat(item.unit_price);
        return acc;
      }, { totalItems: 0, subtotal: 0 });

      res.json({ items: cartItems, summary });
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- AGREGAR ÍTEM ---
  addToCart: async (req, res) => {
    try {
      const userId = req.user.id;
      const { product_lot_id, quantity } = req.body;

      if (!product_lot_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }

      // 1. Verificar Stock Real del Lote
      const stockInfo = await Cart.checkStock(product_lot_id);
      if (!stockInfo) {
        return res.status(404).json({ error: 'El lote ya no existe' });
      }

      // 2. Validar que no pidan más de lo que hay
      // NOTA: Si ya tiene ítems en el carrito, habría que sumar esa cantidad para validar bien,
      // pero por ahora validamos la solicitud entrante.
      if (quantity > stockInfo.quantity) {
        return res.status(400).json({ 
          error: `Stock insuficiente. Solo quedan ${stockInfo.quantity} unidades en este lote.` 
        });
      }

      // 3. Agregar al carrito
      const newItem = await Cart.addToCart(userId, product_lot_id, quantity);
      res.json({ message: 'Agregado al carrito', item: newItem });

    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- ACTUALIZAR CANTIDAD ---
  updateItem: async (req, res) => {
    try {
      const { id } = req.params; // ID del ítem del carrito
      const { quantity, product_lot_id } = req.body; // Necesitamos el lot_id para checar stock

      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
      }

      // 1. Verificar Stock nuevamente
      if (product_lot_id) {
        const stockInfo = await Cart.checkStock(product_lot_id);
        if (stockInfo && quantity > stockInfo.quantity) {
           return res.status(400).json({ 
             error: `No puedes agregar más. Solo quedan ${stockInfo.quantity} unidades disponibles.` 
           });
        }
      }

      const updatedItem = await Cart.updateQuantity(id, quantity);
      
      if (!updatedItem) {
        return res.status(404).json({ error: 'Ítem no encontrado' });
      }

      res.json({ message: 'Cantidad actualizada', item: updatedItem });

    } catch (error) {
      console.error('Error al actualizar carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- ELIMINAR ÍTEM ---
  removeItem: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Cart.removeItem(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Ítem no encontrado' });
      }

      res.json({ message: 'Producto eliminado del carrito' });

    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- VACIAR CARRITO ---
  clearCart: async (req, res) => {
    try {
      const userId = req.user.id;
      await Cart.clearCart(userId);
      res.json({ message: 'Carrito vaciado' });
    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = cartController;