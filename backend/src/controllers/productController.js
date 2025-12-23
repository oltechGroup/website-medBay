// backend/src/controllers/productController.js

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const ProductCategory = require('../models/productCategoryModel');
const ProductLot = require('../models/productLotModel'); 

const productController = {
  // CREATE (Mantenido igual)
  create: async (req, res) => {
    try {
      const productData = req.body;

      if (!productData.description) {
        return res.status(400).json({ error: 'La descripción del producto es requerida' });
      }

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

  // ✅ GET ALL - OPTIMIZADO CON ORDENAMIENTO (SORTBY)
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const searchTerm = req.query.search || '';
      const hasImages = req.query.hasImages || 'all';
      const manufacturerId = req.query.manufacturerId || '';
      const categoryId = req.query.categoryId || '';
      
      // Filtros avanzados
      const status = req.query.status || 'all'; 
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
      
      // ✅ NUEVO: Ordenamiento
      const sortBy = req.query.sortBy || 'newest'; // 'price_asc', 'price_desc', etc.

      const result = await Product.findPaginated({
        page,
        limit,
        searchTerm,
        hasImages,
        manufacturerId,
        categoryId,
        status,
        minPrice,
        maxPrice,
        sortBy
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

  // ✅ GET LOTES POR PRODUCTO (Ahora soporta filtro ?status=expired)
  getProductLots: async (req, res) => {
    try {
      const { id } = req.params;
      const statusFilter = req.query.status || 'all'; // Capturamos el filtro
      
      const lots = await ProductLot.findByProductId(id, statusFilter);
      res.json(lots);
    } catch (error) {
      console.error('Error al obtener lotes del producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProductCategories: async (req, res) => {
    try {
      const { id } = req.params;
      const categories = await ProductCategory.findByProductId(id);
      res.json(categories);
    } catch (error) {
      console.error('Error al obtener categorías del producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  batchAssignCategories: async (req, res) => {
    try {
      const { productIds, categoryIds } = req.body;
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