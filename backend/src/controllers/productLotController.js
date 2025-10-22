const ProductLot = require('../models/productLotModel');

const productLotController = {
  // Crear lote de producto
  create: async (req, res) => {
    try {
      console.log('📦 Creando lote de producto - Datos recibidos:', req.body);
      
      const {
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        unit,
        price_amount,
        price_currency,
        discount_price_amount,
        discount_price_currency,
        sales_category,
        manual_discount,
        received_at,
        status,
        expiry_category_id
      } = req.body;

      if (!product_supplier_id || !lot_number || !expiry_date || !quantity || !unit || !price_amount || !price_currency) {
        console.log('❌ Error: Faltan campos requeridos');
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: product_supplier_id, lot_number, expiry_date, quantity, unit, price_amount, price_currency' 
        });
      }

      // Verificar si ya existe un lote con el mismo número
      const existingLot = await ProductLot.findByLotNumber(lot_number);
      if (existingLot) {
        console.log('❌ Error: Ya existe un lote con este número:', lot_number);
        return res.status(409).json({
          error: 'Ya existe un lote con este número'
        });
      }

      console.log('✅ Creando nuevo lote de producto...');
      const newLot = await ProductLot.create({
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        unit,
        price_amount,
        price_currency,
        discount_price_amount: discount_price_amount || 0,
        discount_price_currency: discount_price_currency || price_currency,
        sales_category: sales_category || 'regular',
        manual_discount: manual_discount || false,
        received_at: received_at || new Date(),
        status: status || 'available',
        expiry_category_id,
        created_by: req.user.id
      });

      console.log('✅ Lote de producto creado exitosamente:', newLot.id);
      res.status(201).json({
        message: 'Lote creado exitosamente',
        lot: newLot
      });
    } catch (error) {
      console.error('❌ Error al crear lote:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // Obtener todos los lotes
  getAll: async (req, res) => {
    try {
      console.log('📦 Obteniendo todos los lotes de productos');
      const lots = await ProductLot.findAll();
      console.log(`✅ Se encontraron ${lots.length} lotes de productos`);
      res.json(lots);
    } catch (error) {
      console.error('❌ Error al obtener lotes:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // Obtener lote por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('📦 Obteniendo lote por ID:', id);
      
      const lot = await ProductLot.findById(id);
      
      if (!lot) {
        console.log('❌ Lote no encontrado:', id);
        return res.status(404).json({ error: 'Lote no encontrado' });
      }
      
      console.log('✅ Lote encontrado:', lot.lot_number);
      res.json(lot);
    } catch (error) {
      console.error('❌ Error al obtener lote:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // Actualizar lote
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        unit,
        price_amount,
        price_currency,
        discount_price_amount,
        discount_price_currency,
        sales_category,
        manual_discount,
        received_at,
        status,
        expiry_category_id
      } = req.body;

      console.log('📦 Actualizando lote:', id, 'con datos:', req.body);

      const updatedLot = await ProductLot.update(id, {
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        unit,
        price_amount,
        price_currency,
        discount_price_amount,
        discount_price_currency,
        sales_category,
        manual_discount,
        received_at,
        status,
        expiry_category_id
      });
      
      if (!updatedLot) {
        console.log('❌ Lote no encontrado para actualizar:', id);
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      console.log('✅ Lote actualizado exitosamente:', updatedLot.lot_number);
      res.json({
        message: 'Lote actualizado exitosamente',
        lot: updatedLot
      });
    } catch (error) {
      console.error('❌ Error al actualizar lote:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  },

  // Eliminar lote
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('📦 Eliminando lote:', id);

      const deletedLot = await ProductLot.delete(id);
      
      if (!deletedLot) {
        console.log('❌ Lote no encontrado para eliminar:', id);
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      console.log('✅ Lote eliminado exitosamente:', deletedLot.lot_number);
      res.json({
        message: 'Lote eliminado exitosamente',
        lot: deletedLot
      });
    } catch (error) {
      console.error('❌ Error al eliminar lote:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: error.message 
      });
    }
  }
};

module.exports = productLotController;