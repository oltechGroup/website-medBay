const ImportModel = require('../models/importModel');
const XLSX = require('xlsx');
const fs = require('fs');
const pool = require('../config/database');
const moment = require('moment');

const importController = {
  // Subir archivo con soporte para imágenes y moneda
  uploadFile: async (req, res) => {
    try {
      const { supplier_id, sales_category, currency_code = 'USD', image_column } = req.body;
      const file = req.file;

      console.log('📤 Subiendo archivo mejorado:', {
        supplier_id,
        sales_category,
        currency_code,
        image_column,
        filename: file?.originalname
      });

      if (!file) {
        return res.status(400).json({ 
          success: false,
          error: 'No se proporcionó archivo' 
        });
      }

      if (!supplier_id || !sales_category) {
        return res.status(400).json({ 
          success: false,
          error: 'supplier_id y sales_category son requeridos' 
        });
      }

      // Leer archivo Excel
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'El archivo Excel está vacío' 
        });
      }

      // Crear upload con nueva información
      const upload = await ImportModel.createUpload({
        supplier_id,
        filename: file.filename,
        file_path: file.path,
        uploaded_by: req.user?.id || 1,
        sales_category: sales_category,
        currency_code: currency_code,
        image_column: image_column
      });

      // Inicializar progreso
      await ImportModel.createImportProgress({
        upload_id: upload.id,
        user_id: req.user?.id || 1,
        total_rows: jsonData.length,
        processed_rows: 0,
        status: 'uploaded',
        current_operation: 'Archivo subido - listo para procesar'
      });

      // Guardar filas crudas
      const rawRows = jsonData.map((row, index) => ({
        raw_upload_id: upload.id,
        row_index: index + 1,
        raw_data: row
      }));

      await ImportModel.createRawRows(rawRows);

      console.log(`✅ Archivo procesado: ${jsonData.length} filas extraídas`);

      res.json({
        success: true,
        message: 'Archivo subido y procesado exitosamente',
        upload_id: upload.id,
        sales_category: sales_category,
        currency_code: currency_code,
        image_column: image_column,
        total_rows: jsonData.length,
        preview_available: true
      });

    } catch (error) {
      console.error('❌ Error en uploadFile mejorado:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al procesar el archivo',
        details: error.message 
      });
    }
  },

  // Parser inteligente de fechas
  parseDate: (dateString) => {
    if (!dateString) return null;
    
    // Limpiar y normalizar el string
    const cleanDate = dateString.toString().trim();
    
    // Lista de formatos a probar (ordenados por probabilidad)
    const formats = [
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'MM/DD/YYYY', 
      'YYYY/MM/DD',
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY.MM.DD',
      'DD.MM.YYYY',
      'MM.DD.YYYY',
      'YYYY/MM/DD HH:mm:ss',
      'DD/MM/YYYY HH:mm:ss',
      'MM/DD/YYYY HH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss.SSSZ',
      'MM/DD/YY',
      'DD/MM/YY',
      'YY-MM-DD'
    ];

    for (let format of formats) {
      const parsed = moment(cleanDate, format, true);
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
      }
    }

    console.warn(`⚠️ No se pudo parsear la fecha: ${dateString}`);
    return null;
  },

  // Convertir precio a USD
  convertToUSD: async (price, currencyCode) => {
    if (!price || currencyCode === 'USD') return parseFloat(price) || 0;

    try {
      const result = await pool.query(
        'SELECT exchange_rate FROM currencies WHERE code = $1',
        [currencyCode]
      );
      
      if (result.rows.length > 0) {
        const exchangeRate = result.rows[0].exchange_rate;
        return (parseFloat(price) / exchangeRate);
      }
    } catch (error) {
      console.error(`Error convirtiendo ${price} ${currencyCode} a USD:`, error);
    }

    return parseFloat(price) || 0;
  },

  // Procesar importación con progreso real
  processImport: async (req, res) => {
    const { upload_id, mappings, supplier_id, sales_category, supplier_name } = req.body;

    console.log('⚙️ Iniciando procesamiento mejorado para upload:', upload_id);

    try {
      // 1. Obtener información del upload
      const uploadResult = await pool.query(
        'SELECT * FROM raw_uploads WHERE id = $1',
        [upload_id]
      );
      
      if (uploadResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Upload no encontrado'
        });
      }

      const upload = uploadResult.rows[0];
      const currencyCode = upload.currency_code || 'USD';
      const imageColumn = upload.image_column;

      // 2. Obtener TODAS las filas
      const allRowsResult = await pool.query(
        'SELECT * FROM raw_rows WHERE raw_upload_id = $1 ORDER BY row_index',
        [upload_id]
      );
      
      if (!allRowsResult.rows || allRowsResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No se encontraron datos para procesar'
        });
      }

      const allRows = allRowsResult.rows;
      const totalRows = allRows.length;

      console.log(`📊 Procesando ${totalRows} filas con moneda: ${currencyCode}`);

      // 3. Iniciar progreso
      await ImportModel.updateImportProgress(upload_id, {
        total_rows: totalRows,
        processed_rows: 0,
        status: 'processing',
        current_operation: 'Iniciando procesamiento...',
        estimated_time_remaining: Math.ceil(totalRows * 0.1) // Estimación inicial
      });

      // 4. Procesar en chunks con progreso
      const chunkSize = 50;
      const errors = [];
      let processedCount = 0;
      let successfulLots = 0;

      for (let i = 0; i < allRows.length; i += chunkSize) {
        const chunk = allRows.slice(i, i + chunkSize);
        const chunkStartTime = Date.now();

        // Actualizar progreso
        await ImportModel.updateImportProgress(upload_id, {
          processed_rows: processedCount,
          current_operation: `Procesando lote ${Math.floor(i/chunkSize) + 1} de ${Math.ceil(allRows.length/chunkSize)}`,
          estimated_time_remaining: Math.ceil((allRows.length - processedCount) * 0.1)
        });

        const chunkMappedData = [];

        // Procesar cada fila del chunk
        for (const row of chunk) {
          try {
            const mappedRow = {
              supplier_id,
              supplier_name,
              sales_category,
              row_index: row.row_index
            };

            // Aplicar mapeo con procesamiento inteligente
            for (const [targetField, sourceColumn] of Object.entries(mappings)) {
              if (sourceColumn && row.raw_data[sourceColumn] !== undefined) {
                let value = row.raw_data[sourceColumn];

                // Procesamiento especial por tipo de campo
                switch (targetField) {
                  case 'precio':
                    value = await importController.convertToUSD(value, currencyCode);
                    break;
                  
                  case 'fecha_caducidad':
                    value = importController.parseDate(value);
                    break;
                  
                  case 'imagen_url':
                    // Solo procesar si existe la columna de imágenes
                    if (imageColumn && value) {
                      mappedRow[targetField] = value;
                    }
                    break;
                  
                  default:
                    mappedRow[targetField] = value;
                }

                mappedRow[targetField] = value;
              } else {
                mappedRow[targetField] = ''; // Valor por defecto
              }
            }

            chunkMappedData.push(mappedRow);
            processedCount++;

          } catch (error) {
            console.error(`❌ Error procesando fila ${row.row_index}:`, error);
            errors.push({
              row_index: row.row_index,
              error: error.message,
              data: row.raw_data
            });
          }
        }

        // Procesar el chunk completo
        if (chunkMappedData.length > 0) {
          try {
            const chunkResults = await ImportModel.processMappedData(chunkMappedData);
            successfulLots += chunkResults.lots_created || 0;
            
            console.log(`✅ Chunk procesado: ${chunkMappedData.length} filas, ${chunkResults.lots_created} lotes creados`);
          } catch (error) {
            console.error('❌ Error procesando chunk:', error);
            errors.push({
              chunk_error: error.message,
              chunk_index: Math.floor(i/chunkSize)
            });
          }
        }

        // Pequeña pausa para no saturar la BD
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 5. Finalizar progreso
      const finalStatus = errors.length > 0 ? 'completed_with_errors' : 'completed';
      await ImportModel.updateImportProgress(upload_id, {
        processed_rows: processedCount,
        status: finalStatus,
        current_operation: 'Procesamiento completado',
        estimated_time_remaining: 0,
        error_messages: errors
      });

      console.log(`✅ Importación completada: ${successfulLots} lotes, ${errors.length} errores`);

      res.json({
        success: true,
        message: `Importación procesada exitosamente. ${successfulLots} lotes creados.`,
        results: {
          total_rows: totalRows,
          successful_lots: successfulLots,
          errors_count: errors.length,
          errors: errors.slice(0, 10) // Mostrar solo primeros 10 errores
        }
      });

    } catch (error) {
      console.error('❌ Error en processImport mejorado:', error);
      
      // Actualizar progreso a error
      await ImportModel.updateImportProgress(upload_id, {
        status: 'error',
        current_operation: `Error: ${error.message}`,
        error_messages: [{ fatal_error: error.message }]
      });

      res.status(500).json({
        success: false,
        error: 'Error al procesar la importación',
        details: error.message
      });
    }
  },

  // Nuevo endpoint: Obtener progreso en tiempo real
  getImportProgress: async (req, res) => {
    try {
      const { upload_id } = req.params;

      const progress = await ImportModel.getImportProgress(upload_id);

      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Progreso no encontrado'
        });
      }

      // Calcular porcentaje
      const percentage = progress.total_rows > 0 
        ? Math.round((progress.processed_rows / progress.total_rows) * 100)
        : 0;

      res.json({
        success: true,
        progress: {
          ...progress,
          percentage,
          estimated_time_minutes: Math.ceil(progress.estimated_time_remaining / 60)
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo progreso:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener el progreso'
      });
    }
  },

  // Obtener preview de 5 filas para mapeo
  getPreview: async (req, res) => {
    try {
      const { upload_id } = req.params;

      console.log('👀 Obteniendo preview para upload:', upload_id);

      const previewRows = await ImportModel.getPreviewRows(upload_id);

      if (!previewRows || previewRows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'No se encontraron datos para el preview' 
        });
      }

      // Extraer las columnas disponibles del primer registro
      const availableColumns = Object.keys(previewRows[0].raw_data || {});

      res.json({
        success: true,
        preview: previewRows.map(row => row.raw_data),
        available_columns: availableColumns,
        total_preview_rows: previewRows.length
      });

    } catch (error) {
      console.error('❌ Error en getPreview:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener el preview',
        details: error.message 
      });
    }
  },

  // Obtener o crear template de mapeo (adaptado a tu estructura)
  getMappingTemplate: async (req, res) => {
    try {
      const { supplier_id, template_name = 'default' } = req.query;

      console.log('🗺️ Obteniendo template para:', { supplier_id, template_name });

      let template = await ImportModel.findMappingTemplate(supplier_id, template_name);

      // Si no existe, crear uno por defecto
      if (!template) {
        template = {
          supplier_id,
          name: template_name,
          mappings: {
            codigo: '',
            fabricante: '',
            descripcion: '',
            cantidad: '',
            precio: '',
            fecha_caducidad: ''
          }
        };
      }

      res.json({
        success: true,
        template
      });

    } catch (error) {
      console.error('❌ Error en getMappingTemplate:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener el template de mapeo',
        details: error.message 
      });
    }
  },

  // En el método saveMappingTemplate - CORREGIDO
  saveMappingTemplate: async (req, res) => {
    try {
      const { supplier_id, template_name = 'default', mappings } = req.body;

      console.log('💾 Guardando template:', { supplier_id, template_name, mappings });

      // Validaciones
      if (!supplier_id) {
        return res.status(400).json({ 
          success: false,
          error: 'supplier_id es requerido' 
        });
      }

      if (!mappings) {
        return res.status(400).json({ 
          success: false,
          error: 'mappings es requerido' 
        });
      }

      const template = await ImportModel.saveMappingTemplate({
        supplier_id,
        name: template_name,
        mappings,
        created_by: req.user?.id || 1
      });

      console.log('✅ Template guardado:', template.id);

      res.json({
        success: true,
        message: 'Template de mapeo guardado exitosamente',
        template
      });

    } catch (error) {
      console.error('❌ Error en saveMappingTemplate:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al guardar el template de mapeo',
        details: error.message 
      });
    }
  },

  // Limpiar catálogo existente
  cleanCatalog: async (req, res) => {
    try {
      const { supplier_id, sales_category } = req.body;

      console.log('🧹 Limpiando catálogo:', { supplier_id, sales_category });

      if (!supplier_id || !sales_category) {
        return res.status(400).json({ 
          success: false,
          error: 'supplier_id y sales_category son requeridos' 
        });
      }

      const deletedLots = await ImportModel.cleanExistingCatalog(supplier_id, sales_category);

      console.log(`✅ Catálogo limpiado: ${deletedLots.length} lotes eliminados`);

      res.json({
        success: true,
        message: `Catálogo ${sales_category} limpiado exitosamente`,
        deleted_count: deletedLots.length
      });

    } catch (error) {
      console.error('❌ Error en cleanCatalog:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al limpiar el catálogo',
        details: error.message 
      });
    }
  },

  // Procesar importación con mapeo - VERSIÓN CORREGIDA
  processImport: async (req, res) => {
    try {
      const { upload_id, mappings, supplier_id, sales_category, supplier_name } = req.body;

      console.log('⚙️ Procesando importación:', { upload_id, supplier_id, sales_category });

      // 1. Obtener TODAS las filas, no solo el preview
      const allRowsQuery = `
        SELECT * FROM raw_rows 
        WHERE raw_upload_id = $1 
        ORDER BY row_index
      `;
      const allRowsResult = await pool.query(allRowsQuery, [upload_id]);
      
      if (!allRowsResult.rows || allRowsResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'No se encontraron datos para procesar' 
        });
      }

      console.log(`📊 Procesando ${allRowsResult.rows.length} filas en total`);

      // 2. Aplicar mapeo a TODAS las filas
      const mappedData = allRowsResult.rows.map(row => {
        const mappedRow = {
          supplier_id,
          supplier_name,
          sales_category,
          row_index: row.row_index
        };

        // Aplicar mapeo de columnas
        Object.keys(mappings).forEach(targetField => {
          const sourceColumn = mappings[targetField];
          if (sourceColumn && row.raw_data[sourceColumn] !== undefined) {
            mappedRow[targetField] = row.raw_data[sourceColumn];
          } else {
            mappedRow[targetField] = ''; // Valor por defecto si no existe
          }
        });

        return mappedRow;
      });

      // 3. Procesar datos mapeados
      const results = await ImportModel.processMappedData(mappedData);

      console.log(`✅ Importación completada:`, {
        lotes: results.lots_created,
        productos: results.products_created,
        fabricantes: results.manufacturers_created,
        errores: results.errors.length
      });

      res.json({
        success: true,
        message: `Importación procesada exitosamente. ${results.lots_created} lotes creados.`,
        results: {
          total_rows: mappedData.length,
          successful_lots: results.lots_created,
          errors_count: results.errors.length,
          details: results
        }
      });

    } catch (error) {
      console.error('❌ Error en processImport:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al procesar la importación',
        details: error.message 
      });
    }
  },

