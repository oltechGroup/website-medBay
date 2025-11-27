// backend/src/models/productModel.js

const db = require('../config/database');

const Product = {
  // Crear producto - ACTUALIZADO SIN CAMPOS ELIMINADOS
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

  // Obtener todos los productos - ACTUALIZADO CON TODOS LOS NUEVOS CAMPOS
  findAll: async () => {
    const query = `
      SELECT 
        p.id,
        p.description,
        p.manufacturer_id,
        p.global_sku,
        p.notes,
        p.created_at,
        p.updated_at,
        m.name as manufacturer_name,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as primary_image,
        (SELECT array_agg(category_id) FROM product_categories WHERE product_id = p.id) as category_ids,
        -- ✅ NUEVO: Nombres de categorías
        (SELECT array_agg(c.name) FROM product_categories pc 
         JOIN categories c ON pc.category_id = c.id 
         WHERE pc.product_id = p.id) as category_names,
        -- ✅ CORREGIDO: Incluir TODOS los estados (available, near_expiry, expired)
        (SELECT MIN(pl.price) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as min_price,
        (SELECT MAX(pl.price) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as max_price,
        (SELECT COUNT(pl.id) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as active_lots
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      ORDER BY p.created_at DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  },

  // ✅ CORREGIDO: Obtener producto por ID - AGREGADO WHERE p.id = $1
  findById: async (id) => {
    const query = `
      SELECT 
        p.id,
        p.description,
        p.manufacturer_id,
        p.global_sku,
        p.notes,
        p.created_at,
        p.updated_at,
        m.name as manufacturer_name,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as primary_image,
        (SELECT array_agg(category_id) FROM product_categories WHERE product_id = p.id) as category_ids,
        -- ✅ NUEVO: Nombres de categorías
        (SELECT array_agg(c.name) FROM product_categories pc 
         JOIN categories c ON pc.category_id = c.id 
         WHERE pc.product_id = p.id) as category_names,
        -- ✅ CORREGIDO: Incluir TODOS los estados (available, near_expiry, expired)
        (SELECT MIN(pl.price) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as min_price,
        (SELECT MAX(pl.price) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as max_price,
        (SELECT COUNT(pl.id) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as active_lots
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id = $1  -- ✅ CORRECCIÓN CRÍTICA: AGREGADO FILTRO POR ID
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Actualizar producto - MANTENIDO
  update: async (id, productData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (productData.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(productData.description);
      paramCount++;
    }
    
    if (productData.manufacturer_id !== undefined) {
      fields.push(`manufacturer_id = $${paramCount}`);
      values.push(productData.manufacturer_id);
      paramCount++;
    }
    
    if (productData.global_sku !== undefined) {
      fields.push(`global_sku = $${paramCount}`);
      values.push(productData.global_sku);
      paramCount++;
    }
    
    if (productData.notes !== undefined) {
      fields.push(`notes = $${paramCount}`);
      values.push(productData.notes);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const query = `
      UPDATE products 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Eliminar producto - MANTENIDO
  delete: async (id) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // ✅ CORREGIDO: Buscar productos - AGREGADO FILTRO DE BÚSQUEDA
  search: async (searchTerm) => {
    const query = `
      SELECT 
        p.id,
        p.description,
        p.manufacturer_id,
        p.global_sku,
        p.notes,
        p.created_at,
        p.updated_at,
        m.name as manufacturer_name,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as primary_image,
        (SELECT array_agg(category_id) FROM product_categories WHERE product_id = p.id) as category_ids,
        -- ✅ NUEVO: Nombres de categorías
        (SELECT array_agg(c.name) FROM product_categories pc 
         JOIN categories c ON pc.category_id = c.id 
         WHERE pc.product_id = p.id) as category_names,
        -- ✅ CORREGIDO: Incluir TODOS los estados (available, near_expiry, expired)
        (SELECT MIN(pl.price) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as min_price,
        (SELECT MAX(pl.price) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as max_price,
        (SELECT COUNT(pl.id) FROM product_lots pl 
         JOIN product_suppliers ps ON pl.product_supplier_id = ps.id 
         WHERE ps.product_id = p.id 
         AND pl.status IN ('available', 'near_expiry', 'expired') 
         AND pl.quantity > 0) as active_lots
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.description ILIKE $1 OR p.global_sku ILIKE $1  -- ✅ CORRECCIÓN CRÍTICA: AGREGADO FILTRO DE BÚSQUEDA
      ORDER BY p.created_at DESC
    `;
    
    const result = await db.query(query, [`%${searchTerm}%`]);
    return result.rows;
  },

  // Buscar por SKU global - MANTENIDO
  findByGlobalSku: async (globalSku) => {
    const query = 'SELECT * FROM products WHERE global_sku = $1';
    const result = await db.query(query, [globalSku]);
    return result.rows[0];
  },

  // Buscar por descripción y fabricante - MANTENIDO
  findByDescriptionAndManufacturer: async (description, manufacturerId) => {
    const query = 'SELECT * FROM products WHERE description = $1 AND manufacturer_id = $2';
    const result = await db.query(query, [description, manufacturerId]);
    return result.rows[0];
  },

  // 📊 Obtener estadísticas de productos - CORREGIDO DEFINITIVAMENTE
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

  // 📋 Obtener productos sin imágenes - MANTENIDO
  getProductsWithoutImages: async () => {
    const query = `
      SELECT 
        p.id,
        p.description,
        p.manufacturer_id,
        p.global_sku,
        p.notes,
        p.created_at,
        p.updated_at,
        m.name as manufacturer_name
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id NOT IN (SELECT DISTINCT product_id FROM product_images)
      ORDER BY p.created_at DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  },

  // 🆕 Buscar por descripción (sin fabricante) - PARA VALIDACIÓN DE DUPLICADOS
  findByDescription: async (description) => {
    const query = 'SELECT * FROM products WHERE description = $1';
    const result = await db.query(query, [description]);
    return result.rows[0];
  },

  // ✅ NUEVO: Obtener productos sin categorías
  getProductsWithoutCategories: async () => {
    const query = `
      SELECT 
        p.id,
        p.description,
        p.manufacturer_id,
        p.global_sku,
        p.notes,
        p.created_at,
        p.updated_at,
        m.name as manufacturer_name,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as primary_image
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