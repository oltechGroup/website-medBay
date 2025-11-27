const Supplier = require('../models/supplierModel');

const supplierController = {
  create: async (req, res) => {
    try {
      console.log('📦 Creando proveedor - Datos recibidos:', req.body);
      
      const { name, country_code, contact_info, is_active = true } = req.body;

      // ✅ VALIDACIONES MEJORADAS
      if (!name || !name.trim()) {
        return res.status(400).json({ 
          success: false,
          error: 'El nombre del proveedor es requerido' 
        });
      }

      // ✅ PAÍS OBLIGATORIO
      if (!country_code) {
        return res.status(400).json({ 
          success: false,
          error: 'El código de país es requerido' 
        });
      }

      // Validar que country_code tenga 2 caracteres
      if (country_code.length !== 2) {
        return res.status(400).json({ 
          success: false,
          error: 'El código de país debe tener exactamente 2 caracteres. Ejemplos: MX, US, CA' 
        });
      }

      // ✅ MEJORADO: Verificar si ya existe un proveedor con el mismo nombre (case-insensitive)
      const existingSupplier = await Supplier.findByName(name);
      if (existingSupplier) {
        return res.status(409).json({
          success: false,
          error: `Ya existe un proveedor con el nombre "${name}". Por favor, usa un nombre diferente.`
        });
      }

      const newSupplier = await Supplier.create({
        name: name.trim(),
        country_code,
        contact_info,
        is_active
      });

      console.log('✅ Proveedor creado exitosamente:', newSupplier.id);
      
      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: newSupplier
      });
    } catch (error) {
      console.error('❌ Error al crear proveedor:', error);
      
      // ✅ MANEJO MEJORADO DE ERRORES
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'El país especificado no existe en el sistema' 
        });
      }
      
      if (error.code === '23505') {
        return res.status(400).json({ 
          success: false,
          error: 'Ya existe un proveedor con este nombre. Por favor, usa un nombre diferente.' 
        });
      }
      
      // Manejo de errores de validación del modelo
      if (error.message.includes('El código de país es requerido')) {
        return res.status(400).json({ 
          success: false,
          error: error.message 
        });
      }
      
      if (error.message.includes('Ya existe un proveedor con el nombre')) {
        return res.status(409).json({ 
          success: false,
          error: error.message 
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
      const { name, country_code, contact_info, is_active } = req.body;

      // ✅ VALIDACIONES MEJORADAS
      if (!name || !name.trim()) {
        return res.status(400).json({ 
          success: false,
          error: 'El nombre del proveedor es requerido' 
        });
      }

      // ✅ PAÍS OBLIGATORIO
      if (!country_code) {
        return res.status(400).json({ 
          success: false,
          error: 'El código de país es requerido' 
        });
      }

      // Validar que country_code tenga 2 caracteres
      if (country_code.length !== 2) {
        return res.status(400).json({ 
          success: false,
          error: 'El código de país debe tener exactamente 2 caracteres' 
        });
      }

      // ✅ MEJORADO: Verificar duplicados (excluyendo el propio proveedor)
      const existingSupplier = await Supplier.findByName(name);
      if (existingSupplier && existingSupplier.id !== id) {
        return res.status(409).json({
          success: false,
          error: `Ya existe otro proveedor con el nombre "${name}". Por favor, usa un nombre diferente.`
        });
      }

      const updatedSupplier = await Supplier.update(id, {
        name: name.trim(),
        country_code,
        contact_info,
        is_active
      });
      
      if (!updatedSupplier) {
        return res.status(404).json({ 
          success: false,
          error: 'Proveedor no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: updatedSupplier
      });
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      
      // ✅ MANEJO MEJORADO DE ERRORES
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false,
          error: 'El país especificado no existe en el sistema' 
        });
      }
      
      // Manejo de errores de validación del modelo
      if (error.message.includes('El código de país es requerido')) {
        return res.status(400).json({ 
          success: false,
          error: error.message 
        });
      }
      
      if (error.message.includes('Ya existe un proveedor con el nombre')) {
        return res.status(409).json({ 
          success: false,
          error: error.message 
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

      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente',
        data: deletedSupplier
      });
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      
      // Manejo de errores de foreign key
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
  },

  // Obtener estadísticas de proveedores
  getStats: async (req, res) => {
    try {
      const [count, statsByCountry] = await Promise.all([
        Supplier.count(),
        Supplier.getStatsByCountry()
      ]);

      res.json({
        success: true,
        data: {
          total: count.total,
          active: count.active,
          inactive: count.inactive,
          byCountry: statsByCountry
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de proveedores:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = supplierController;