// Endpoint CORREGIDO para historial - SIN ERRORES DE SINTAXIS
getImportHistory: async (req, res) => {
  try {
    console.log('📊 Obteniendo historial CORREGIDO de importaciones...');
    
    // Query CORREGIDA - eliminamos la expresión regular problemática
    const query = `
      SELECT 
        ru.id,
        ru.filename,
        ru.created_at,
        s.name as supplier_name,
        ru.status,
        ru.uploaded_by,
        ru.sales_category,
        (SELECT COUNT(*) FROM raw_rows rr WHERE rr.raw_upload_id = ru.id) as row_count,
        COALESCE((
          SELECT COUNT(DISTINCT pl.id) 
          FROM product_lots pl
          JOIN product_suppliers ps ON pl.product_supplier_id = ps.id
          WHERE ps.supplier_id = ru.supplier_id
          AND DATE(pl.created_at) = DATE(ru.created_at)
          AND pl.sales_category = ru.sales_category
        ), 0) as lots_created
      FROM raw_uploads ru
      LEFT JOIN suppliers s ON ru.supplier_id = s.id
      ORDER BY ru.created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    console.log(`✅ Historial CORREGIDO obtenido: ${result.rows.length} registros`);
    
    // Limpiar los nombres de archivo en JavaScript (no en SQL)
    const cleanedResults = result.rows.map(item => {
      let cleanFilename = item.filename;
      
      // Limpiar el nombre del archivo - remover el patrón "import-timestamp-"
      if (cleanFilename) {
        // Remover "import-" y todo hasta el siguiente guión
        cleanFilename = cleanFilename.replace(/^import-\d+-/, '');
      }
      
      return {
        ...item,
        clean_filename: cleanFilename || item.filename
      };
    });
    
    res.json(cleanedResults);
  } catch (error) {
    console.error('❌ Error al obtener historial CORREGIDO:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
},

// NUEVO ENDPOINT: Obtener estadísticas de importación
getImportStats: async (req, res) => {
  try {
    console.log('📈 Obteniendo estadísticas de importación...');
    
    const statsQuery = `
      SELECT 
        -- Importaciones hoy
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as imports_today,
        
        -- Importaciones este mes
        COUNT(CASE WHEN DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as imports_this_month,
        
        -- Total de importaciones
        COUNT(*) as total_imports,
        
        -- Última importación
        MAX(created_at) as last_import_date,
        
        -- Proveedor de la última importación
        (
          SELECT s.name 
          FROM raw_uploads ru2 
          LEFT JOIN suppliers s ON ru2.supplier_id = s.id 
          WHERE ru2.created_at = (SELECT MAX(created_at) FROM raw_uploads)
          LIMIT 1
        ) as last_import_supplier,
        
        -- Categoría de la última importación
        (
          SELECT sales_category 
          FROM raw_uploads 
          WHERE created_at = (SELECT MAX(created_at) FROM raw_uploads)
          LIMIT 1
        ) as last_import_category
        
      FROM raw_uploads
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('✅ Estadísticas obtenidas:', stats);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
},


};

module.exports = importController;