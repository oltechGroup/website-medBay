const db = require('../config/database'); // ✅ CORREGIDO: ../config/database

const Supplier = {
  // Crear un nuevo proveedor
  create: async (supplierData) => {
    const { name, tax_id, country, default_currency, contact_info } = supplierData;
    
    const query = `
      INSERT INTO suppliers (name, tax_id, country, default_currency, contact_info)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [name, tax_id, country, default_currency, contact_info];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los proveedores
  findAll: async () => {
    const query = 'SELECT * FROM suppliers ORDER BY name';
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener proveedor por ID
  findById: async (id) => {
    const query = 'SELECT * FROM suppliers WHERE id = $1';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar proveedor por nombre (case insensitive)
  findByName: async (name) => {
    const query = 'SELECT * FROM suppliers WHERE LOWER(name) = LOWER($1)';
    try {
      const result = await db.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar proveedor por tax_id
  findByTaxId: async (tax_id) => {
    const query = 'SELECT * FROM suppliers WHERE tax_id = $1';
    try {
      const result = await db.query(query, [tax_id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar proveedor
  update: async (id, supplierData) => {
    const { name, tax_id, country, default_currency, contact_info } = supplierData;
    
    const query = `
      UPDATE suppliers 
      SET name = $1, tax_id = $2, country = $3, default_currency = $4, contact_info = $5
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [name, tax_id, country, default_currency, contact_info, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar proveedor
  delete: async (id) => {
    const query = 'DELETE FROM suppliers WHERE id = $1 RETURNING *';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Buscar o crear proveedor (para importación)
  findOrCreate: async (supplierData) => {
    const { name, tax_id, country, default_currency, contact_info } = supplierData;
    
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
    return await Supplier.create({ name, tax_id, country, default_currency, contact_info });
  }
};

module.exports = Supplier;