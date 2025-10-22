const Currency = require('../models/currencyModel');

const currencyController = {
  // Obtener todas las monedas
  getAll: async (req, res) => {
    try {
      const currencies = await Currency.findAll();
      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las monedas',
        error: error.message
      });
    }
  },

  // Obtener moneda por código
  getByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const currency = await Currency.findByCode(code);

      if (!currency) {
        return res.status(404).json({
          success: false,
          message: 'Moneda no encontrada'
        });
      }

      res.json({
        success: true,
        data: currency
      });
    } catch (error) {
      console.error('Error fetching currency:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la moneda',
        error: error.message
      });
    }
  },

  // Crear nueva moneda
  create: async (req, res) => {
    try {
      const currencyData = req.body;

      // Validar que el código tenga 3 caracteres
      if (currencyData.code.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'El código de la moneda debe tener exactamente 3 caracteres'
        });
      }

      const newCurrency = await Currency.create(currencyData);
      res.status(201).json({
        success: true,
        message: 'Moneda creada exitosamente',
        data: newCurrency
      });
    } catch (error) {
      console.error('Error creating currency:', error);
      
      if (error.code === '23505') { // Violación de unique constraint
        return res.status(400).json({
          success: false,
          message: 'El código de la moneda ya existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al crear la moneda',
        error: error.message
      });
    }
  },

  // Actualizar moneda
  update: async (req, res) => {
    try {
      const { code } = req.params;
      const currencyData = req.body;

      const updatedCurrency = await Currency.update(code, currencyData);

      if (!updatedCurrency) {
        return res.status(404).json({
          success: false,
          message: 'Moneda no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Moneda actualizada exitosamente',
        data: updatedCurrency
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la moneda',
        error: error.message
      });
    }
  },

  // Eliminar moneda
  delete: async (req, res) => {
    try {
      const { code } = req.params;
      const deleted = await Currency.delete(code);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Moneda no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Moneda eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error deleting currency:', error);

      if (error.code === '23503') { // Violación de foreign key
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la moneda porque está siendo utilizada en otros registros'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar la moneda',
        error: error.message
      });
    }
  }
};

module.exports = currencyController;