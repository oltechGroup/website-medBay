const Supplier = require('../models/supplierModel');

const supplierController = {
  create: async (req, res) => {
    try {
      console.log('📦 Creando proveedor - Datos recibidos:', req.body);
      
      const { name, tax_id, country_id, currency_id, contact_info } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
      }

      // ✅ NUEVO: Validar que country_id y currency_id existan si se proporcionan
      if (country_id && country_id.length !== 2) {
        return res.status(400).json({ 
          error: 'El código de país debe tener exactamente 2 caracteres. Ejemplos: MX, US, CA' 
        });
      }

      if (currency_id && currency_id.length !== 3) {
        return res.status(400).json({ 
          error: 'El código de moneda debe tener exactamente 3 caracteres. Ejemplos: MXN, USD, EUR' 
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
        country_id, // ✅ NUEVO: Usar country_id en lugar de country
        currency_id, // ✅ NUEVO: Usar currency_id en lugar de default_currency
        contact_info
      });

      console.log('✅ Proveedor creado exitosamente:', newSupplier.id);
      
      // ✅ NUEVO: Respuesta unificada con estructura consistente
      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: newSupplier
      });
    } catch (error) {
      console.error('❌ Error al crear proveedor:', error);
      
      // ✅ MEJORADO: Manejo específico de errores de foreign key
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'El país o la moneda especificada no existe en el sistema' 
        });
      }
      
      if (error.code === '23505') {
        return res.status(400).json({ 
          success: false,
          error: 'Ya existe un proveedor con este nombre o tax_id' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const suppliers = await Supplier.findAll();
      
      // ✅ NUEVO: Respuesta unificada
      res.json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await Supplier.findById(id);
      
      if (!supplier) {
        return res.status(404).json({ 
          success: false,
          error: 'Proveedor no encontrado' 
        });
      }
      
      // ✅ NUEVO: Respuesta unificada
      res.json({
        success: true,
        data: supplier
      });
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, tax_id, country_id, currency_id, contact_info } = req.body;

      // ✅ NUEVO: Validaciones actualizadas
      if (country_id && country_id.length !== 2) {
        return res.status(400).json({ 
          success: false,
          error: 'El código de país debe tener exactamente 2 caracteres' 
        });
      }

      if (currency_id && currency_id.length !== 3) {
        return res.status(400).json({ 
          success: false,
          error: 'El código de moneda debe tener exactamente 3 caracteres' 
        });
      }

      const updatedSupplier = await Supplier.update(id, {
        name,
        tax_id,
        country_id,
        currency_id,
        contact_info
      });
      
      if (!updatedSupplier) {
        return res.status(404).json({ 
          success: false,
          error: 'Proveedor no encontrado' 
        });
      }

      // ✅ NUEVO: Respuesta unificada
      res.json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: updatedSupplier
      });
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      
      // ✅ MEJORADO: Manejo específico de errores
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'El país o la moneda especificada no existe en el sistema' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedSupplier = await Supplier.delete(id);
      
      if (!deletedSupplier) {
        return res.status(404).json({ 
          success: false,
          error: 'Proveedor no encontrado' 
        });
      }

      // ✅ NUEVO: Respuesta unificada
      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente',
        data: deletedSupplier
      });
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      
      // ✅ NUEVO: Manejo de errores de foreign key
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'No se puede eliminar el proveedor porque está siendo utilizado en otros registros' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = supplierController;