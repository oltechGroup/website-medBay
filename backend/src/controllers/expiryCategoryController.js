const ExpiryCategory = require('../models/expiryCategoryModel');

const expiryCategoryController = {
  create: async (req, res) => {
    try {
      const { name, description, days_threshold, discount_percentage, is_active, sort_order } = req.body;

      if (!name || days_threshold === undefined || discount_percentage === undefined) {
        return res.status(400).json({ 
          error: 'Nombre, umbral de días y porcentaje de descuento son requeridos' 
        });
      }

      const existingCategory = await ExpiryCategory.findByName(name);
      if (existingCategory) {
        return res.status(409).json({ error: 'Ya existe una categoría con este nombre' });
      }

      const newCategory = await ExpiryCategory.create({
        name,
        description,
        days_threshold,
        discount_percentage,
        is_active: is_active !== undefined ? is_active : true,
        sort_order: sort_order || 0
      });

      res.status(201).json({
        message: 'Categoría de expiración creada exitosamente',
        category: newCategory
      });
    } catch (error) {
      console.error('Error al crear categoría de expiración:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getAll: async (req, res) => {
    try {
      const categories = await ExpiryCategory.findAll();
      res.json(categories);
    } catch (error) {
      console.error('Error al obtener categorías de expiración:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await ExpiryCategory.findById(id);
      if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
      res.json(category);
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, days_threshold, discount_percentage, is_active, sort_order } = req.body;

      const updatedCategory = await ExpiryCategory.update(id, {
        name, description, days_threshold, discount_percentage, is_active, sort_order
      });
      
      if (!updatedCategory) return res.status(404).json({ error: 'Categoría no encontrada' });

      res.json({
        message: 'Categoría actualizada exitosamente',
        category: updatedCategory
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCategory = await ExpiryCategory.delete(id);
      if (!deletedCategory) return res.status(404).json({ error: 'Categoría no encontrada' });

      res.json({
        message: 'Categoría eliminada exitosamente',
        category: deletedCategory
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = expiryCategoryController;