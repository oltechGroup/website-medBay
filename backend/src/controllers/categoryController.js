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

      const existingCategory = await Category.findByName(name);
      if (existingCategory) {
        return res.status(409).json({
          error: 'La categoría ya existe',
          category: existingCategory
        });
      }

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

  // ✅ OBTENER CATEGORÍAS - SOPORTA PAGINACIÓN Y BÚSQUEDA
  getAll: async (req, res) => {
    try {
      // Capturamos parámetros de la query string
      const page = req.query.page ? parseInt(req.query.page) : null;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const searchTerm = req.query.search || '';

      // Si se envía el parámetro "page", usamos la lógica de paginación eficiente
      if (page) {
        const result = await Category.findPaginated({
          page,
          limit,
          searchTerm
        });
        return res.json(result);
      }

      // Si no hay página (ej. para cargar el árbol o selectores), devolvemos la lista completa
      const categories = await Category.findAll();
      res.json(categories);
      
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener categoría por ID
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

  // Actualizar categoría
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

  // Eliminar categoría
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

  // Obtener categorías sin productos (Útil para filtros de limpieza)
  getWithoutProducts: async (req, res) => {
    try {
      const categories = await Category.findWithoutProducts();
      res.json(categories);
    } catch (error) {
      console.error('Error al obtener categorías sin productos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener estadísticas de categorías (Para las Stats Cards)
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