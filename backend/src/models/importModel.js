const db = require('../config/database');

const ImportModel = {
  // =============================================
  // NUEVAS FUNCIONES DE PROGRESO
  // =============================================

  // Crear registro de progreso
  createImportProgress: async (progressData) => {
    const {
      upload_id,
      user_id,
      total_rows = 0,
      processed_rows = 0,
      status = 'processing',
      current_operation = 'Iniciando...',
      estimated_time_remaining = 0,
      error_messages = null
    } = progressData;

    const query = `
      INSERT INTO import_progress 
        (upload_id, user_id, total_rows, processed_rows, status, current_operation, estimated_time_remaining, error_messages)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      upload_id, 
      user_id, 
      total_rows, 
      processed_rows, 
      status, 
      current_operation, 
      estimated_time_remaining, 
      error_messages
    ];

    try {
      const result = await db.query(query, values);
      console.log(`✅ Progreso creado para upload: ${upload_id}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creando progreso:', error);
      throw error;
    }
  },

  // Actualizar progreso
  updateImportProgress: async (upload_id, progressData) => {
    const {
      total_rows,
      processed_rows,
      status,
      current_operation,
      estimated_time_remaining,
      error_messages
    } = progressData;

    const query = `
      UPDATE import_progress 
      SET 
        total_rows = COALESCE($2, total_rows),
        processed_rows = COALESCE($3, processed_rows),
        status = COALESCE($4, status),
        current_operation = COALESCE($5, current_operation),
        estimated_time_remaining = COALESCE($6, estimated_time_remaining),
        error_messages = COALESCE($7, error_messages),
        updated_at = CURRENT_TIMESTAMP
      WHERE upload_id = $1
      RETURNING *
    `;
    
    const values = [
      upload_id,
      total_rows,
      processed_rows,
      status,
      current_operation,
      estimated_time_remaining,
      error_messages
    ];

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        console.warn(`⚠️ No se encontró progreso para upload: ${upload_id}`);
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error actualizando progreso:', error);
      throw error;
    }
  },

  // Obtener progreso
  getImportProgress: async (upload_id) => {
    const query = `
      SELECT * FROM import_progress 
      WHERE upload_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    try {
      const result = await db.query(query, [upload_id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error obteniendo progreso:', error);
      throw error;
    }
  },

  // =============================================
  // FUNCIONES EXISTENTES (MANTENIDAS Y MEJORADAS)
  // =============================================

  // Crear registro de upload (MEJORADO con currency e imágenes)
  createUpload: async (uploadData) => {
    const {
      supplier_id,
      filename,
      file_path,
      uploaded_by,
      status = 'uploaded',
      sales_category = 'regular',
      currency_code = 'USD',
      image_column = null
    } = uploadData;

    const query = `
      INSERT INTO raw_uploads (supplier_id, filename, file_path, uploaded_by, status, sales_category, currency_code, image_column)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      supplier_id, 
      filename, 
      file_path, 
      uploaded_by, 
      status, 
      sales_category, 
      currency_code, 
      image_column
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear filas raw (mantenida igual)
  createRawRows: async (rawRowsData) => {
    const query = `
      INSERT INTO raw_rows (raw_upload_id, row_index, raw_data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    try {
      const results = [];
      for (const row of rawRowsData) {
        const result = await db.query(query, [row.raw_upload_id, row.row_index, row.raw_data]);
        results.push(result.rows[0]);
      }
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Obtener preview de 5 filas (mantenida igual)
  getPreviewRows: async (uploadId) => {
    const query = `
      SELECT * FROM raw_rows 
      WHERE raw_upload_id = $1 
      ORDER BY row_index 
      LIMIT 5
    `;
    
    try {
      const result = await db.query(query, [uploadId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Buscar template de mapeo por proveedor (mantenida igual)
  findMappingTemplate: async (supplierId, name) => {
    const query = `
      SELECT * FROM mapping_templates 
      WHERE supplier_id = $1 AND name = $2
    `;
    
    try {
      const result = await db.query(query, [supplierId, name]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Guardar template de mapeo (mantenida igual)
  saveMappingTemplate: async (templateData) => {
    const { supplier_id, name, mappings, created_by } = templateData;
    
    const query = `
      INSERT INTO mapping_templates (supplier_id, name, mappings, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (supplier_id, name) 
      DO UPDATE SET mappings = $3, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [supplier_id, name, mappings, created_by];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error en saveMappingTemplate query:', error);
      throw error;
    }
  },

  // Limpiar catálogo existente (mantenida igual)
  cleanExistingCatalog: async (supplierId, salesCategory) => {
    try {
      console.log(`🧹 Limpiando catálogo completo para supplier: ${supplierId}, categoría: ${salesCategory}`);
      
      const deleteLotsQuery = `
        DELETE FROM product_lots 
        WHERE product_supplier_id IN (
          SELECT ps.id 
          FROM product_suppliers ps 
          WHERE ps.supplier_id = $1
        ) 
        AND sales_category = $2
        RETURNING id
      `;
      
      const lotsResult = await db.query(deleteLotsQuery, [supplierId, salesCategory]);
      
      const deleteProductSuppliersQuery = `
        DELETE FROM product_suppliers 
        WHERE supplier_id = $1 
        AND id NOT IN (
          SELECT DISTINCT product_supplier_id 
          FROM product_lots 
          WHERE product_supplier_id IS NOT NULL
        )
        RETURNING id
      `;
      
      const suppliersResult = await db.query(deleteProductSuppliersQuery, [supplierId]);
      
      console.log(`✅ Catálogo limpiado completamente: ${lotsResult.rows.length} lotes y ${suppliersResult.rows.length} relaciones eliminadas`);
      
      return {
        deleted_lots: lotsResult.rows,
        deleted_suppliers: suppliersResult.rows
      };
      
    } catch (error) {
      console.error('❌ Error en cleanExistingCatalog:', error);
      throw error;
    }
  },

  // FUNCIÓN AUXILIAR: Limpiar y convertir precio (mantenida igual)
  cleanPrice: (priceValue) => {
    if (!priceValue) return 0;
    
    try {
      let priceString = priceValue.toString().trim();
      priceString = priceString.replace(/[$,]/g, '').trim();
      const price = parseFloat(priceString);
      
      if (isNaN(price) || price < 0) {
        console.log(`⚠️ Precio inválido: "${priceValue}" -> usando 0`);
        return 0;
      }
      
      console.log(`✅ Precio convertido: "${priceValue}" -> ${price}`);
      return price;
    } catch (error) {
      console.log(`❌ Error limpiando precio: "${priceValue}" -> usando 0`);
      return 0;
    }
  },

  // FUNCIÓN AUXILIAR: Validar y formatear fecha (mantenida igual)
  validateDate: (dateValue) => {
    if (!dateValue) return null;
    
    try {
      const date = new Date(dateValue);
      
      if (isNaN(date.getTime())) {
        console.log(`⚠️ Fecha inválida: "${dateValue}" -> usando null`);
        return null;
      }
      
      const formattedDate = date.toISOString().split('T')[0];
      console.log(`✅ Fecha convertida: "${dateValue}" -> ${formattedDate}`);
      return formattedDate;
    } catch (error) {
      console.log(`❌ Error validando fecha: "${dateValue}" -> usando null`);
      return null;
    }
  },

  // FUNCIÓN AUXILIAR: Obtener o crear fabricante (mantenida igual)
  getOrCreateManufacturer: async (manufacturerName) => {
    try {
      const name = manufacturerName && manufacturerName.toString().trim() !== '' 
        ? manufacturerName.toString().trim() 
        : 'Desconocido';

      console.log(`🔍 Buscando fabricante: "${name}"`);

      let manufacturer = await db.query(
        'SELECT id FROM manufacturers WHERE name = $1',
        [name]
      );
      
      let manufacturerId;
      let created = false;
      
      if (manufacturer.rows.length === 0) {
        console.log(`🆕 Creando nuevo fabricante: "${name}"`);
        
        const newManufacturer = await db.query(
          `INSERT INTO manufacturers (name, country_id) 
           VALUES ($1, $2) 
           RETURNING id`,
          [name, 'US']
        );
        manufacturerId = newManufacturer.rows[0].id;
        created = true;
        console.log(`✅ Fabricante creado: ${manufacturerId}`);
      } else {
        manufacturerId = manufacturer.rows[0].id;
        console.log(`✅ Fabricante existente: ${manufacturerId}`);
      }
      
      return { manufacturerId, created };
      
    } catch (error) {
      console.error(`❌ Error en getOrCreateManufacturer:`, error);
      throw error;
    }
  },

  // FUNCIÓN AUXILIAR: Obtener o crear producto (mantenida igual)
  getOrCreateProduct: async (productData) => {
    try {
      const { codigo, descripcion, manufacturerId } = productData;
      
      const sku = codigo && codigo.toString().trim() !== '' 
        ? codigo.toString().trim() 
        : `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const name = descripcion && descripcion.toString().trim() !== '' 
        ? descripcion.toString().trim() 
        : 'Producto sin descripción';

      console.log(`🔍 Buscando producto: "${sku}" - "${name}"`);

      let product = await db.query(
        'SELECT id FROM products WHERE global_sku = $1',
        [sku]
      );
      
      let productId;
      let created = false;
      
      if (product.rows.length === 0) {
        console.log(`🆕 Creando nuevo producto: "${sku}"`);
        
        const newProduct = await db.query(
          `INSERT INTO products (name, global_sku, manufacturer_id) 
           VALUES ($1, $2, $3) 
           RETURNING id`,
          [name, sku, manufacturerId]
        );
        productId = newProduct.rows[0].id;
        created = true;
        console.log(`✅ Producto creado: ${productId}`);
      } else {
        productId = product.rows[0].id;
        console.log(`✅ Producto existente: ${productId}`);
      }
      
      return { productId, created };
      
    } catch (error) {
      console.error(`❌ Error en getOrCreateProduct:`, error);
      throw error;
    }
  },

  // FUNCIÓN AUXILIAR: Obtener o crear relación producto-proveedor (mantenida igual)
  getOrCreateProductSupplier: async (productSupplierData) => {
    try {
      const { productId, supplierId, codigo, supplierName } = productSupplierData;
      
      console.log(`🔍 Buscando relación producto-proveedor: ${productId} - ${supplierId}`);

      let productSupplier = await db.query(
        `SELECT id FROM product_suppliers 
         WHERE product_id = $1 AND supplier_id = $2`,
        [productId, supplierId]
      );
      
      let productSupplierId;
      if (productSupplier.rows.length === 0) {
        console.log(`🆕 Creando nueva relación producto-proveedor`);
        
        const supplierSku = codigo && codigo.toString().trim() !== '' 
          ? codigo.toString().trim() 
          : `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newProductSupplier = await db.query(
          `INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, supplier_name) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id`,
          [productId, supplierId, supplierSku, supplierName]
        );
        productSupplierId = newProductSupplier.rows[0].id;
        console.log(`✅ Relación creada: ${productSupplierId}`);
      } else {
        productSupplierId = productSupplier.rows[0].id;
        console.log(`✅ Relación existente: ${productSupplierId}`);
      }
      
      return productSupplierId;
      
    } catch (error) {
      console.error(`❌ Error en getOrCreateProductSupplier:`, error);
      throw error;
    }
  },

  // NUEVA FUNCIÓN: Convertir precio a USD usando countries
  convertPriceToUSD: async (price, currencyCode) => {
    if (!price || currencyCode === 'USD') return parseFloat(price) || 0;

    try {
      const result = await db.query(
        'SELECT exchange_rate FROM countries WHERE currency_code = $1 LIMIT 1',
        [currencyCode]
      );
      
      if (result.rows.length > 0) {
        const exchangeRate = result.rows[0].exchange_rate;
        const convertedPrice = (parseFloat(price) / exchangeRate);
        console.log(`💰 Conversión: ${price} ${currencyCode} → ${convertedPrice} USD (tasa: ${exchangeRate})`);
        return convertedPrice;
      } else {
        console.warn(`⚠️ No se encontró tasa de cambio para: ${currencyCode}, usando precio original`);
        return parseFloat(price) || 0;
      }
    } catch (error) {
      console.error(`❌ Error convirtiendo ${price} ${currencyCode} a USD:`, error);
      return parseFloat(price) || 0;
    }
  },

  // Agrupación inteligente de productos (mantenida igual)
  groupSimilarProducts: (mappedData) => {
    const groupedMap = new Map();
    let totalAgrupaciones = 0;
    
    console.log(`🔍 Iniciando agrupación inteligente para ${mappedData.length} filas...`);
    
    mappedData.forEach(row => {
      try {
        const codigo = (row.codigo || '').toString().trim();
        const precio = ImportModel.cleanPrice(row.precio);
        const fecha = ImportModel.validateDate(row.fecha_caducidad);
        
        const groupKey = `${codigo}_${precio}_${fecha}`;
        
        if (groupedMap.has(groupKey)) {
          const existing = groupedMap.get(groupKey);
          const cantidadActual = parseInt(row.cantidad) || 0;
          const cantidadExistente = existing.cantidad;
          
          existing.cantidad = cantidadExistente + cantidadActual;
          existing.sourceRows.push(row.row_index);
          totalAgrupaciones++;
          
          console.log(`🔄 Agrupando fila ${row.row_index} con fila(s) ${existing.sourceRows.slice(0, -1).join(', ')} → Cantidad total: ${existing.cantidad}`);
        } else {
          groupedMap.set(groupKey, {
            ...row,
            cantidad: parseInt(row.cantidad) || 0,
            sourceRows: [row.row_index],
            precio_limpio: precio,
            fecha_limpia: fecha
          });
        }
      } catch (error) {
        console.error(`❌ Error en agrupación para fila ${row.row_index}:`, error);
        groupedMap.set(`error_${row.row_index}`, {
          ...row,
          cantidad: parseInt(row.cantidad) || 0,
          sourceRows: [row.row_index],
          precio_limpio: ImportModel.cleanPrice(row.precio),
          fecha_limpia: ImportModel.validateDate(row.fecha_caducidad)
        });
      }
    });
    
    const consolidatedData = Array.from(groupedMap.values());
    
    if (totalAgrupaciones > 0) {
      console.log(`🎯 RESUMEN AGRUPACIÓN: ${mappedData.length} filas → ${consolidatedData.length} lotes únicos (${totalAgrupaciones} agrupación(es))`);
    } else {
      console.log(`📊 No se encontraron filas para agrupar. Procesando ${mappedData.length} filas individualmente.`);
    }
    
    return consolidatedData;
  },

  // FUNCIÓN processMappedData MEJORADA con conversión de moneda
  processMappedData: async (mappedData, currencyCode = 'USD') => {
    const results = {
      manufacturers_created: 0,
      products_created: 0,
      lots_created: 0,
      errors: [],
      consolidation: {
        original_rows: mappedData.length,
        consolidated_rows: 0,
        grouped_count: 0
      }
    };

    try {
      console.log(`📦 Procesando ${mappedData.length} filas mapeadas con moneda: ${currencyCode}`);

      // 1. AGRUPAR PRODUCTOS SIMILARES
      const consolidatedData = ImportModel.groupSimilarProducts(mappedData);
      results.consolidation.consolidated_rows = consolidatedData.length;
      results.consolidation.grouped_count = mappedData.length - consolidatedData.length;

      // 2. PROCESAR DATOS CONSOLIDADOS
      for (const row of consolidatedData) {
        try {
          if (row.sourceRows.length > 1) {
            console.log(`\n--- Procesando LOTE CONSOLIDADO de ${row.sourceRows.length} filas: ${row.sourceRows.join(', ')} ---`);
          } else {
            console.log(`\n--- Procesando fila ${row.row_index} ---`);
          }

          // CONVERTIR PRECIO A USD
          const precioOriginal = row.precio_limpio;
          const precioUSD = await ImportModel.convertPriceToUSD(precioOriginal, currencyCode);

          const cantidad = row.cantidad;
          const fechaCaducidad = row.fecha_limpia;

          console.log(`📊 Datos procesados: cantidad=${cantidad}, precio=${precioUSD} USD (original: ${precioOriginal} ${currencyCode}), fecha=${fechaCaducidad}`);

          // 3. OBTENER O CREAR FABRICANTE
          const manufacturerResult = await ImportModel.getOrCreateManufacturer(row.fabricante);
          if (manufacturerResult.created) {
            results.manufacturers_created++;
          }

          // 4. OBTENER O CREAR PRODUCTO
          const productResult = await ImportModel.getOrCreateProduct({
            codigo: row.codigo,
            descripcion: row.descripcion,
            manufacturerId: manufacturerResult.manufacturerId
          });

          if (productResult.created) {
            results.products_created++;
          }

          // 5. OBTENER O CREAR RELACIÓN PRODUCTO-PROVEEDOR
          const productSupplierId = await ImportModel.getOrCreateProductSupplier({
            productId: productResult.productId,
            supplierId: row.supplier_id,
            codigo: row.codigo,
            supplierName: row.supplier_name
          });

          // 6. CREAR LOTE
          console.log(`🆕 Creando lote...`);
          const lotResult = await db.query(
            `INSERT INTO product_lots (
              product_supplier_id, lot_number, expiry_date, quantity, unit,
              price_amount, price_currency, sales_category, status, received_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id`,
            [
              productSupplierId,
              `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              fechaCaducidad,
              cantidad,
              'pz',
              precioUSD,
              'USD',
              row.sales_category,
              'available',
              new Date()
            ]
          );

          results.lots_created++;
          
          if (row.sourceRows.length > 1) {
            console.log(`✅ LOTE CONSOLIDADO creado: ${lotResult.rows[0].id} | ${row.codigo} | $${precioUSD} USD | ${fechaCaducidad} | Cantidad: ${cantidad} (de ${row.sourceRows.length} filas)`);
          } else {
            console.log(`✅ Lote creado: ${lotResult.rows[0].id}`);
          }

        } catch (rowError) {
          const errorMsg = row.sourceRows.length > 1 
            ? `Lote consolidado de filas ${row.sourceRows.join(', ')}: ${rowError.message}`
            : `Fila ${row.row_index}: ${rowError.message}`;
          
          results.errors.push(errorMsg);
          console.error(`❌ Error en ${row.sourceRows.length > 1 ? 'lote consolidado' : 'fila'} ${row.sourceRows.join(', ')}:`, rowError);
        }
      }

      // 3. RESUMEN FINAL MEJORADO
      console.log(`\n🎉 PROCESAMIENTO COMPLETADO:`);
      console.log(`- Filas originales procesadas: ${results.consolidation.original_rows}`);
      console.log(`- Lotes únicos creados: ${results.lots_created}`);
      
      if (results.consolidation.grouped_count > 0) {
        console.log(`- ✅ Consolidación: ${results.consolidation.grouped_count} filas agrupadas en ${results.consolidation.consolidated_rows} lotes únicos`);
        console.log(`- 💰 Eficiencia: Reducción del ${Math.round((results.consolidation.grouped_count / results.consolidation.original_rows) * 100)}% en registros`);
      }
      
      console.log(`- 🏭 Fabricantes creados: ${results.manufacturers_created}`);
      console.log(`- 📦 Productos creados: ${results.products_created}`);
      console.log(`- ❌ Errores: ${results.errors.length}`);

      if (results.errors.length > 0) {
        console.log(`📋 Detalles de errores:`, results.errors);
      }

      return results;

    } catch (error) {
      console.error('❌ Error general en processMappedData:', error);
      throw error;
    }
  }
};

module.exports = ImportModel;