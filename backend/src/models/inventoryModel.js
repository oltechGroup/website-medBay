const db = require('../config/database');

const Inventory = {
  // Crear un nuevo lote de inventario
  createLot: async (lotData) => {
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
      raw_upload_id,
      import_line_id,
      expiry_category_id,
      created_by
    } = lotData;
    
    const query = `
      INSERT INTO product_lots (
        product_supplier_id, lot_number, expiry_date, quantity, unit,
        price_amount, price_currency, discount_price_amount, discount_price_currency,
        sales_category, manual_discount, received_at, raw_upload_id, import_line_id,
        expiry_category_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      product_supplier_id, lot_number, expiry_date, quantity, unit,
      price_amount, price_currency, discount_price_amount, discount_price_currency,
      sales_category, manual_discount, received_at, raw_upload_id, import_line_id,
      expiry_category_id, created_by
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los lotes con información relacionada
  findAllLots: async () => {
    const query = `
      SELECT 
        pl.*,
        ps.supplier_sku,
        ps.supplier_name,
        ps.units_per_box,
        ps.unit_type,
        p.name as product_name,
        p.global_sku,
        p.requires_license,
        p.prescription_required,
        s.name as supplier_name,
        m.name as manufacturer_name,
        ec.name as expiry_category_name,
        ec.discount_percentage
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      LEFT JOIN expiry_categories ec ON pl.expiry_category_id = ec.id
      ORDER BY pl.expiry_date ASC, pl.created_at DESC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener lotes por producto
  findLotsByProduct: async (productId) => {
    const query = `
      SELECT 
        pl.*,
        ps.supplier_sku,
        ps.supplier_name,
        p.name as product_name,
        s.name as supplier_name
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      WHERE ps.product_id = $1
      ORDER BY pl.expiry_date ASC
    `;
    
    try {
      const result = await db.query(query, [productId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener lotes próximos a expirar
  findNearExpiryLots: async (days = 90) => {
    const query = `
      SELECT 
        pl.*,
        ps.supplier_sku,
        p.name as product_name,
        s.name as supplier_name,
        ec.name as expiry_category_name
      FROM product_lots pl
      LEFT JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
      LEFT JOIN products p ON ps.product_id = p.id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN expiry_categories ec ON pl.expiry_category_id = ec.id
      WHERE pl.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        AND pl.quantity > 0
      ORDER BY pl.expiry_date ASC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar cantidad de lote
  updateLotQuantity: async (lotId, newQuantity) => {
    const query = `
      UPDATE product_lots 
      SET quantity = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [newQuantity, lotId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Reservar cantidad de lote (para órdenes)
  reserveLotQuantity: async (lotId, quantityToReserve) => {
    const query = `
      UPDATE product_lots 
      SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND quantity >= $1
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [quantityToReserve, lotId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Liberar cantidad reservada (cuando se cancela una orden)
  releaseLotQuantity: async (lotId, quantityToRelease) => {
    const query = `
      UPDATE product_lots 
      SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [quantityToRelease, lotId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Inventory;