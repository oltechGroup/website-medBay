const db = require('../config/database');

const Supplier = {
  // Crear un nuevo proveedor (PAÍS OBLIGATORIO)
  create: async (supplierData) => {
    const { name, country_code, contact_info, is_active = true } = supplierData;
    
    // ✅ PAÍS OBLIGATORIO - Validación interna
    if (!country_code) {
      throw new Error('El código de país es requerido');
    }
    
    const query = `
      INSERT INTO suppliers (name, country_code, contact_info, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [name, country_code, contact_info, is_active];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.create:', error);
      throw error;
    }
  },

  // Obtener todos los proveedores
  findAll: async () => {
    const query = `
      SELECT 
        s.*,
        c.name as country_name,
        c.currency_code,
        c.currency_name,
        c.currency_symbol,
        c.exchange_rate
      FROM suppliers s
      LEFT JOIN countries c ON s.country_code = c.code
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

  // Obtener proveedor por ID
  findById: async (id) => {
    const query = `
      SELECT 
        s.*,
        c.name as country_name,
        c.currency_code,
        c.currency_name,
        c.currency_symbol,
        c.exchange_rate
      FROM suppliers s
      LEFT JOIN countries c ON s.country_code = c.code
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

  // Buscar proveedor por nombre (MEJORADO: case-insensitive exacto)
  findByName: async (name) => {
    const query = `
      SELECT 
        s.*,
        c.name as country_name,
        c.currency_code,
        c.currency_name,
        c.currency_symbol,
        c.exchange_rate
      FROM suppliers s
      LEFT JOIN countries c ON s.country_code = c.code
      WHERE LOWER(TRIM(s.name)) = LOWER(TRIM($1))
    `;
    try {
      const result = await db.query(query, [name.trim()]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.findByName:', error);
      throw error;
    }
  },

  // Actualizar proveedor (PAÍS OBLIGATORIO)
  update: async (id, supplierData) => {
    const { name, country_code, contact_info, is_active } = supplierData;
    
    // ✅ PAÍS OBLIGATORIO - Validación interna
    if (!country_code) {
      throw new Error('El código de país es requerido');
    }
    
    const query = `
      UPDATE suppliers 
      SET name = $1, 
          country_code = $2, 
          contact_info = $3, 
          is_active = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [name, country_code, contact_info, is_active, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.update:', error);
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
      console.error('Error en Supplier.delete:', error);
      throw error;
    }
  },

  // Buscar o crear proveedor (MEJORADO: con validación de nombre duplicado)
  findOrCreate: async (supplierData) => {
    const { name, country_code, contact_info, is_active = true } = supplierData;
    
    // Primero buscar por nombre (case-insensitive)
    const existingByName = await Supplier.findByName(name);
    if (existingByName) {
      throw new Error(`Ya existe un proveedor con el nombre "${name}"`);
    }
    
    // Si no existe, crear nuevo
    return await Supplier.create({ name, country_code, contact_info, is_active });
  },

  // Contar proveedores para estadísticas
  count: async () => {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive
      FROM suppliers
    `;
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Supplier.count:', error);
      throw error;
    }
  },

  // Obtener estadísticas por país
  getStatsByCountry: async () => {
    const query = `
      SELECT 
        c.code as country_code,
        c.name as country_name,
        COUNT(s.id) as supplier_count
      FROM countries c
      LEFT JOIN suppliers s ON c.code = s.country_code AND s.is_active = true
      GROUP BY c.code, c.name
      HAVING COUNT(s.id) > 0
      ORDER BY supplier_count DESC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en Supplier.getStatsByCountry:', error);
      throw error;
    }
  }
};

module.exports = Supplier;