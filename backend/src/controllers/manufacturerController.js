const Manufacturer = require('../models/manufacturerModel');

const manufacturerController = {
  // Crear fabricante con validación de duplicados
  create: async (req, res) => {
    try {
      const { name, country_id } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false,
          error: 'El nombre del fabricante es requerido' 
        });
      }

      // Verificar si ya existe
      const existingManufacturer = await Manufacturer.findByName(name);
      if (existingManufacturer) {
        return res.status(409).json({ 
          success: false,
          error: 'El fabricante ya existe',
          data: existingManufacturer 
        });
      }

      const newManufacturer = await Manufacturer.create({ 
        name, 
        country_id 
      });
      
      res.status(201).json({
        success: true,
        message: 'Fabricante creado exitosamente',
        data: newManufacturer
      });

    } catch (error) {
      console.error('Error al crear fabricante:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'El país especificado no existe en el sistema' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener todos los fabricantes
  getAll: async (req, res) => {
    try {
      const manufacturers = await Manufacturer.findAll();
      res.json({
        success: true,
        data: manufacturers
      });
    } catch (error) {
      console.error('Error al obtener fabricantes:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  },

  // Obtener fabricante por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const manufacturer = await Manufacturer.findById(id);
      
      if (!manufacturer) {
        return res.status(404).json({ 
          success: false,
          error: 'Fabricante no encontrado' 
        });
      }

      res.json({
        success: true,
        data: manufacturer
      });
    } catch (error) {
      console.error('Error al obtener fabricante:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  },

  // Buscar fabricante por nombre
  getByName: async (req, res) => {
    try {
      const { name } = req.params;
      const manufacturer = await Manufacturer.findByName(name);
      
      if (!manufacturer) {
        return res.status(404).json({ 
          success: false,
          error: 'Fabricante no encontrado' 
        });
      }

      res.json({
        success: true,
        data: manufacturer
      });
    } catch (error) {
      console.error('Error al buscar fabricante:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  },

  // Actualizar fabricante
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, country_id } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false,
          error: 'El nombre del fabricante es requerido' 
        });
      }

      const updatedManufacturer = await Manufacturer.update(id, { name, country_id });
      
      if (!updatedManufacturer) {
        return res.status(404).json({ 
          success: false,
          error: 'Fabricante no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Fabricante actualizado exitosamente',
        data: updatedManufacturer
      });
    } catch (error) {
      console.error('Error al actualizar fabricante:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'El país especificado no existe en el sistema' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Eliminar fabricante
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedManufacturer = await Manufacturer.delete(id);
      
      if (!deletedManufacturer) {
        return res.status(404).json({ 
          success: false,
          error: 'Fabricante no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Fabricante eliminado exitosamente',
        data: deletedManufacturer
      });
    } catch (error) {
      console.error('Error al eliminar fabricante:', error);
      
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'No se puede eliminar el fabricante porque está siendo utilizado en otros registros' 
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = manufacturerController;