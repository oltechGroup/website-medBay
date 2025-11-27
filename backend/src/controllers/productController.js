// backend/src/controllers/productController.js - MODIFICADO

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const ProductCategory = require('../models/productCategoryModel');

const productController = {
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

      if (productData.description && productData.manufacturer_id) {
        const existingByDescription = await Product.findByDescriptionAndManufacturer(
          productData.description, 
          productData.manufacturer_id
        );
        if (existingByDescription) {
          return res.status(409).json({ 
            error: 'Ya existe un producto con esta descripción y fabricante',
            product: existingByDescription 
          });
        }
      }

      const newProduct = await Product.create(productData);

      if (productData.category_ids && productData.category_ids.length > 0) {
        try {
          await ProductCategory.bulkCreate(newProduct.id, productData.category_ids);
          console.log(`✅ Categorías guardadas para producto ${newProduct.id}:`, productData.category_ids);
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

  getAll: async (req, res) => {
    try {
      const products = await Product.findAll();
      res.json(products);
    } catch (error) {
      console.error('Error al obtener productos:', error);
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

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const productData = req.body;

      if (productData.description !== undefined && !productData.description.trim()) {
        return res.status(400).json({ error: 'La descripción del producto es requerida' });
      }

      if (productData.description) {
        const existingByDescription = await Product.findByDescription(productData.description);
        if (existingByDescription && existingByDescription.id !== id) {
          return res.status(409).json({ 
            error: 'Ya existe otro producto con esta descripción',
            product: existingByDescription 
          });
        }
      }

      if (productData.global_sku) {
        const existingBySku = await Product.findByGlobalSku(productData.global_sku);
        if (existingBySku && existingBySku.id !== id) {
          return res.status(409).json({ 
            error: 'Ya existe otro producto con este SKU global',
            product: existingBySku 
          });
        }
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
            console.log(`✅ Categorías actualizadas para producto ${id}:`, productData.category_ids);
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
      console.error('Error al obtener estadísticas de productos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  exportProductsWithoutImages: async (req, res) => {
    try {
      const products = await Product.getProductsWithoutImages();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=productos-sin-imagenes.xlsx');
      
      res.json({
        message: 'Exportación iniciada',
        count: products.length,
        products: products
      });

    } catch (error) {
      console.error('Error al exportar productos sin imágenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getProductImages: async (req, res) => {
    try {
      const { id } = req.params;
      
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const images = await ProductImage.findByProductId(id);
      res.json(images);

    } catch (error) {
      console.error('Error al obtener imágenes del producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ NUEVO: Asignación masiva de categorías
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
          // Verificar que el producto existe
          const product = await Product.findById(productId);
          if (!product) {
            results.push({ productId, success: false, error: 'Producto no encontrado' });
            continue;
          }

          // Eliminar categorías existentes y asignar las nuevas
          await ProductCategory.deleteByProductId(productId);
          await ProductCategory.bulkCreate(productId, categoryIds);
          
          results.push({ productId, success: true, categories: categoryIds });
        } catch (error) {
          console.error(`Error asignando categorías al producto ${productId}:`, error);
          results.push({ productId, success: false, error: error.message });
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.json({
        message: `Asignación masiva completada: ${successful.length} exitosas, ${failed.length} fallidas`,
        results: {
          successful,
          failed
        }
      });

    } catch (error) {
      console.error('Error en asignación masiva de categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ NUEVO: Obtener productos sin categorías - CORREGIDO
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