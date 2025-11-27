// backend/src/controllers/categoryController.js

const Category = require('../models/categoryModel');

const categoryController = {
  // Crear categoría (SIN SLUG)
  create: async (req, res) => {
    try {
      const { name, parent_id, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
      }

      // ✅ CORREGIDO: Usar findByName en lugar de findByNameOrSlug
      const existingCategory = await Category.findByName(name);
      if (existingCategory) {
        return res.status(409).json({
          error: 'La categoría ya existe',
          category: existingCategory
        });
      }

      // ✅ CORREGIDO: Sin slug
      const newCategory = await Category.create({ name, parent_id, description });
      res.status(201).json({
        message: 'Categoría creada exitosamente',
        category: newCategory
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todas las categorías
  getAll: async (req, res) => {
    try {
      const categories = await Category.findAll();
      res.json(categories);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener categoría por ID (✅ AHORA FUNCIONA)
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar categoría (✅ AHORA FUNCIONA - SIN SLUG)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, parent_id, description } = req.body;

      const updatedCategory = await Category.update(id, { name, parent_id, description });
      
      if (!updatedCategory) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.json({
        message: 'Categoría actualizada exitosamente',
        category: updatedCategory
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar categoría (✅ AHORA FUNCIONA)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCategory = await Category.delete(id);
      
      if (!deletedCategory) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.json({
        message: 'Categoría eliminada exitosamente',
        category: deletedCategory
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // 🆕 NUEVOS CONTROLADORES PARA ASIGNACIÓN MASIVA (NO AFECTA LO EXISTENTE)
  
  // Asignación masiva de productos a categorías
  batchAssignProducts: async (req, res) => {
    try {
      const { categoryIds, productIds } = req.body;

      if (!categoryIds || !productIds || 
          !Array.isArray(categoryIds) || !Array.isArray(productIds) ||
          categoryIds.length === 0 || productIds.length === 0) {
        return res.status(400).json({ 
          error: 'Se requieren arrays no vacíos de categoryIds y productIds' 
        });
      }

      const results = await Category.batchAssignProducts(categoryIds, productIds);
      res.json({
        message: 'Productos asignados a categorías exitosamente',
        results: results
      });
    } catch (error) {
      console.error('Error en asignación masiva de productos a categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener categorías sin productos
  getWithoutProducts: async (req, res) => {
    try {
      const categories = await Category.findWithoutProducts();
      res.json(categories);
    } catch (error) {
      console.error('Error al obtener categorías sin productos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener estadísticas de categorías
  getStats: async (req, res) => {
    try {
      const stats = await Category.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas de categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

};

module.exports = categoryController;