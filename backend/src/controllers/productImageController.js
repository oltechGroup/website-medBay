// backend/src/controllers/productImageController.js
const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const path = require('path');

const productImageController = {
  // Subir imágenes (método simple)
  upload: async (req, res) => {
    try {
      const { productId } = req.body;
      const files = req.files;

      // Validar producto
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

      if (!files || files.length === 0) return res.status(400).json({ error: 'No files' });

      // Orden base
      const existingImages = await ProductImage.findByProductId(productId);
      let displayOrder = existingImages.length;

      const uploadPromises = files.map((file, index) => {
        const isPrimary = existingImages.length === 0 && index === 0;
        
        // 🚨 CORRECCIÓN 1: Crear URL web relativa, no ruta absoluta de Windows
        // Esto guarda: /uploads/images/nombre-archivo.jpg
        const webUrl = `/uploads/images/${file.filename}`; 

        const imageData = {
          product_id: productId,
          image_url: webUrl, // Usamos la URL web
          image_name: file.originalname,
          is_primary: isPrimary,
          display_order: displayOrder + index,
          created_by: req.user.id
        };

        return ProductImage.create(imageData);
      });

      const newImages = await Promise.all(uploadPromises);

      if (existingImages.length === 0 && newImages.length > 0) {
        await ProductImage.setAsPrimary(newImages[0].id, productId);
      }

      res.json({ message: 'Success', images: newImages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Subir con metadata
  uploadMultipleWithMetadata: async (req, res) => {
    try {
      const { productId, imagesMetadata } = req.body;
      const files = req.files;

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

      if (!files || files.length === 0) return res.status(400).json({ error: 'No files' });

      const existingImages = await ProductImage.findByProductId(productId);
      let baseOrder = existingImages.length;

      const uploadPromises = files.map((file, index) => {
        let fileMetadata = null;
        if (imagesMetadata) {
          const metadataArray = JSON.parse(imagesMetadata);
          fileMetadata = metadataArray.find(meta => meta.fileName === file.originalname);
        }

        const isPrimary = fileMetadata ? fileMetadata.isPrimary : false;
        const displayOrder = fileMetadata ? fileMetadata.displayOrder : (baseOrder + index);

        // 🚨 CORRECCIÓN 1: Crear URL web relativa
        const webUrl = `/uploads/images/${file.filename}`;

        const imageData = {
          product_id: productId,
          image_url: webUrl, // Usamos la URL web
          image_name: file.originalname,
          is_primary: isPrimary,
          display_order: displayOrder,
          created_by: req.user.id
        };

        return ProductImage.create(imageData);
      });

      const newImages = await Promise.all(uploadPromises);
      
      const primaryImage = newImages.find(img => img.is_primary);
      if (primaryImage) {
        await ProductImage.setAsPrimary(primaryImage.id, productId);
      }

      res.json({ message: 'Success', images: newImages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // 🚨 CORRECCIÓN 2: Arreglo del Error 404 en setPrimary
  setPrimary: async (req, res) => {
    try {
      const { id } = req.params; // ID de la imagen

      // Paso A: Necesitamos saber a qué producto pertenece la imagen primero
      const imageToUpdate = await ProductImage.findById(id); 
      
      if (!imageToUpdate) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      // Paso B: Ahora sí tenemos el product_id para llamar a la función
      const updatedImage = await ProductImage.setAsPrimary(id, imageToUpdate.product_id);
      
      res.json({ 
        message: 'Imagen establecida como principal',
        image: updatedImage 
      });

    } catch (error) {
      console.error('Error setPrimary:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedImage = await ProductImage.delete(id);
      if (!deletedImage) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted', image: deletedImage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = productImageController;