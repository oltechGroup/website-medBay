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

  // ✅ NUEVO: OBTENER LOTES PAGINADOS (Para la página de "Ver Lotes")
  // Soporta búsqueda, filtros por proveedor y estado.
  findPaginated: async ({ page = 1, limit = 20, supplier_id = '', status = '', search = '' }) => {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (supplier_id) {
      whereConditions.push(`s.id = $${paramCount}`);
      params.push(supplier_id);
      paramCount++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`pl.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(p.description ILIKE $${paramCount} OR p.global_sku ILIKE $${paramCount} OR pl.lot_number ILIKE $${paramCount} OR s.name ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 1. Contar total para paginación
    const countQuery = `
      SELECT COUNT(*) 
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // 2. Obtener datos con LIMIT/OFFSET y Tie-breaker
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT 
        pl.*,
        p.description as product_name,
        p.global_sku as product_code,
        s.name as supplier_name,
        ps.supplier_sku,
        m.name as manufacturer_name
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      ${whereClause}
      ORDER BY pl.expiry_date ASC, pl.created_at DESC, pl.id ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await db.query(dataQuery, dataParams);

    return {
      lots: result.rows,
      pagination: {
        total: totalItems,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalItems / limit)
      }
    };
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

  // ✅ MÉTRICAS DASHBOARD MEJORADAS
  // Ahora identifica proveedor y tipo de la última importación
  getDashboardMetrics: async () => {
    const query = `
      WITH last_import_info AS (
        SELECT 
          s.name as supplier_name,
          pl.status as lot_status,
          pl.created_at as import_date
        FROM product_lots pl
        JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
        JOIN suppliers s ON ps.supplier_id = s.id
        ORDER BY pl.created_at DESC
        LIMIT 1
      )
      SELECT 
        COUNT(DISTINCT pl.id) as total_lots,
        COUNT(DISTINCT ps.product_id) as unique_products,
        COUNT(DISTINCT ps.supplier_id) as total_suppliers,
        COALESCE(SUM(pl.quantity * pl.price), 0) as total_value,
        COUNT(CASE WHEN pl.status = 'available' THEN 1 END) as available_lots,
        COUNT(CASE WHEN pl.status = 'near_expiry' THEN 1 END) as near_expiry_lots,
        COUNT(CASE WHEN pl.status = 'expired' THEN 1 END) as expired_lots,
        COALESCE(SUM(pl.quantity), 0) as total_units,
        (SELECT supplier_name FROM last_import_info) as last_import_supplier,
        (SELECT lot_status FROM last_import_info) as last_import_type,
        (SELECT import_date FROM last_import_info) as last_import
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  },

  // ✅ MÉTRICAS PROVEEDORES PAGINADAS
  // Para la página principal de tarjetas de proveedores
  findPaginatedSuppliers: async ({ page = 1, limit = 6, search = '' }) => {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE s.is_active = true';
    let params = [];
    
    if (search) {
      whereClause += ` AND s.name ILIKE $1`;
      params.push(`%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM suppliers s ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    const dataParams = [...params, limit, offset];
    const paramIdx = params.length;

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
      ${whereClause}
      GROUP BY s.id, s.name
      ORDER BY s.name ASC, s.id ASC
      LIMIT $${paramIdx + 1} OFFSET $${paramIdx + 2}
    `;
    
    const result = await db.query(query, dataParams);

    return {
      suppliers: result.rows,
      pagination: {
        total: totalItems,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  },

  // Mantengo findAll para compatibilidad interna de reportes rápidos
  findAll: async (filters = {}) => {
    // ... (Se mantiene lógica simplificada o se puede redirigir a findPaginated con limit alto)
    const result = await ProductLot.findPaginated({ ...filters, limit: 1000, page: 1 });
    return result.lots;
  }
};

module.exports = ProductLot;