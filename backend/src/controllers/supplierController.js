const Supplier = require('../models/supplierModel');

const supplierController = {
  // Crear proveedor con validación de duplicados
  create: async (req, res) => {
    try {
      const { name, tax_id, country, default_currency, contact_info } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
      }

      // Verificar duplicados por tax_id
      if (tax_id) {
        const existingByTaxId = await Supplier.findByTaxId(tax_id);
        if (existingByTaxId) {
          return res.status(409).json({ 
            error: 'Ya existe un proveedor con este tax_id',
            supplier: existingByTaxId 
          });
        }
      }

      // Verificar duplicados por nombre
      const existingByName = await Supplier.findByName(name);
      if (existingByName) {
        return res.status(409).json({ 
          error: 'Ya existe un proveedor con este nombre',
          supplier: existingByName 
        });
      }

      const newSupplier = await Supplier.create({
        name,
        tax_id,
        country,
        default_currency,
        contact_info
      });

      res.status(201).json({
        message: 'Proveedor creado exitosamente',
        supplier: newSupplier
      });

    } catch (error) {
      console.error('Error al crear proveedor:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los proveedores
  getAll: async (req, res) => {
    try {
      const suppliers = await Supplier.findAll();
      res.json(suppliers);
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener proveedor por ID
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

  // Actualizar proveedor
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const supplierData = req.body;

      const updatedSupplier = await Supplier.update(id, supplierData);
      
      if (!updatedSupplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      res.json({
        message: 'Proveedor actualizado exitosamente',
        supplier: updatedSupplier
      });

    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar proveedor
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