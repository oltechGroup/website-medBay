// backend/src/models/productModel.js

const db = require('../config/database');

const Product = {
  create: async (productData) => {
    const query = `
      INSERT INTO products (
        description, manufacturer_id, global_sku, notes, 
        created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, NOW(), NOW()) 
      RETURNING *
    `;
    const values = [
      productData.description,
      productData.manufacturer_id,
      productData.global_sku,
      productData.notes || null,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // ✅ FUNCION OPTIMIZADA: Ordenamiento por Precio corregido
  findPaginated: async ({ 
    page = 1, 
    limit = 20, 
    searchTerm = '', 
    hasImages = 'all', 
    manufacturerId = '', 
    categoryId = '', 
    status = 'all', 
    minPrice = null,
    maxPrice = null,
    sortBy = 'newest' 
  }) => {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    // --- 1. BÚSQUEDA ---
    if (searchTerm) {
      whereConditions.push(`(
        p.description ILIKE $${paramCount} OR 
        p.global_sku ILIKE $${paramCount} OR
        EXISTS (
          SELECT 1 FROM product_categories pc 
          JOIN categories c ON pc.category_id = c.id 
          WHERE pc.product_id = p.id AND c.name ILIKE $${paramCount}
        )
      )`);
      params.push(`%${searchTerm}%`);
      paramCount++;
    }

    // --- 2. FABRICANTE ---
    if (manufacturerId) {
      whereConditions.push(`p.manufacturer_id = $${paramCount}`);
      params.push(manufacturerId);
      paramCount++;
    }

    // --- 3. IMÁGENES ---
    if (hasImages === 'with') {
      whereConditions.push(`EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)`);
    } else if (hasImages === 'without') {
      whereConditions.push(`NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)`);
    }
    
    // --- 4. CATEGORÍA ---
    if (categoryId) {
      whereConditions.push(`EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = $${paramCount})`);
      params.push(categoryId);
      paramCount++;
    }

    // --- 5. STATUS (Filtro Estricto) ---
    // Si status != 'all', el producto DEBE tener al menos un lote con ese status
    if (status && status !== 'all') {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM product_lots pl 
        JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
        WHERE ps.product_id = p.id 
        AND pl.status = $${paramCount}
        AND pl.quantity > 0
      )`);
      params.push(status);
      paramCount++;
    }

    // --- 6. PRECIO (Filtro) ---
    if (minPrice !== null) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM product_lots pl 
        JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
        WHERE ps.product_id = p.id AND pl.price >= $${paramCount}
      )`);
      params.push(minPrice);
      paramCount++;
    }
    if (maxPrice !== null) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM product_lots pl 
        JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
        WHERE ps.product_id = p.id AND pl.price <= $${paramCount}
      )`);
      params.push(maxPrice);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // --- ORDENAMIENTO (CORREGIDO) ---
    // Calculamos el precio mínimo válido para ordenar
    // Usamos COALESCE para evitar problemas con NULLs si no hay lotes
    let orderByClause = 'ORDER BY p.created_at DESC'; 

    const priceSortColumn = `(
      SELECT MIN(pl.price) 
      FROM product_lots pl 
      JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
      WHERE ps.product_id = p.id 
      AND pl.quantity > 0
      ${status && status !== 'all' ? `AND pl.status = '${status}'` : "AND pl.status IN ('available', 'near_expiry', 'expired')"}
    )`;

    switch (sortBy) {
      case 'price_asc':
        orderByClause = `ORDER BY ${priceSortColumn} ASC NULLS LAST`;
        break;
      case 'price_desc':
        orderByClause = `ORDER BY ${priceSortColumn} DESC NULLS LAST`;
        break;
      case 'name_asc':
        orderByClause = `ORDER BY p.description ASC`;
        break;
      case 'name_desc':
        orderByClause = `ORDER BY p.description DESC`;
        break;
      case 'newest':
      default:
        orderByClause = `ORDER BY p.created_at DESC`;
        break;
    }

    const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    params.push(limit);
    params.push(offset);

    const dataQuery = `
      SELECT 
        p.id,
        p.description,
        p.manufacturer_id,
        p.global_sku,
        p.notes,
        p.created_at,
        p.updated_at,
        m.name as manufacturer_name,
        
        (SELECT COUNT(*)::integer FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        
        (SELECT image_url FROM product_images pi 
         WHERE pi.product_id = p.id 
         ORDER BY pi.is_primary DESC, pi.created_at DESC 
         LIMIT 1) as primary_image,
          
        (SELECT array_agg(category_id) FROM product_categories WHERE product_id = p.id) as category_ids,
        (SELECT array_agg(c.name) FROM product_categories pc 
          JOIN categories c ON pc.category_id = c.id 
          WHERE pc.product_id = p.id) as category_names,
          
        -- Precios (Respetando el filtro de status si existe)
        (SELECT MIN(pl.price)::float FROM product_lots pl 
          JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
          WHERE ps.product_id = p.id AND pl.quantity > 0
          ${status && status !== 'all' ? `AND pl.status = '${status}'` : "AND pl.status IN ('available', 'near_expiry', 'expired')"}
        ) as min_price,
          
        (SELECT MAX(pl.price)::float FROM product_lots pl 
          JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
          WHERE ps.product_id = p.id AND pl.quantity > 0
          ${status && status !== 'all' ? `AND pl.status = '${status}'` : "AND pl.status IN ('available', 'near_expiry', 'expired')"}
        ) as max_price,
          
        (SELECT COUNT(pl.id)::integer FROM product_lots pl 
          JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
          WHERE ps.product_id = p.id AND pl.quantity > 0
          ${status && status !== 'all' ? `AND pl.status = '${status}'` : "AND pl.status IN ('available', 'near_expiry', 'expired')"}
        ) as active_lots

      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await db.query(dataQuery, params);

    return {
      products: result.rows,
      pagination: {
        total: totalItems,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  },

  findAll: async () => {
    const query = `SELECT * FROM products ORDER BY created_at DESC`;
    const result = await db.query(query);
    return result.rows;
  },
  
  findById: async (id) => {
    const query = `
      SELECT p.*, m.name as manufacturer_name
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  update: async (id, productData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;
    if (productData.description !== undefined) { fields.push(`description = $${paramCount}`); values.push(productData.description); paramCount++; }
    if (productData.manufacturer_id !== undefined) { fields.push(`manufacturer_id = $${paramCount}`); values.push(productData.manufacturer_id); paramCount++; }
    if (productData.global_sku !== undefined) { fields.push(`global_sku = $${paramCount}`); values.push(productData.global_sku); paramCount++; }
    if (productData.notes !== undefined) { fields.push(`notes = $${paramCount}`); values.push(productData.notes); paramCount++; }
    if (fields.length === 0) throw new Error('No hay campos para actualizar');
    fields.push(`updated_at = $${paramCount}`); values.push(new Date()); paramCount++;
    values.push(id);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0];
  },

  delete: async (id) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  search: async (searchTerm) => {
    const query = `SELECT * FROM products WHERE description ILIKE $1 LIMIT 50`;
    const result = await db.query(query, [`%${searchTerm}%`]);
    return result.rows;
  },

  findByGlobalSku: async (globalSku) => {
    const query = 'SELECT * FROM products WHERE global_sku = $1';
    const result = await db.query(query, [globalSku]);
    return result.rows[0];
  },

  findByDescription: async (description) => {
    const query = 'SELECT * FROM products WHERE description = $1';
    const result = await db.query(query, [description]);
    return result.rows[0];
  },

  getStats: async () => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(DISTINCT product_id) FROM product_images) as products_with_images,
        (SELECT COUNT(*) FROM products) - (SELECT COUNT(DISTINCT product_id) FROM product_images) as products_without_images
    `;
    const result = await db.query(query);
    return result.rows[0];
  },

  getProductsWithoutImages: async () => {
    const query = `
      SELECT p.*, m.name as manufacturer_name
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id NOT IN (SELECT DISTINCT product_id FROM product_images)
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  getProductsWithoutCategories: async () => {
    const query = `
      SELECT p.*, m.name as manufacturer_name
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id NOT IN (SELECT DISTINCT product_id FROM product_categories)
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
};

module.exports = Product;