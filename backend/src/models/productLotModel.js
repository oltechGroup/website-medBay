// backend/src/models/productLotModel.js

const db = require('../config/database');

const ProductLot = {
  // ✅ CREAR LOTE
  create: async (lotData) => {
    const {
      product_supplier_id,
      lot_number,
      expiry_date,
      quantity,
      price,
      status,
      received_at
    } = lotData;

    const query = `
      INSERT INTO product_lots (
        product_supplier_id, lot_number, expiry_date, quantity, 
        price, status, received_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      product_supplier_id, lot_number, expiry_date, quantity,
      price, status, received_at || new Date()
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // ✅ OBTENER TODOS LOS LOTES (FILTROS)
  findAll: async (filters = {}) => {
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (filters.supplier_id) {
      paramCount++;
      whereConditions.push(`s.id = $${paramCount}`);
      queryParams.push(filters.supplier_id);
    }

    if (filters.status) {
      paramCount++;
      whereConditions.push(`pl.status = $${paramCount}`);
      queryParams.push(filters.status);
    }

    if (filters.search) {
      paramCount++;
      whereConditions.push(`(p.description ILIKE $${paramCount} OR p.global_sku ILIKE $${paramCount} OR s.name ILIKE $${paramCount})`);
      queryParams.push(`%${filters.search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT 
        pl.*,
        p.description as product_name,
        p.global_sku as product_code,
        p.description as product_description,
        s.name as supplier_name,
        ps.supplier_sku,
        ps.supplier_name as product_supplier_name
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      ${whereClause}
      ORDER BY pl.expiry_date ASC, pl.created_at DESC
    `;
    
    try {
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error('❌ Error en la consulta findAll:', error);
      throw error;
    }
  },

  // ✅ OBTENER POR ID DE LOTE
  findById: async (id) => {
    const query = `
      SELECT 
        pl.*,
        p.description as product_name,
        p.global_sku as product_code,
        s.name as supplier_name,
        ps.supplier_sku,
        ps.product_id,
        ps.supplier_id
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      WHERE pl.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // ✅ [ACTUALIZADO] OBTENER LOTES POR PRODUCTO + FILTRO STATUS
  // Ahora acepta statusFilter (ej: 'expired') para cumplir tu requerimiento
  findByProductId: async (productId, statusFilter = 'all') => {
    let statusCondition = "AND pl.status IN ('available', 'near_expiry', 'expired')";
    let params = [productId];

    // Si nos piden un estado específico (ej: página de caducados), filtramos estrictamente
    if (statusFilter && statusFilter !== 'all') {
      statusCondition = "AND pl.status = $2";
      params.push(statusFilter);
    }

    const query = `
      SELECT 
        pl.*,
        s.name as supplier_name,
        ps.supplier_sku
      FROM product_lots pl
      INNER JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      WHERE ps.product_id = $1
      ${statusCondition}
      AND pl.quantity > 0
      ORDER BY pl.expiry_date ASC
    `;
    
    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Error buscando lotes por producto:', error);
      throw error;
    }
  },

  // ✅ ACTUALIZAR LOTE
  update: async (id, lotData) => {
    const {
      product_supplier_id,
      lot_number,
      expiry_date,
      quantity,
      price,
      status,
      received_at
    } = lotData;

    const query = `
      UPDATE product_lots 
      SET 
        product_supplier_id = $1, 
        lot_number = $2, 
        expiry_date = $3, 
        quantity = $4, 
        price = $5, 
        status = $6, 
        received_at = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [
      product_supplier_id, lot_number, expiry_date, quantity,
      price, status, received_at, id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // ✅ ELIMINAR LOTE
  delete: async (id) => {
    const query = 'DELETE FROM product_lots WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // ✅ MÉTRICAS DASHBOARD
  getDashboardMetrics: async () => {
    const query = `
      SELECT 
        COUNT(DISTINCT pl.id) as total_lots,
        COUNT(DISTINCT ps.product_id) as unique_products,
        COUNT(DISTINCT ps.supplier_id) as total_suppliers,
        COALESCE(SUM(pl.quantity * pl.price), 0) as total_value,
        COUNT(CASE WHEN pl.status = 'available' THEN 1 END) as available_lots,
        COUNT(CASE WHEN pl.status = 'near_expiry' THEN 1 END) as near_expiry_lots,
        COUNT(CASE WHEN pl.status = 'expired' THEN 1 END) as expired_lots,
        COALESCE(SUM(pl.quantity), 0) as total_units,
        MAX(pl.created_at) as last_import
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  },

  // ✅ MÉTRICAS PROVEEDORES
  getSuppliersMetrics: async () => {
    const query = `
      SELECT 
        s.id,
        s.name as supplier_name,
        COUNT(DISTINCT ps.product_id) as unique_products,
        COUNT(DISTINCT pl.id) as active_lots,
        COALESCE(SUM(pl.quantity), 0) as total_units,
        COALESCE(SUM(pl.quantity * pl.price), 0) as total_value,
        COUNT(CASE WHEN pl.status = 'available' THEN 1 END) as available_lots,
        COUNT(CASE WHEN pl.status = 'near_expiry' THEN 1 END) as near_expiry_lots,
        COUNT(CASE WHEN pl.status = 'expired' THEN 1 END) as expired_lots,
        COUNT(DISTINCT pl.id) as total_lots,
        MAX(pl.created_at) as last_import
      FROM suppliers s
      LEFT JOIN product_suppliers ps ON s.id = ps.supplier_id
      LEFT JOIN product_lots pl ON ps.id = pl.product_supplier_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name
      ORDER BY s.name
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
};

module.exports = ProductLot;