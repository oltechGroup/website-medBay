// backend/src/controllers/manufacturerController.js

const Manufacturer = require('../models/manufacturerModel');

const manufacturerController = {
  // Crear fabricante con validación de duplicados (ACTUALIZADO)
  create: async (req, res) => {
    try {
      const { name, country, country_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del fabricante es requerido' });
      }

      // Verificar si ya existe
      const existingManufacturer = await Manufacturer.findByName(name);
      if (existingManufacturer) {
        return res.status(409).json({ 
          error: 'El fabricante ya existe',
          manufacturer: existingManufacturer 
        });
      }

      const newManufacturer = await Manufacturer.create({ 
        name, 
        country,  // Mantener por compatibilidad
        country_id // Nuevo campo
      });
      
      res.status(201).json({
        message: 'Fabricante creado exitosamente',
        manufacturer: newManufacturer
      });

    } catch (error) {
      console.error('Error al crear fabricante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los fabricantes (ACTUALIZADO - ahora con country_name)
  getAll: async (req, res) => {
    try {
      const manufacturers = await Manufacturer.findAll();
      res.json(manufacturers);
    } catch (error) {
      console.error('Error al obtener fabricantes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Buscar fabricante por nombre (ACTUALIZADO)
  findByName: async (req, res) => {
    try {
      const { name } = req.params;
      const manufacturer = await Manufacturer.findByName(name);
      
      if (!manufacturer) {
        return res.status(404).json({ error: 'Fabricante no encontrado' });
      }

      res.json(manufacturer);
    } catch (error) {
      console.error('Error al buscar fabricante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ===== NUEVOS ENDPOINTS =====
  
  // Obtener fabricante por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const manufacturer = await Manufacturer.findById(id);
      
      if (!manufacturer) {
        return res.status(404).json({ error: 'Fabricante no encontrado' });
      }

      res.json(manufacturer);
    } catch (error) {
      console.error('Error al obtener fabricante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar fabricante
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, country_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del fabricante es requerido' });
      }

      const updatedManufacturer = await Manufacturer.update(id, { name, country_id });
      
      if (!updatedManufacturer) {
        return res.status(404).json({ error: 'Fabricante no encontrado' });
      }

      res.json({
        message: 'Fabricante actualizado exitosamente',
        manufacturer: updatedManufacturer
      });
    } catch (error) {
      console.error('Error al actualizar fabricante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar fabricante
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      // Necesitamos implementar el método delete en el modelo primero
      // Por ahora solo placeholder
      res.status(501).json({ error: 'Método no implementado aún' });
    } catch (error) {
      console.error('Error al eliminar fabricante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = manufacturerController;