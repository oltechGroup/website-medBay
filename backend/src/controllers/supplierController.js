const Supplier = require('../models/supplierModel');

const supplierController = {
  create: async (req, res) => {
    try {
      console.log('📦 Creando proveedor - Datos recibidos:', req.body);
      
      const { name, tax_id, country, default_currency, contact_info } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
      }

      // ✅ CORREGIDO: Validar que country no tenga más de 2 caracteres
      if (country && country.length > 2) {
        return res.status(400).json({ 
          error: 'El código de país no puede tener más de 2 caracteres. Ejemplos: MX, US, CA' 
        });
      }

      // Verificar si ya existe
      const existingSupplier = await Supplier.findByName(name);
      if (existingSupplier) {
        return res.status(409).json({
          error: 'Ya existe un proveedor con este nombre'
        });
      }

      const newSupplier = await Supplier.create({
        name,
        tax_id,
        country: country && country.length <= 2 ? country.toUpperCase() : null, // ✅ Asegurar 2 caracteres máximo
        default_currency,
        contact_info
      });

      console.log('✅ Proveedor creado exitosamente:', newSupplier.id);
      res.status(201).json({
        message: 'Proveedor creado exitosamente',
        supplier: newSupplier
      });
    } catch (error) {
      console.error('❌ Error al crear proveedor:', error);
      
      // ✅ Manejar error específico de longitud de country
      if (error.code === '22001') {
        return res.status(400).json({ 
          error: 'El código de país no puede tener más de 2 caracteres. Use: MX, US, CA, etc.' 
        });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const suppliers = await Supplier.findAll();
      res.json(suppliers);
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await Supplier.findById(id);
      
      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      
      res.json(supplier);
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, tax_id, country, default_currency, contact_info } = req.body;

      // ✅ CORREGIDO: Validar country en update también
      if (country && country.length > 2) {
        return res.status(400).json({ 
          error: 'El código de país no puede tener más de 2 caracteres. Ejemplos: MX, US, CA' 
        });
      }

      const updatedSupplier = await Supplier.update(id, {
        name,
        tax_id,
        country: country && country.length <= 2 ? country.toUpperCase() : null,
        default_currency,
        contact_info
      });
      
      if (!updatedSupplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      res.json({
        message: 'Proveedor actualizado exitosamente',
        supplier: updatedSupplier
      });
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      
      // ✅ Manejar error específico de longitud de country
      if (error.code === '22001') {
        return res.status(400).json({ 
          error: 'El código de país no puede tener más de 2 caracteres. Use: MX, US, CA, etc.' 
        });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedSupplier = await Supplier.delete(id);
      
      if (!deletedSupplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      res.json({
        message: 'Proveedor eliminado exitosamente',
        supplier: deletedSupplier
      });
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = supplierController;