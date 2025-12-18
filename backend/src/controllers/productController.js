// backend/src/controllers/productController.js - MODIFICADO

// backend/src/controllers/productController.js

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const ProductCategory = require('../models/productCategoryModel');

const productController = {
  // CREATE (Mantenido igual)
  create: async (req, res) => {
    try {
      const productData = req.body;

      if (!productData.description) {
        return res.status(400).json({ error: 'La descripción del producto es requerida' });
      }

      // Validaciones de duplicados... (Mantenido igual que tu código original)
      if (productData.description) {
        const existingByDescription = await Product.findByDescription(productData.description);
        if (existingByDescription) {
          return res.status(409).json({ 
            error: 'Ya existe un producto con esta descripción',
            product: existingByDescription 
          });
        }
      }

      if (productData.global_sku) {
        const existingBySku = await Product.findByGlobalSku(productData.global_sku);
        if (existingBySku) {
          return res.status(409).json({ 
            error: 'Ya existe un producto con este SKU global',
            product: existingBySku 
          });
        }
      }

      const newProduct = await Product.create(productData);

      if (productData.category_ids && productData.category_ids.length > 0) {
        try {
          await ProductCategory.bulkCreate(newProduct.id, productData.category_ids);
        } catch (categoryError) {
          console.error('Error al guardar categorías:', categoryError);
        }
      }

      res.status(201).json({
        message: 'Producto creado exitosamente',
        product: newProduct
      });

    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ GET ALL - ACTUALIZADO
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const searchTerm = req.query.search || '';
      const hasImages = req.query.hasImages || 'all';
      const manufacturerId = req.query.manufacturerId || '';
      const categoryId = req.query.categoryId || '';
      
      // Capturamos el nuevo filtro
      const categoryStatus = req.query.categoryStatus || 'all'; // 'all', 'uncategorized', 'categorized'

      const result = await Product.findPaginated({
        page,
        limit,
        searchTerm,
        hasImages,
        manufacturerId,
        categoryId,
        categoryStatus // Pasamos el filtro al modelo
      });

      res.json(result);

    } catch (error) {
      console.error('Error al obtener productos paginados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // UPDATE (Mantenido igual)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const productData = req.body;

      // Validaciones básicas de duplicados (Mantenido igual)
      if (productData.description !== undefined && !productData.description.trim()) {
        return res.status(400).json({ error: 'La descripción del producto es requerida' });
      }

      const updatedProduct = await Product.update(id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      if (productData.category_ids !== undefined) {
        try {
          await ProductCategory.deleteByProductId(id);
          if (productData.category_ids && productData.category_ids.length > 0) {
            await ProductCategory.bulkCreate(id, productData.category_ids);
          }
        } catch (categoryError) {
          console.error('Error al actualizar categorías:', categoryError);
        }
      }

      res.json({
        message: 'Producto actualizado exitosamente',
        product: updatedProduct
      });

    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedProduct = await Product.delete(id);
      
      if (!deletedProduct) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json({
        message: 'Producto eliminado exitosamente',
        product: deletedProduct
      });

    } catch (error) {
      // ✅ MANEJO DE ERROR DE LLAVE FORÁNEA (PostgreSQL Error 23503)
      if (error.code === '23503') {
        return res.status(409).json({ 
          error: 'No se puede eliminar este producto porque está asociado a otros registros (Inventario, Proveedores o Pedidos).',
          details: 'Debes eliminar primero las existencias y relaciones asociadas.'
        });
      }

      console.error('Error al eliminar producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  search: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Término de búsqueda requerido' });
      }
      const products = await Product.search(q);
      res.json(products);
    } catch (error) {
      console.error('Error en búsqueda de productos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getStats: async (req, res) => {
    try {
      const stats = await Product.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  exportProductsWithoutImages: async (req, res) => {
    try {
      const products = await Product.getProductsWithoutImages();
      res.json({
        message: 'Exportación iniciada',
        count: products.length,
        products: products
      });
    } catch (error) {
      console.error('Error exportación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProductImages: async (req, res) => {
    try {
      const { id } = req.params;
      const images = await ProductImage.findByProductId(id);
      res.json(images);
    } catch (error) {
      console.error('Error al obtener imágenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  batchAssignCategories: async (req, res) => {
    try {
      const { productIds, categoryIds } = req.body;
      // Validaciones básicas (Mantenido igual)
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de productos' });
      }
      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de categorías' });
      }

      const results = [];
      for (const productId of productIds) {
        try {
          const product = await Product.findById(productId);
          if (!product) {
            results.push({ productId, success: false, error: 'Producto no encontrado' });
            continue;
          }
          await ProductCategory.deleteByProductId(productId);
          await ProductCategory.bulkCreate(productId, categoryIds);
          results.push({ productId, success: true, categories: categoryIds });
        } catch (error) {
          results.push({ productId, success: false, error: error.message });
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.json({
        message: `Asignación masiva completada: ${successful.length} exitosas, ${failed.length} fallidas`,
        results: { successful, failed }
      });

    } catch (error) {
      console.error('Error en asignación masiva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProductsWithoutCategories: async (req, res) => {
    try {
      const products = await Product.getProductsWithoutCategories();
      res.json(products);
    } catch (error) {
      console.error('Error al obtener productos sin categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = productController;