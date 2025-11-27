//backend/src/controllers/inventoryController.js

const { pool } = require('../config/database'); // ✅ AGREGAR importación de pool
const ProductLot = require('../models/productLotModel');

const inventoryController = {
  // ✅ DASHBOARD PRINCIPAL
  getDashboard: async (req, res) => {
    try {
      const metrics = await ProductLot.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error en getDashboard:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ MÉTRICAS POR PROVEEDOR
  getSuppliersMetrics: async (req, res) => {
    try {
      const metrics = await ProductLot.getSuppliersMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error en getSuppliersMetrics:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ OBTENER TODOS LOS LOTES (CON FILTROS)
  getLots: async (req, res) => {
    try {
      const filters = {
        supplier_id: req.query.supplier_id,
        status: req.query.status,
        search: req.query.search
      };
      
      const lots = await ProductLot.findAll(filters);
      res.json(lots);
    } catch (error) {
      console.error('Error en getLots:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ OBTENER LOTE POR ID
  getLotById: async (req, res) => {
    try {
      const { id } = req.params;
      const lot = await ProductLot.findById(id);
      
      if (!lot) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }
      
      res.json(lot);
    } catch (error) {
      console.error('Error en getLotById:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ CREAR NUEVO LOTE - SIN unit
  createLot: async (req, res) => {
    try {
      const {
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        price,
        status,
        received_at
      } = req.body;

      // Validaciones básicas (sin unit)
      if (!product_supplier_id || !lot_number || !expiry_date || !quantity || !price || !status) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: product_supplier_id, lot_number, expiry_date, quantity, price, status' 
        });
      }

      const newLot = await ProductLot.create({
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        price,
        status,
        received_at
      });

      res.status(201).json({
        message: 'Lote creado exitosamente',
        lot: newLot
      });
    } catch (error) {
      console.error('Error en createLot:', error);
      
      if (error.code === '23505') { // Violación de unique constraint
        return res.status(400).json({ error: 'El número de lote ya existe' });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ ACTUALIZAR LOTE - SIN unit
  updateLot: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        price,
        status,
        received_at
      } = req.body;

      const updatedLot = await ProductLot.update(id, {
        product_supplier_id,
        lot_number,
        expiry_date,
        quantity,
        price,
        status,
        received_at
      });

      if (!updatedLot) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      res.json({
        message: 'Lote actualizado exitosamente',
        lot: updatedLot
      });
    } catch (error) {
      console.error('Error en updateLot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ ELIMINAR LOTE
  deleteLot: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedLot = await ProductLot.delete(id);

      if (!deletedLot) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      res.json({
        message: 'Lote eliminado exitosamente',
        lot: deletedLot
      });
    } catch (error) {
      console.error('Error en deleteLot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ CATÁLOGO POR PROVEEDOR Y ESTADO
  getCatalogBySupplier: async (req, res) => {
    try {
      const { supplier_id, status } = req.params;
      
      console.log(`📦 Buscando catálogo: proveedor ${supplier_id}, estado ${status}`);

      // Validar que el estado sea válido
      const validStatuses = ['available', 'near_expiry', 'expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }

      // Usar el modelo con filtros
      const lots = await ProductLot.findAll({
        supplier_id: supplier_id,
        status: status
      });

      console.log(`✅ Catálogo obtenido: ${lots.length} lotes`);
      
      res.json(lots);
    } catch (error) {
      console.error('❌ Error en getCatalogBySupplier:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // ✅ OBTENER PRODUCTOS Y PROVEEDORES PARA FORMULARIO
  getFormData: async (req, res) => {
    try {
      // Obtener productos activos
      const productsQuery = `
        SELECT id, description as name, global_sku 
        FROM products 
        ORDER BY description
      `;
      
      // Obtener proveedores activos
      const suppliersQuery = `
        SELECT id, name, country_code 
        FROM suppliers 
        WHERE is_active = true 
        ORDER BY name
      `;
      
      const [productsResult, suppliersResult] = await Promise.all([
        pool.query(productsQuery),
        pool.query(suppliersQuery)
      ]);

      res.json({
        products: productsResult.rows,
        suppliers: suppliersResult.rows
      });
    } catch (error) {
      console.error('Error en getFormData:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ CREAR O OBTENER RELACIÓN PRODUCTO-PROVEEDOR
  findOrCreateProductSupplier: async (req, res) => {
    try {
      const { product_id, supplier_id } = req.body;
      
      console.log('🔍 Buscando relación producto-proveedor:', { product_id, supplier_id });

      // Verificar si ya existe la relación
      const existingQuery = `
        SELECT ps.*, p.description as product_name, s.name as supplier_name
        FROM product_suppliers ps
        LEFT JOIN products p ON ps.product_id = p.id
        LEFT JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.product_id = $1 AND ps.supplier_id = $2
      `;
      
      const existingResult = await pool.query(existingQuery, [product_id, supplier_id]);
      
      if (existingResult.rows.length > 0) {
        console.log('✅ Relación existente encontrada:', existingResult.rows[0].id);
        return res.json(existingResult.rows[0]);
      }

      // Crear nueva relación
      const productResult = await pool.query('SELECT description FROM products WHERE id = $1', [product_id]);
      const supplierResult = await pool.query('SELECT name FROM suppliers WHERE id = $1', [supplier_id]);
      
      const productName = productResult.rows[0]?.description || 'Producto';
      const supplierName = supplierResult.rows[0]?.name || 'Proveedor';
      
      const createQuery = `
        INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name)
        VALUES ($1, $2, $3, $4)
        RETURNING *, $5 as product_name, $6 as supplier_name
      `;
      
      const createResult = await pool.query(createQuery, [
        product_id, 
        supplier_id, 
        `AUTO-${Date.now()}`, 
        supplierName,
        productName,
        supplierName
      ]);

      console.log('✅ Nueva relación creada:', createResult.rows[0].id);
      
      res.json(createResult.rows[0]);
    } catch (error) {
      console.error('Error en findOrCreateProductSupplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = inventoryController;