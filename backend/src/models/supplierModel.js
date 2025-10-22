const db = require('../config/database');

const Supplier = {
  // Crear un nuevo proveedor (COMPATIBLE con estructura actual)
  create: async (supplierData) => {
    const { name, tax_id, country_id, currency_id, contact_info } = supplierData;
    
    const query = `
      INSERT INTO suppliers (name, tax_id, country, default_currency, country_id, currency_id, contact_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    // Mantener compatibilidad: usar country_id/currency_id para las nuevas columnas
    // y también para las antiguas durante la transición
    const values = [
      name, 
      tax_id, 
      country_id,  // para columna 'country'
      currency_id, // para columna 'default_currency'  
      country_id,  // para columna 'country_id'
      currency_id, // para columna 'currency_id'
      contact_info
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.create:', error);
      throw error;
    }
  },

  // Obtener todos los proveedores (ACTUALIZADO: compatibilidad dual)
  findAll: async () => {
    const query = `
      SELECT 
        s.*,
        COALESCE(c.name, 'País no especificado') as country_name,
        COALESCE(c.code, s.country) as country_code,
        COALESCE(cr.name, 'Moneda no especificada') as currency_name,
        COALESCE(cr.symbol, '$') as currency_symbol
      FROM suppliers s
      LEFT JOIN countries c ON s.country_id = c.code OR s.country = c.code
      LEFT JOIN currencies cr ON s.currency_id = cr.code OR s.default_currency = cr.code
      ORDER BY s.name
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en Supplier.findAll:', error);
      throw error;
    }
  },

  // Obtener proveedor por ID (ACTUALIZADO: compatibilidad dual)
  findById: async (id) => {
    const query = `
      SELECT 
        s.*,
        COALESCE(c.name, 'País no especificado') as country_name,
        COALESCE(c.code, s.country) as country_code,
        COALESCE(cr.name, 'Moneda no especificada') as currency_name,
        COALESCE(cr.symbol, '$') as currency_symbol
      FROM suppliers s
      LEFT JOIN countries c ON s.country_id = c.code OR s.country = c.code
      LEFT JOIN currencies cr ON s.currency_id = cr.code OR s.default_currency = cr.code
      WHERE s.id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.findById:', error);
      throw error;
    }
  },

  // Buscar proveedor por nombre (ACTUALIZADO: compatibilidad dual)
  findByName: async (name) => {
    const query = `
      SELECT 
        s.*,
        COALESCE(c.name, 'País no especificado') as country_name,
        COALESCE(c.code, s.country) as country_code,
        COALESCE(cr.name, 'Moneda no especificada') as currency_name,
        COALESCE(cr.symbol, '$') as currency_symbol
      FROM suppliers s
      LEFT JOIN countries c ON s.country_id = c.code OR s.country = c.code
      LEFT JOIN currencies cr ON s.currency_id = cr.code OR s.default_currency = cr.code
      WHERE LOWER(s.name) = LOWER($1)
    `;
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.findByName:', error);
      throw error;
    }
  },

  // Buscar proveedor por tax_id (ACTUALIZADO: compatibilidad dual)
  findByTaxId: async (tax_id) => {
    const query = `
      SELECT 
        s.*,
        COALESCE(c.name, 'País no especificado') as country_name,
        COALESCE(c.code, s.country) as country_code,
        COALESCE(cr.name, 'Moneda no especificada') as currency_name,
        COALESCE(cr.symbol, '$') as currency_symbol
      FROM suppliers s
      LEFT JOIN countries c ON s.country_id = c.code OR s.country = c.code
      LEFT JOIN currencies cr ON s.currency_id = cr.code OR s.default_currency = cr.code
      WHERE s.tax_id = $1
    `;
    try {
      const result = await db.query(query, [tax_id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.findByTaxId:', error);
      throw error;
    }
  },

  // Actualizar proveedor (COMPATIBLE con estructura actual)
  update: async (id, supplierData) => {
    const { name, tax_id, country_id, currency_id, contact_info } = supplierData;
    
    const query = `
      UPDATE suppliers 
      SET name = $1, 
          tax_id = $2, 
          country = $3, 
          default_currency = $4, 
          country_id = $5, 
          currency_id = $6, 
          contact_info = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [
      name, 
      tax_id, 
      country_id,   // actualizar columna 'country'
      currency_id,  // actualizar columna 'default_currency'
      country_id,   // actualizar columna 'country_id'  
      currency_id,  // actualizar columna 'currency_id'
      contact_info, 
      id
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.update:', error);
      throw error;
    }
  },

  // Eliminar proveedor (sin cambios)
  delete: async (id) => {
    const query = 'DELETE FROM suppliers WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.delete:', error);
      throw error;
    }
  },

  // Buscar o crear proveedor (COMPATIBLE con estructura actual)
  findOrCreate: async (supplierData) => {
    const { name, tax_id, country_id, currency_id, contact_info } = supplierData;
    
    // Primero buscar por tax_id (si existe)
    if (tax_id) {
      const existingByTaxId = await Supplier.findByTaxId(tax_id);
      if (existingByTaxId) {
        return existingByTaxId;
      }
    }
    
    // Luego buscar por nombre
    const existingByName = await Supplier.findByName(name);
    if (existingByName) {
      return existingByName;
    }
    
    // Si no existe, crear nuevo
    return await Supplier.create({ name, tax_id, country_id, currency_id, contact_info });
  }
};

module.exports = Supplier;