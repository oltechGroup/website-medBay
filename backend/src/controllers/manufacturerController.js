//backend/src/controllers/manufacturerController.js

const Manufacturer = require('../models/manufacturerModel');

const manufacturerController = {
  create: async (req, res) => {
    try {
      const { name, contact_info, website } = req.body;
      if (!name || name.trim() === '') return res.status(400).json({ success: false, error: 'Nombre requerido' });

      const existing = await Manufacturer.findByName(name.trim());
      if (existing) return res.status(409).json({ success: false, error: 'El fabricante ya existe' });

      const newManufacturer = await Manufacturer.create({ 
        name: name.trim(), contact_info: contact_info || {}, website: website || null 
      });
      res.status(201).json({ success: true, data: newManufacturer });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error interno' });
    }
  },

  // OPTIMIZADO: getAll con paginación real
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;

      const [manufacturers, totalCount] = await Promise.all([
        Manufacturer.findAll({ limit, offset, search }),
        Manufacturer.count(search)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: manufacturers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener fabricantes:', error);
      res.status(500).json({ success: false, error: 'Error interno' });
    }
  },

  getById: async (req, res) => {
    try {
      const manufacturer = await Manufacturer.findById(req.params.id);
      if (!manufacturer) return res.status(404).json({ success: false, error: 'No encontrado' });
      res.json({ success: true, data: manufacturer });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error interno' });
    }
  },

  getByName: async (req, res) => {
    try {
      const manufacturer = await Manufacturer.findByName(req.params.name);
      if (!manufacturer) return res.status(404).json({ success: false, error: 'No encontrado' });
      res.json({ success: true, data: manufacturer });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error interno' });
    }
  },

  update: async (req, res) => {
    try {
      const { name, contact_info, website } = req.body;
      if (!name || name.trim() === '') return res.status(400).json({ success: false, error: 'Nombre requerido' });

      const updated = await Manufacturer.update(req.params.id, { 
        name: name.trim(), contact_info: contact_info || {}, website: website || null 
      });
      if (!updated) return res.status(404).json({ success: false, error: 'No encontrado' });
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error interno' });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await Manufacturer.delete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'No encontrado' });
      res.json({ success: true, data: deleted });
    } catch (error) {
      if (error.code === '23503') return res.status(400).json({ success: false, error: 'No se puede eliminar: en uso por productos' });
      res.status(500).json({ success: false, error: 'Error interno' });
    }
  }
};

module.exports = manufacturerController;