// backend/src/controllers/inventoryController.js

const { pool } = require('../config/database');
const ProductLot = require('../models/productLotModel');

const inventoryController = {
  // ✅ DASHBOARD PRINCIPAL - MEJORADO con info de última importación
  getDashboard: async (req, res) => {
    try {
      const metrics = await ProductLot.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error en getDashboard:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ MÉTRICAS POR PROVEEDOR - AHORA PAGINADAS
  getSuppliersMetrics: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6; // Por defecto 6 tarjetas por página
      const search = req.query.search || '';

      const result = await ProductLot.findPaginatedSuppliers({
        page,
        limit,
        search
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error en getSuppliersMetrics:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ OBTENER LOTES - AHORA CON PAGINACIÓN REAL (LIMIT/OFFSET)
  getLots: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const filters = {
        page,
        limit,
        supplier_id: req.query.supplier_id,
        status: req.query.status,
        search: req.query.search
      };
      
      const result = await ProductLot.findPaginated(filters);
      res.json(result);
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

  // ✅ CREAR NUEVO LOTE
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
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El número de lote ya existe' });
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ ACTUALIZAR LOTE
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

  // ✅ CATÁLOGO POR PROVEEDOR Y ESTADO - AHORA PAGINADO
  getCatalogBySupplier: async (req, res) => {
    try {
      const { supplier_id, status } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const validStatuses = ['available', 'near_expiry', 'expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }

      const result = await ProductLot.findPaginated({
        page,
        limit,
        supplier_id,
        status
      });

      res.json(result);
    } catch (error) {
      console.error('❌ Error en getCatalogBySupplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ OBTENER PRODUCTOS Y PROVEEDORES PARA FORMULARIO (Evita crashes de memoria)
  getFormData: async (req, res) => {
    try {
      const search = req.query.search || '';
      
      // Si el frontend envía búsqueda, filtramos. Si no, solo mandamos los primeros 50 para evitar sobrecarga.
      const productsQuery = `
        SELECT id, description as name, global_sku 
        FROM products 
        ${search ? "WHERE description ILIKE $1 OR global_sku ILIKE $1" : ""}
        ORDER BY description
        LIMIT 50
      `;
      
      const suppliersQuery = `
        SELECT id, name, country_code 
        FROM suppliers 
        WHERE is_active = true 
        ORDER BY name
      `;
      
      const productsParams = search ? [`%${search}%`] : [];
      
      const [productsResult, suppliersResult] = await Promise.all([
        pool.query(productsQuery, productsParams),
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
      
      const existingQuery = `
        SELECT ps.*, p.description as product_name, s.name as supplier_name
        FROM product_suppliers ps
        LEFT JOIN products p ON ps.product_id = p.id
        LEFT JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.product_id = $1 AND ps.supplier_id = $2
      `;
      
      const existingResult = await pool.query(existingQuery, [product_id, supplier_id]);
      
      if (existingResult.rows.length > 0) {
        return res.json(existingResult.rows[0]);
      }

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
      
      res.json(createResult.rows[0]);
    } catch (error) {
      console.error('Error en findOrCreateProductSupplier:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = inventoryController;