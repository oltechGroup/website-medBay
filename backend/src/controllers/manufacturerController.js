const Manufacturer = require('../models/manufacturerModel');

const manufacturerController = {
  // Crear fabricante con validación de duplicados
  create: async (req, res) => {
    try {
      const { name, country } = req.body;

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

      const newManufacturer = await Manufacturer.create({ name, country });
      res.status(201).json({
        message: 'Fabricante creado exitosamente',
        manufacturer: newManufacturer
      });

    } catch (error) {
      console.error('Error al crear fabricante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los fabricantes
  getAll: async (req, res) => {
    try {
      const manufacturers = await Manufacturer.findAll();
      res.json(manufacturers);
    } catch (error) {
      console.error('Error al obtener fabricantes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Buscar fabricante por nombre
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
  }
};

module.exports = manufacturerController;