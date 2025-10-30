const ImportModel = require('../models/importModel');
const XLSX = require('xlsx');
const fs = require('fs');
const pool = require('../config/database'); // ← LÍNEA CRÍTICA AGREGADA

const importController = {
  // Subir archivo y extraer datos crudos
  uploadFile: async (req, res) => {
    try {
      const { supplier_id, sales_category } = req.body;
      const file = req.file;

      console.log('📤 Subiendo archivo:', {
        supplier_id,
        sales_category,
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

      // Crear registro de upload (adaptado a tu estructura)
      const upload = await ImportModel.createUpload({
        supplier_id,
        filename: file.filename,
        file_path: file.path,
        uploaded_by: req.user?.id || 1
      });

      // Guardar filas crudas (adaptado a tu estructura)
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
        total_rows: jsonData.length,
        preview_available: true
      });

    } catch (error) {
      console.error('❌ Error en uploadFile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al procesar el archivo',
        details: error.message 
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
  }
};

module.exports = importController;