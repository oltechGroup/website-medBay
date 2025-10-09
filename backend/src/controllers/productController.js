const Product = require('../models/productModel');

const productController = {
  // Crear producto con validación de duplicados
  create: async (req, res) => {
    try {
      const productData = req.body;

      // Validaciones básicas
      if (!productData.name) {
        return res.status(400).json({ error: 'El nombre del producto es requerido' });
      }

      // Verificar duplicados por SKU global
      if (productData.global_sku) {
        const existingBySku = await Product.findByGlobalSku(productData.global_sku);
        if (existingBySku) {
          return res.status(409).json({ 
            error: 'Ya existe un producto con este SKU global',
            product: existingBySku 
          });
        }
      }

      // Verificar duplicados por nombre y fabricante
      if (productData.name && productData.manufacturer_id) {
        const existingByName = await Product.findByNameAndManufacturer(
          productData.name, 
          productData.manufacturer_id
        );
        if (existingByName) {
          return res.status(409).json({ 
            error: 'Ya existe un producto con este nombre y fabricante',
            product: existingByName 
          });
        }
      }

      const newProduct = await Product.create(productData);
      res.status(201).json({
        message: 'Producto creado exitosamente',
        product: newProduct
      });

    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los productos
  getAll: async (req, res) => {
    try {
      const products = await Product.findAll();
      res.json(products);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener producto por ID
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

  // Actualizar producto
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const productData = req.body;

      const updatedProduct = await Product.update(id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Producto no encontrado' });
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

  // Eliminar producto
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

  // Buscar productos
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
  }
};

module.exports = productController;