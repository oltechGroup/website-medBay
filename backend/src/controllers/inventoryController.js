const Inventory = require('../models/inventoryModel');

const inventoryController = {
  // Crear nuevo lote
  createLot: async (req, res) => {
    try {
      const lotData = {
        ...req.body,
        created_by: req.user.id // El usuario autenticado
      };

      // Validaciones básicas
      if (!lotData.product_supplier_id) {
        return res.status(400).json({ error: 'product_supplier_id es requerido' });
      }

      if (!lotData.quantity || lotData.quantity < 0) {
        return res.status(400).json({ error: 'Cantidad válida es requerida' });
      }

      const newLot = await Inventory.createLot(lotData);
      res.status(201).json({
        message: 'Lote creado exitosamente',
        lot: newLot
      });

    } catch (error) {
      console.error('Error al crear lote:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los lotes
  getAllLots: async (req, res) => {
    try {
      const lots = await Inventory.findAllLots();
      res.json(lots);
    } catch (error) {
      console.error('Error al obtener lotes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener lotes por producto
  getLotsByProduct: async (req, res) => {
    try {
      const { productId } = req.params;
      const lots = await Inventory.findLotsByProduct(productId);
      
      res.json(lots);
    } catch (error) {
      console.error('Error al obtener lotes por producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener lotes próximos a expirar
  getNearExpiryLots: async (req, res) => {
    try {
      const { days } = req.query;
      const lots = await Inventory.findNearExpiryLots(days || 90);
      
      res.json(lots);
    } catch (error) {
      console.error('Error al obtener lotes próximos a expirar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar cantidad de lote
  updateLotQuantity: async (req, res) => {
    try {
      const { lotId } = req.params;
      const { quantity } = req.body;

      if (quantity < 0) {
        return res.status(400).json({ error: 'La cantidad no puede ser negativa' });
      }

      const updatedLot = await Inventory.updateLotQuantity(lotId, quantity);
      
      if (!updatedLot) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      res.json({
        message: 'Cantidad actualizada exitosamente',
        lot: updatedLot
      });

    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Reservar cantidad de lote
  reserveLotQuantity: async (req, res) => {
    try {
      const { lotId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad a reservar debe ser mayor a 0' });
      }

      const updatedLot = await Inventory.reserveLotQuantity(lotId, quantity);
      
      if (!updatedLot) {
        return res.status(400).json({ error: 'No hay suficiente stock disponible' });
      }

      res.json({
        message: 'Cantidad reservada exitosamente',
        lot: updatedLot
      });

    } catch (error) {
      console.error('Error al reservar cantidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Liberar cantidad reservada
  releaseLotQuantity: async (req, res) => {
    try {
      const { lotId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad a liberar debe ser mayor a 0' });
      }

      const updatedLot = await Inventory.releaseLotQuantity(lotId, quantity);
      
      if (!updatedLot) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      res.json({
        message: 'Cantidad liberada exitosamente',
        lot: updatedLot
      });

    } catch (error) {
      console.error('Error al liberar cantidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = inventoryController;