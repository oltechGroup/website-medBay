const AvalaraTaxCode = require('../models/avalaraTaxCodeModel');

const avalaraTaxCodeController = {
  // Obtener todos los códigos fiscales
  getAll: async (req, res) => {
    try {
      const taxCodes = await AvalaraTaxCode.findAll();
      res.json({
        success: true,
        data: taxCodes
      });
    } catch (error) {
      console.error('Error fetching tax codes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los códigos fiscales',
        error: error.message
      });
    }
  },

  // Obtener código fiscal por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const taxCode = await AvalaraTaxCode.findById(id);

      if (!taxCode) {
        return res.status(404).json({
          success: false,
          message: 'Código fiscal no encontrado'
        });
      }

      res.json({
        success: true,
        data: taxCode
      });
    } catch (error) {
      console.error('Error fetching tax code:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el código fiscal',
        error: error.message
      });
    }
  },

  // Crear nuevo código fiscal
  create: async (req, res) => {
    try {
      const taxCodeData = req.body;
      const newTaxCode = await AvalaraTaxCode.create(taxCodeData);
      
      res.status(201).json({
        success: true,
        message: 'Código fiscal creado exitosamente',
        data: newTaxCode
      });
    } catch (error) {
      console.error('Error creating tax code:', error);
      
      if (error.code === '23505') { // Violación de unique constraint
        return res.status(400).json({
          success: false,
          message: 'El código fiscal ya existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al crear el código fiscal',
        error: error.message
      });
    }
  },

  // Actualizar código fiscal
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const taxCodeData = req.body;

      const updatedTaxCode = await AvalaraTaxCode.update(id, taxCodeData);

      if (!updatedTaxCode) {
        return res.status(404).json({
          success: false,
          message: 'Código fiscal no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Código fiscal actualizado exitosamente',
        data: updatedTaxCode
      });
    } catch (error) {
      console.error('Error updating tax code:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el código fiscal',
        error: error.message
      });
    }
  },

  // Eliminar código fiscal
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await AvalaraTaxCode.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Código fiscal no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Código fiscal eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting tax code:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el código fiscal',
        error: error.message
      });
    }
  }
};

module.exports = avalaraTaxCodeController;