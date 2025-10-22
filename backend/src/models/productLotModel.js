const db = require('../config/database');

const ProductLot = {
  // Crear un nuevo lote
  create: async (lotData) => {
    const {
      product_supplier_id,
      lot_number,
      expiry_date,
      quantity,
      unit,
      price_amount,
      price_currency,
      discount_price_amount,
      discount_price_currency,
      sales_category,
      manual_discount,
      received_at,
      status,
      expiry_category_id,
      created_by
    } = lotData;

    const query = `
      INSERT INTO product_lots (
        product_supplier_id, lot_number, expiry_date, quantity, unit,
        price_amount, price_currency, discount_price_amount, discount_price_currency,
        sales_category, manual_discount, received_at, status, expiry_category_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      product_supplier_id, lot_number, expiry_date, quantity, unit,
      price_amount, price_currency, discount_price_amount, discount_price_currency,
      sales_category, manual_discount, received_at, status, expiry_category_id, created_by
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los lotes con información relacionada
  findAll: async () => {
    const query = `
      SELECT 
        pl.*,
        p.name as product_name,
        s.name as supplier_name,
        ec.name as expiry_category_name
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN expiry_categories ec ON pl.expiry_category_id = ec.id
      ORDER BY pl.created_at DESC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Encontrar por ID
  findById: async (id) => {
    const query = `
      SELECT 
        pl.*,
        p.name as product_name,
        s.name as supplier_name,
        ec.name as expiry_category_name
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN expiry_categories ec ON pl.expiry_category_id = ec.id
      WHERE pl.id = $1
    `;
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Encontrar por número de lote
  findByLotNumber: async (lot_number) => {
    const query = 'SELECT * FROM product_lots WHERE lot_number = $1';
    
    try {
      const result = await db.query(query, [lot_number]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar lote
  update: async (id, lotData) => {
    const {
      product_supplier_id,
      lot_number,
      expiry_date,
      quantity,
      unit,
      price_amount,
      price_currency,
      discount_price_amount,
      discount_price_currency,
      sales_category,
      manual_discount,
      received_at,
      status,
      expiry_category_id
    } = lotData;

    const query = `
      UPDATE product_lots 
      SET 
        product_supplier_id = $1, lot_number = $2, expiry_date = $3, quantity = $4, unit = $5,
        price_amount = $6, price_currency = $7, discount_price_amount = $8, discount_price_currency = $9,
        sales_category = $10, manual_discount = $11, received_at = $12, status = $13, 
        expiry_category_id = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;
    
    const values = [
      product_supplier_id, lot_number, expiry_date, quantity, unit,
      price_amount, price_currency, discount_price_amount, discount_price_currency,
      sales_category, manual_discount, received_at, status, expiry_category_id, id
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar lote
  delete: async (id) => {
    const query = 'DELETE FROM product_lots WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = ProductLot;