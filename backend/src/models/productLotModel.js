// backend/src/models/productLotModel.js

const db = require('../config/database');

const ProductLot = {
  // ✅ CREAR LOTE (Actualizado con unit_of_measure)
  create: async (lotData) => {
    const {
      product_supplier_id,
      lot_number,
      expiry_date,
      quantity,
      price,
      status,
      received_at,
      unit_of_measure // 🚀 Nuevo campo
    } = lotData;

    const query = `
      INSERT INTO product_lots (
        product_supplier_id, lot_number, expiry_date, quantity, 
        price, status, received_at, unit_of_measure
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      product_supplier_id, lot_number, expiry_date, quantity,
      price, status, received_at || new Date(), unit_of_measure || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // ✅ OBTENER LOTES PAGINADOS (Actualizado con unit_of_measure)
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

  // ✅ OBTENER POR ID DE LOTE (Actualizado con unit_of_measure)
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

  // ✅ OBTENER LOTES POR ID DE PRODUCTO (Actualizado con unit_of_measure)
  findByProductId: async (productId, statusFilter = 'all') => {
    let query = `
      SELECT 
        pl.*,
        s.name as supplier_name,
        p.description as product_name,
        p.global_sku as product_code
      FROM product_lots pl
      JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      JOIN suppliers s ON ps.supplier_id = s.id
      JOIN products p ON ps.product_id = p.id
      WHERE ps.product_id = $1 AND pl.quantity >= 0
    `;
    
    const params = [productId];
    
    if (statusFilter && statusFilter !== 'all') {
      query += ` AND pl.status = $2`;
      params.push(statusFilter);
    } else {
      query += ` AND pl.status IN ('available', 'near_expiry', 'expired', 'equipment')`;
    }
    
    query += ` ORDER BY pl.expiry_date ASC NULLS LAST, pl.price ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  // ✅ ACTUALIZAR LOTE (Actualizado con unit_of_measure)
  update: async (id, lotData) => {
    const {
      product_supplier_id,
      lot_number,
      expiry_date,
      quantity,
      price,
      status,
      received_at,
      unit_of_measure // 🚀 Nuevo campo
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
        unit_of_measure = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;
    
    const values = [
      product_supplier_id, lot_number, expiry_date, quantity,
      price, status, received_at, unit_of_measure || null, id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // ✅ ELIMINAR LOTE (Sin cambios necesarios)
  delete: async (id) => {
    const query = 'DELETE FROM product_lots WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // ✅ MÉTRICAS DASHBOARD (Sin cambios, unit_of_measure no afecta totales)
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
        COUNT(CASE WHEN pl.status = 'equipment' THEN 1 END) as equipment_lots,
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

  // ✅ MÉTRICAS PROVEEDORES PAGINADAS (Sin cambios)
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
        COUNT(CASE WHEN pl.status = 'equipment' THEN 1 END) as equipment_lots,
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

  findAll: async (filters = {}) => {
    const result = await ProductLot.findPaginated({ ...filters, limit: 1000, page: 1 });
    return result.lots;
  },

  // ==========================================
  // 🧠 FASE 2: MOTOR INTELIGENTE DE INVENTARIO
  // ==========================================

  // ✅ 1. RESERVAR STOCK (Sin cambios, descuenta unidades independientemente de la UOM)
  reserveLotQuantity: async (lotId, quantityToReserve) => {
    const query = `
      UPDATE product_lots 
      SET 
        quantity = quantity - $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND quantity >= $1
      RETURNING *
    `;
    const result = await db.query(query, [quantityToReserve, lotId]);
    
    if (result.rows.length === 0) {
      throw new Error('Stock insuficiente o lote no encontrado para reservar.');
    }
    return result.rows[0];
  },

  // ✅ 2. LIBERAR STOCK (Sin cambios)
  releaseLotQuantity: async (lotId, quantityToRelease) => {
    const query = `
      UPDATE product_lots 
      SET 
        quantity = quantity + $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [quantityToRelease, lotId]);
    return result.rows[0];
  },

  // ✅ 3. CREAR LOTE PUENTE (Actualizado con unit_of_measure)
  createSourcedLot: async (productId, quantity, price, expiryDate, status, unit_of_measure) => {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      let psRes = await client.query('SELECT id FROM product_suppliers WHERE product_id = $1 LIMIT 1', [productId]);
      let productSupplierId;

      if (psRes.rows.length > 0) {
        productSupplierId = psRes.rows[0].id;
      } else {
        const supplierRes = await client.query('SELECT id, name FROM suppliers WHERE is_active = true LIMIT 1');
        if (supplierRes.rows.length === 0) throw new Error("No se encontró ningún proveedor activo para asignar este nuevo lote.");
        
        const newPs = await client.query(
          `INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name) 
            VALUES ($1, $2, $3, $4) RETURNING id`,
          [productId, supplierRes.rows[0].id, `COTIZACION-${Date.now()}`, supplierRes.rows[0].name]
        );
        productSupplierId = newPs.rows[0].id;
      }

      const lotQuery = `
        INSERT INTO product_lots (product_supplier_id, lot_number, quantity, price, status, expiry_date, unit_of_measure, received_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      const lotNumber = `QT-${Date.now().toString().slice(-6)}`;
      const finalStatus = status === 'short_date' ? 'near_expiry' : status === 'in_date' ? 'available' : status;
      
      const lotResult = await client.query(lotQuery, [
        productSupplierId, lotNumber, quantity, price, finalStatus, expiryDate || null, unit_of_measure || null
      ]);

      await client.query('COMMIT');
      return lotResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

};

module.exports = ProductLot;