const Category = require('../models/categoryModel');

const categoryController = {
  // Crear categoría con validación de duplicados
  create: async (req, res) => {
    try {
      const { name, parent_id, slug, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
      }

      // Verificar si ya existe
      const existingCategory = await Category.findByNameOrSlug(name, slug);
      if (existingCategory) {
        return res.status(409).json({ 
          error: 'La categoría ya existe',
          category: existingCategory 
        });
      }

      const newCategory = await Category.create({ name, parent_id, slug, description });
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
  }
};

module.exports = categoryController;