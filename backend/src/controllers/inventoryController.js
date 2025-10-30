// src/controllers/inventoryController.js - VERSIÓN COMPLETA CORREGIDA CON DROPSHIPPING
const pool = require('../config/database');

const inventoryController = {
  // =============================================
  // ENDPOINT PRINCIPAL - INCLUYE PRODUCTOS SIN LOTES
  // =============================================

  getInventoryLots: async (req, res) => {
    try {
      console.log('📦 Obteniendo lotes de inventario...');
      
      const query = `
        -- PRODUCTOS CON LOTES (inventario existente)
        SELECT 
          pl.id,
          pl.lot_number,
          pl.expiry_date,
          pl.status,
          pl.sales_category,
          pl.discount_price_amount,
          pl.manual_discount,
          pl.expiry_category_id,
          pl.quantity as lot_quantity,
          ps.product_id,
          p.name as product_name,
          p.global_sku as product_code,
          p.description as product_description,
          NULL as product_price,
          COALESCE(i.quantity_on_hand, pl.quantity, 0) as quantity_on_hand,
          ec.name as expiry_category_name,
          ec.discount_percentage,
          m.name as manufacturer_name,
          s.name as supplier_name,
          'has_lot' as record_type
        FROM product_lots pl
        LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
        LEFT JOIN products p ON ps.product_id = p.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        LEFT JOIN suppliers s ON ps.supplier_id = s.id
        LEFT JOIN inventory i ON pl.id = i.product_lot_id
        LEFT JOIN expiry_categories ec ON pl.expiry_category_id = ec.id

        UNION ALL

        -- PRODUCTOS SIN LOTES (solo en catálogo)
        SELECT 
          NULL as id,
          NULL as lot_number,
          NULL as expiry_date,
          'available' as status,
          'regular' as sales_category,
          NULL as discount_price_amount,
          false as manual_discount,
          NULL as expiry_category_id,
          0 as lot_quantity,
          p.id as product_id,
          p.name as product_name,
          p.global_sku as product_code,
          p.description as product_description,
          NULL as product_price,
          0 as quantity_on_hand,
          NULL as expiry_category_name,
          NULL as discount_percentage,
          m.name as manufacturer_name,
          NULL as supplier_name,
          'no_lot' as record_type
        FROM products p
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        WHERE p.id NOT IN (
          SELECT DISTINCT ps.product_id 
          FROM product_suppliers ps 
          JOIN product_lots pl ON ps.id = pl.product_supplier_id
          WHERE ps.product_id IS NOT NULL
        )
        
        ORDER BY 
          record_type DESC,
          expiry_date ASC NULLS LAST, 
          product_name ASC
      `;
      
      const result = await pool.query(query);
      
      const withLots = result.rows.filter(row => row.record_type === 'has_lot').length;
      const withoutLots = result.rows.filter(row => row.record_type === 'no_lot').length;
      
      console.log(`✅ Se encontraron ${result.rows.length} registros (${withLots} con lotes, ${withoutLots} sin lotes)`);
      
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error al obtener lotes de inventario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // =============================================
  // NUEVO ENDPOINT: CREAR LOTE PARA PRODUCTO SIN LOTE - VERSIÓN CORREGIDA
  // =============================================

  createLotForProduct: async (req, res) => {
    try {
      const { product_id, lot_number, expiry_date, quantity, supplier_id } = req.body;
      console.log('🆕 Creando lote para producto:', { product_id, lot_number, expiry_date, quantity, supplier_id });

      // Validaciones básicas
      if (!product_id) {
        return res.status(400).json({ error: 'product_id es requerido' });
      }

      if (!lot_number) {
        return res.status(400).json({ error: 'lot_number es requerido' });
      }

      // Verificar que el producto existe
      const productCheck = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
      if (productCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Buscar o crear relación con proveedor
      let productSupplierId;
      
      if (supplier_id) {
        // Verificar si ya existe la relación producto-proveedor
        const existingRelation = await pool.query(
          'SELECT id FROM product_suppliers WHERE product_id = $1 AND supplier_id = $2',
          [product_id, supplier_id]
        );

        if (existingRelation.rows.length > 0) {
          productSupplierId = existingRelation.rows[0].id;
        } else {
          // Obtener nombre del proveedor
          const supplierResult = await pool.query('SELECT name FROM suppliers WHERE id = $1', [supplier_id]);
          const supplierName = supplierResult.rows.length > 0 ? supplierResult.rows[0].name : 'Proveedor Desconocido';
          
          // Crear nueva relación producto-proveedor
          const newRelation = await pool.query(
            `INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name, units_per_box)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [product_id, supplier_id, lot_number, supplierName, 1]
          );
          productSupplierId = newRelation.rows[0].id;
        }
      } else {
        // Si no se especifica proveedor, buscar uno existente o crear uno por defecto
        const existingRelation = await pool.query(
          'SELECT id FROM product_suppliers WHERE product_id = $1 LIMIT 1',
          [product_id]
        );

        if (existingRelation.rows.length > 0) {
          productSupplierId = existingRelation.rows[0].id;
        } else {
          // Buscar proveedor por defecto existente
          const defaultSupplierCheck = await pool.query(
            `SELECT id FROM suppliers WHERE name = 'Proveedor por Defecto' LIMIT 1`
          );

          let supplierId;
          if (defaultSupplierCheck.rows.length > 0) {
            supplierId = defaultSupplierCheck.rows[0].id;
          } else {
            // Crear proveedor por defecto
            const defaultSupplier = await pool.query(
              `INSERT INTO suppliers (name, country, default_currency) 
               VALUES ($1, $2, $3) 
               RETURNING id`,
              ['Proveedor por Defecto', 'MX', 'MXN']
            );
            supplierId = defaultSupplier.rows[0].id;
          }

          // Crear relación con proveedor por defecto
          const newRelation = await pool.query(
            `INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name, units_per_box)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [product_id, supplierId, lot_number, 'Proveedor por Defecto', 1]
          );
          productSupplierId = newRelation.rows[0].id;
        }
      }

      // Crear el lote - Manejo seguro de created_by
      const lotQuery = `
        INSERT INTO product_lots (
          product_supplier_id, 
          lot_number, 
          expiry_date, 
          quantity, 
          status
          ${req.user ? ', created_by' : ''}
        ) VALUES ($1, $2, $3, $4, $5 ${req.user ? ', $6' : ''})
        RETURNING *
      `;

      const queryParams = [
        productSupplierId,
        lot_number,
        expiry_date || null,
        quantity || 0,
        'available'
      ];

      // Solo agregar created_by si req.user existe
      if (req.user) {
        queryParams.push(req.user.id || 1);
      }

      const lotResult = await pool.query(lotQuery, queryParams);
      const newLot = lotResult.rows[0];

      // Crear registro en inventory
      await pool.query(
        'INSERT INTO inventory (product_lot_id, quantity_on_hand, last_updated) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [newLot.id, quantity || 0]
      );

      console.log(`✅ Lote creado exitosamente para producto ${product_id}, ID: ${newLot.id}`);
      
      res.json({
        success: true,
        message: 'Lote creado exitosamente',
        lot: newLot
      });

    } catch (error) {
      console.error('❌ Error al crear lote para producto:', error);
      
      // Manejar error de lote duplicado
      if (error.code === '23505') {
        return res.status(400).json({ 
          error: 'El número de lote ya existe para este producto' 
        });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // =============================================
  // ENDPOINTS EXISTENTES (MANTENIDOS)
  // =============================================

  adjustInventory: async (req, res) => {
    try {
      const { lot_id, adjustment, reason, adjusted_by } = req.body;
      console.log(`🔄 Ajustando inventario para lote ${lot_id}: ${adjustment}`);

      const lotCheck = await pool.query('SELECT * FROM product_lots WHERE id = $1', [lot_id]);
      if (lotCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      const currentQuantity = lotCheck.rows[0].quantity || 0;
      const newQuantity = currentQuantity + adjustment;
      
      if (newQuantity < 0) {
        return res.status(400).json({ error: 'La cantidad resultante no puede ser negativa' });
      }

      const updateLotQuery = `
        UPDATE product_lots 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING *
      `;
      await pool.query(updateLotQuery, [newQuantity, lot_id]);

      const inventoryCheck = await pool.query(
        'SELECT * FROM inventory WHERE product_lot_id = $1', 
        [lot_id]
      );

      if (inventoryCheck.rows.length > 0) {
        await pool.query(
          'UPDATE inventory SET quantity_on_hand = $1, last_updated = CURRENT_TIMESTAMP WHERE product_lot_id = $2',
          [newQuantity, lot_id]
        );
      } else {
        await pool.query(
          'INSERT INTO inventory (product_lot_id, quantity_on_hand, last_updated) VALUES ($1, $2, CURRENT_TIMESTAMP)',
          [lot_id, newQuantity]
        );
      }

      console.log(`✅ Inventario ajustado: ${currentQuantity} → ${newQuantity}`);
      
      res.json({ 
        success: true, 
        message: 'Inventario ajustado exitosamente',
        previous_quantity: currentQuantity,
        new_quantity: newQuantity,
        adjustment: adjustment
      });
    } catch (error) {
      console.error('❌ Error al ajustar inventario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateLotStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['available', 'reserved', 'expired', 'near_expiry', 'quarantine'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      const query = `
        UPDATE product_lots 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      console.log(`✅ Estado del lote ${id} actualizado a: ${status}`);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error al actualizar estado del lote:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateExpiryCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { expiry_category_id } = req.body;

      const query = `
        UPDATE product_lots 
        SET expiry_category_id = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [expiry_category_id, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      console.log(`✅ Categoría de expiración actualizada para lote ${id}`);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error al actualizar categoría de expiración:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getExpiryCategories: async (req, res) => {
    try {
      const query = 'SELECT * FROM expiry_categories WHERE is_active = true ORDER BY sort_order, name';
      const result = await pool.query(query);
      
      console.log(`✅ Se encontraron ${result.rows.length} categorías de expiración`);
      
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error al obtener categorías de expiración:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // =============================================
  // MÉTODOS EXISTENTES (COMPATIBILIDAD)
  // =============================================

  createLot: async (req, res) => {
    try {
      const lotData = {
        ...req.body,
        created_by: req.user ? req.user.id : 1
      };

      if (!lotData.product_supplier_id) {
        return res.status(400).json({ error: 'product_supplier_id es requerido' });
      }

      if (!lotData.quantity || lotData.quantity < 0) {
        return res.status(400).json({ error: 'Cantidad válida es requerida' });
      }

      const query = `
        INSERT INTO product_lots (product_supplier_id, lot_number, expiry_date, quantity, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        lotData.product_supplier_id,
        lotData.lot_number,
        lotData.expiry_date,
        lotData.quantity,
        lotData.status || 'available',
        lotData.created_by
      ]);

      res.status(201).json({
        message: 'Lote creado exitosamente',
        lot: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error al crear lote:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getAllLots: async (req, res) => {
    try {
      const query = 'SELECT * FROM product_lots ORDER BY created_at DESC';
      const result = await pool.query(query);
      
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error al obtener lotes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getLotsByProduct: async (req, res) => {
    try {
      const { productId } = req.params;
      
      const query = `
        SELECT pl.* 
        FROM product_lots pl
        JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
        WHERE ps.product_id = $1
        ORDER BY pl.expiry_date ASC
      `;
      
      const result = await pool.query(query, [productId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error al obtener lotes por producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getNearExpiryLots: async (req, res) => {
    try {
      const { days } = req.query;
      const thresholdDays = days || 90;
      
      const query = `
        SELECT pl.*, p.name as product_name
        FROM product_lots pl
        JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
        JOIN products p ON ps.product_id = p.id
        WHERE pl.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1 * INTERVAL '1 day'
        AND pl.status != 'expired'
        ORDER BY pl.expiry_date ASC
      `;
      
      const result = await pool.query(query, [thresholdDays]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error al obtener lotes próximos a expirar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateLotQuantity: async (req, res) => {
    try {
      const { lotId } = req.params;
      const { quantity } = req.body;

      if (quantity < 0) {
        return res.status(400).json({ error: 'La cantidad no puede ser negativa' });
      }

      const query = `
        UPDATE product_lots 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [quantity, lotId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      res.json({
        message: 'Cantidad actualizada exitosamente',
        lot: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error al actualizar cantidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  reserveLotQuantity: async (req, res) => {
    try {
      const { lotId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad a reservar debe ser mayor a 0' });
      }

      const checkQuery = 'SELECT quantity FROM product_lots WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [lotId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      const availableQuantity = checkResult.rows[0].quantity;
      if (availableQuantity < quantity) {
        return res.status(400).json({ error: 'No hay suficiente stock disponible' });
      }

      const updateQuery = `
        UPDATE product_lots 
        SET status = 'reserved', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [lotId]);

      res.json({
        message: 'Cantidad reservada exitosamente',
        lot: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error al reservar cantidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  releaseLotQuantity: async (req, res) => {
    try {
      const { lotId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad a liberar debe ser mayor a 0' });
      }

      const query = `
        UPDATE product_lots 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [lotId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lote no encontrado' });
      }

      res.json({
        message: 'Cantidad liberada exitosamente',
        lot: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error al liberar cantidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // =============================================
  // NUEVOS ENDPOINTS PARA DROPSHIPPING
  // =============================================

  // Obtener resumen de proveedores con catálogos
  getSuppliersCatalogSummary: async (req, res) => {
    try {
      console.log('📊 Obteniendo resumen de catálogos por proveedor...');
      
      const query = `
        SELECT 
          s.id,
          s.name as supplier_name,
          COUNT(DISTINCT CASE WHEN pl.sales_category = 'regular' THEN ps.product_id END) as regular_products,
          COUNT(DISTINCT CASE WHEN pl.sales_category = 'near_expiry' THEN ps.product_id END) as near_expiry_products,
          COUNT(DISTINCT CASE WHEN pl.sales_category = 'expired' THEN ps.product_id END) as expired_products,
          COUNT(DISTINCT ps.product_id) as total_products,
          MAX(pl.created_at) as last_import
        FROM suppliers s
        LEFT JOIN product_suppliers ps ON s.id = ps.supplier_id
        LEFT JOIN product_lots pl ON ps.id = pl.product_supplier_id
        GROUP BY s.id, s.name
        ORDER BY s.name
      `;
      
      const result = await pool.query(query);
      
      console.log(`✅ Resumen obtenido: ${result.rows.length} proveedores`);
      
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error al obtener resumen de proveedores:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener catálogo por proveedor y categoría - VERSIÓN CORREGIDA
getCatalogBySupplierAndCategory: async (req, res) => {
  try {
    const { supplier_id, sales_category } = req.params;
    
    console.log(`📦 Obteniendo catálogo: proveedor ${supplier_id}, categoría ${sales_category}`);
    
    const query = `
      SELECT 
        pl.id,
        pl.lot_number,
        pl.expiry_date,
        pl.quantity,
        pl.price_amount,
        pl.sales_category,
        pl.status,
        p.name as product_name,
        p.global_sku as product_code,
        p.description as product_description,
        m.name as manufacturer_name,
        ps.supplier_sku,
        ps.supplier_name
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE ps.supplier_id = $1 
        AND pl.sales_category = $2
        AND pl.quantity > 0
      ORDER BY p.name, pl.expiry_date
    `;
    
    const result = await pool.query(query, [supplier_id, sales_category]);
    
    console.log(`✅ Catálogo obtenido: ${result.rows.length} productos`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener catálogo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
},

  // Dashboard de inventario dropshipping
  getInventoryDashboard: async (req, res) => {
    try {
      console.log('📈 Obteniendo dashboard de inventario...');
      
      const query = `
        SELECT 
          -- Totales por categoría
          COUNT(CASE WHEN pl.sales_category = 'regular' THEN 1 END) as total_regular,
          COUNT(CASE WHEN pl.sales_category = 'near_expiry' THEN 1 END) as total_near_expiry,
          COUNT(CASE WHEN pl.sales_category = 'expired' THEN 1 END) as total_expired,
          
          -- Totales por proveedor
          COUNT(DISTINCT ps.supplier_id) as total_suppliers,
          
          -- Productos únicos
          COUNT(DISTINCT ps.product_id) as total_products,
          
          -- Valor total estimado
          COALESCE(SUM(pl.quantity * pl.price_amount), 0) as total_value,
          
          -- Última actualización
          MAX(pl.created_at) as last_import_date
        FROM product_lots pl
        LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
        WHERE pl.quantity > 0
      `;
      
      const result = await pool.query(query);
      
      console.log('✅ Dashboard obtenido exitosamente');
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error al obtener dashboard:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = inventoryController;