const Country = require('../models/countryModel');

const countryController = {
  // Obtener todos los países
  getAll: async (req, res) => {
    try {
      const countries = await Country.findAll();
      res.json({
        success: true,
        data: countries
      });
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los países',
        error: error.message
      });
    }
  },

  // Obtener país por código
  getByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const country = await Country.findByCode(code);

      if (!country) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      res.json({
        success: true,
        data: country
      });
    } catch (error) {
      console.error('Error fetching country:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el país',
        error: error.message
      });
    }
  },

  // Crear nuevo país
  create: async (req, res) => {
    try {
      const countryData = req.body;

      // Validar que el código tenga 2 caracteres
      if (countryData.code.length !== 2) {
        return res.status(400).json({
          success: false,
          message: 'El código del país debe tener exactamente 2 caracteres'
        });
      }

      const newCountry = await Country.create(countryData);
      res.status(201).json({
        success: true,
        message: 'País creado exitosamente',
        data: newCountry
      });
    } catch (error) {
      console.error('Error creating country:', error);
      
      if (error.code === '23505') { // Violación de unique constraint
        return res.status(400).json({
          success: false,
          message: 'El código del país ya existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al crear el país',
        error: error.message
      });
    }
  },

  // Actualizar país
  update: async (req, res) => {
    try {
      const { code } = req.params;
      const countryData = req.body;

      const updatedCountry = await Country.update(code, countryData);

      if (!updatedCountry) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'País actualizado exitosamente',
        data: updatedCountry
      });
    } catch (error) {
      console.error('Error updating country:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el país',
        error: error.message
      });
    }
  },

  // Eliminar país
  delete: async (req, res) => {
    try {
      const { code } = req.params;
      const deleted = await Country.delete(code);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'País eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting country:', error);

      if (error.code === '23503') { // Violación de foreign key
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el país porque está siendo utilizado en otros registros'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar el país',
        error: error.message
      });
    }
  }
};

module.exports = countryController;