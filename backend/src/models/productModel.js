const db = require('../config/database');

const Product = {
  // Crear un nuevo producto
  create: async (productData) => {
    const { name, description, manufacturer_id, global_sku, avalara_tax_code, requires_license, prescription_required, export_restricted, prohibited_countries, notes } = productData;
    
    const query = `
      INSERT INTO products (name, description, manufacturer_id, global_sku, avalara_tax_code, requires_license, prescription_required, export_restricted, prohibited_countries, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [name, description, manufacturer_id, global_sku, avalara_tax_code, requires_license, prescription_required, export_restricted, prohibited_countries, notes];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los productos con información relacionada
  findAll: async () => {
    const query = `
      SELECT 
        p.*,
        m.name as manufacturer_name,
        m.country as manufacturer_country,
        array_agg(DISTINCT c.name) as categories
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      GROUP BY p.id, m.id
      ORDER BY p.created_at DESC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener producto por ID
  findById: async (id) => {
    const query = `
      SELECT 
        p.*,
        m.name as manufacturer_name,
        m.country as manufacturer_country,
        array_agg(DISTINCT c.name) as categories
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = $1
      GROUP BY p.id, m.id
    `;
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar producto
  update: async (id, productData) => {
    const { name, description, manufacturer_id, global_sku, avalara_tax_code, requires_license, prescription_required, export_restricted, prohibited_countries, notes } = productData;
    
    const query = `
      UPDATE products 
      SET name = $1, description = $2, manufacturer_id = $3, global_sku = $4, avalara_tax_code = $5, 
          requires_license = $6, prescription_required = $7, export_restricted = $8, 
          prohibited_countries = $9, notes = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;
    
    const values = [name, description, manufacturer_id, global_sku, avalara_tax_code, requires_license, prescription_required, export_restricted, prohibited_countries, notes, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar producto
  delete: async (id) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar productos por nombre (búsqueda flexible con pg_trgm)
  search: async (searchTerm) => {
    const query = `
      SELECT 
        p.*,
        m.name as manufacturer_name,
        similarity(p.name, $1) as similarity_score
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.name % $1 OR p.description % $1
      ORDER BY similarity_score DESC
      LIMIT 50
    `;
    
    try {
      const result = await db.query(query, [searchTerm]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

    // Buscar producto por SKU global
  findByGlobalSku: async (global_sku) => {
    const query = 'SELECT * FROM products WHERE global_sku = $1';
    try {
      const result = await db.query(query, [global_sku]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar producto por nombre y fabricante
  findByNameAndManufacturer: async (name, manufacturer_id) => {
    const query = 'SELECT * FROM products WHERE LOWER(name) = LOWER($1) AND manufacturer_id = $2';
    try {
      const result = await db.query(query, [name, manufacturer_id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar o crear producto (para importación)
  findOrCreate: async (productData) => {
    const { global_sku, name, manufacturer_id } = productData;
    
    // Buscar por SKU global primero (más preciso)
    if (global_sku) {
      const existingBySku = await Product.findByGlobalSku(global_sku);
      if (existingBySku) {
        return existingBySku;
      }
    }
    
    // Si no hay SKU, buscar por nombre y fabricante
    if (name && manufacturer_id) {
      const existingByName = await Product.findByNameAndManufacturer(name, manufacturer_id);
      if (existingByName) {
        return existingByName;
      }
    }
    
    // Si no existe, crear nuevo
    return await Product.create(productData);
  }

};

module.exports = Product;