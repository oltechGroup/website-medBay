const Import = require('../models/importModel');
const Product = require('../models/productModel');
const Supplier = require('../models/supplierModel');
const Manufacturer = require('../models/manufacturerModel');
const Category = require('../models/categoryModel');
const Inventory = require('../models/inventoryModel');
const excelParser = require('../utils/excelParser');
const fs = require('fs');
const path = require('path');

// Simulamos el procesamiento de Excel (en producción usarías xlsx o similar)
const processExcelFile = (filePath) => {
  try {
    // En producción, aquí usarías:
    // const workbook = XLSX.readFile(filePath);
    // const sheetName = workbook.SheetNames[0];
    // return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // Por ahora simulamos datos de diferentes proveedores
    const filename = path.basename(filePath);
    
    // Simulamos diferentes formatos según el nombre del archivo
    if (filename.includes('proveedor_a')) {
      return [
        {
          'Producto': 'Paracetamol 500mg',
          'SKU Proveedor': 'PARA500001',
          'Fabricante': 'Pfizer',
          'Categoría': 'Medicamentos',
          'Precio Unitario': '25.50',
          'Cantidad en Stock': '100',
          'Número de Lote': 'LOTE-001',
          'Fecha Caducidad': '2024-12-31',
          'Unidad': 'piezas'
        },
        {
          'Producto': 'Ibuprofeno 400mg',
          'SKU Proveedor': 'IBU400001', 
          'Fabricante': 'Bayer',
          'Categoría': 'Medicamentos',
          'Precio Unitario': '30.00',
          'Cantidad en Stock': '50',
          'Número de Lote': 'LOTE-002',
          'Fecha Caducidad': '2024-11-30',
          'Unidad': 'piezas'
        }
      ];
    } else if (filename.includes('proveedor_b')) {
      return [
        {
          'Nombre Producto': 'Guantes Latex Talla M',
          'Código': 'GLM100001',
          'Marca': 'MediGlove',
          'Tipo': 'Desechables',
          'Coste': '15.75',
          'Stock Disponible': '200',
          'Lote': 'BATCH-001',
          'Vencimiento': '31/12/2024',
          'Medida': 'caja'
        }
      ];
    } else {
      // Formato genérico
      return [
        {
          'ITEM': 'Jeringa 10ml',
          'CODIGO': 'JER10ML001',
          'FABRICANTE': 'BD',
          'CATEGORIA': 'Material Desechable', 
          'PRECIO': '8.25',
          'CANTIDAD': '150',
          'LOTE_NUM': 'LOT-123',
          'FECHA_EXP': '2025-06-30',
          'UNIDAD_MED': 'piezas'
        }
      ];
    }
  } catch (error) {
    throw new Error(`Error procesando archivo Excel: ${error.message}`);
  }
};

const importController = {
  // Subir archivo Excel
  uploadFile: async (req, res) => {
    try {
      const { supplier_id } = req.body;
      
      if (!supplier_id) {
        return res.status(400).json({ error: 'supplier_id es requerido' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Archivo Excel es requerido' });
      }

      // Verificar que el proveedor existe
      const supplier = await Supplier.findById(supplier_id);
      if (!supplier) {
        // Limpiar archivo subido
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      // Procesar el archivo Excel
      const excelData = processExcelFile(req.file.path);
      
      if (!excelData || excelData.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'El archivo Excel está vacío o no se pudo procesar' });
      }

      // Crear raw_upload
      const rawUpload = await Import.createRawUpload({
        supplier_id,
        filename: req.file.originalname,
        uploaded_by: req.user.id,
        file_path: req.file.path,
        file_hash: 'simulated_hash_' + Date.now(),
        row_count: excelData.length,
        status: 'uploaded',
        errors: null
      });

      // Crear raw_rows para auditoría
      const rawRows = excelData.map((row, index) => ({
        raw_upload_id: rawUpload.id,
        row_index: index,
        raw_data: row
      }));

      await Import.createRawRows(rawRows);

      // Detección automática de mapeo
      const autoMappings = excelParser.autoDetectColumns(excelData);

      res.status(201).json({
        message: 'Archivo subido exitosamente',
        upload: rawUpload,
        autoMappings,
        sampleData: excelData.slice(0, 5), // Primeras 5 filas como muestra
        totalRows: excelData.length
      });

    } catch (error) {
      // Limpiar archivo en caso de error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error al subir archivo:', error);
      res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
  },

  // Obtener archivos subidos por proveedor
  getUploadsBySupplier: async (req, res) => {
    try {
      const { supplierId } = req.params;
      const uploads = await Import.findRawUploadsBySupplier(supplierId);
      res.json(uploads);
    } catch (error) {
      console.error('Error al obtener archivos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener detalles de un upload específico
  getUploadDetails: async (req, res) => {
    try {
      const { uploadId } = req.params;
      const uploadData = await Import.findRawUploadById(uploadId);
      
      if (!uploadData.upload) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      res.json(uploadData);
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Guardar mapping template
  saveMappingTemplate: async (req, res) => {
    try {
      const { supplier_id, name, mappings } = req.body;

      if (!supplier_id || !name || !mappings) {
        return res.status(400).json({ error: 'supplier_id, name y mappings son requeridos' });
      }

      const template = await Import.saveMappingTemplate({
        supplier_id,
        name,
        mappings,
        created_by: req.user.id
      });

      res.json({
        message: 'Plantilla guardada exitosamente',
        template
      });

    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener templates por proveedor
  getTemplatesBySupplier: async (req, res) => {
    try {
      const { supplierId } = req.params;
      const templates = await Import.findTemplatesBySupplier(supplierId);
      res.json(templates);
    } catch (error) {
      console.error('Error al obtener plantillas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Procesar archivo con mapping
  processUpload: async (req, res) => {
    try {
      const { uploadId } = req.params;
      const { mappings, applyTemplate } = req.body;

      if (!mappings) {
        return res.status(400).json({ error: 'Mappings son requeridos' });
      }

      // Obtener los datos del upload
      const uploadData = await Import.findRawUploadById(uploadId);
      if (!uploadData.upload) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      // Actualizar estado a processing
      await Import.updateRawUploadStatus(uploadId, 'processing');

      // Responder inmediatamente y procesar en segundo plano
      res.json({
        message: 'Procesamiento iniciado',
        uploadId,
        status: 'processing'
      });

      // Procesamiento en segundo plano
      setTimeout(async () => {
        try {
          const results = {
            processed: 0,
            errors: [],
            createdProducts: 0,
            updatedInventory: 0,
            expiredItems: 0,
            skippedItems: 0
          };

          for (const row of uploadData.rows) {
            try {
              const rawData = row.raw_data;
              const parsedData = {};

              // Aplicar mappings y parsear datos
              for (const [field, excelColumn] of Object.entries(mappings)) {
                if (rawData[excelColumn] !== undefined) {
                  let value = rawData[excelColumn];
                  
                  // Parsear según el tipo de campo
                  switch (field) {
                    case 'price':
                      value = excelParser.parsePrice(value);
                      break;
                    case 'quantity':
                      value = excelParser.parseQuantity(value);
                      break;
                    case 'expiry_date':
                      value = excelParser.parseDate(value) || 
                              excelParser.extractDateFromFilename(uploadData.upload.filename);
                      break;
                    default:
                      // Mantener como string
                      value = value ? value.toString().trim() : null;
                  }
                  
                  parsedData[field] = value;
                }
              }

              // Validar datos parseados
              const validationErrors = excelParser.validateParsedData(parsedData);
              if (validationErrors.length > 0) {
                results.errors.push({
                  row: row.row_index,
                  error: validationErrors.join(', '),
                  rawData
                });
                continue;
              }

              // VERIFICAR SI EL PRODUCTO YA EXISTE (usando findOrCreate)
              let product = null;
              if (parsedData.product_name) {
                // Buscar o crear fabricante
                const manufacturer = await Manufacturer.findOrCreate({
                  name: parsedData.manufacturer || 'Desconocido',
                  country: 'Unknown'
                });

                // Buscar o crear producto
                product = await Product.findOrCreate({
                  name: parsedData.product_name,
                  description: parsedData.product_name,
                  manufacturer_id: manufacturer.id,
                  global_sku: parsedData.sku || `GEN-${Date.now()}-${row.row_index}`,
                  requires_license: false,
                  prescription_required: false,
                  export_restricted: false
                });

                results.createdProducts++;
              }

              // CREAR LOTE EN INVENTARIO
              if (product && parsedData.lot_number && parsedData.quantity > 0) {
                const lotData = {
                  product_supplier_id: null, // Se establecería con la relación producto-proveedor
                  lot_number: parsedData.lot_number,
                  expiry_date: parsedData.expiry_date,
                  quantity: parsedData.quantity,
                  unit: parsedData.unit || 'piezas',
                  price_amount: parsedData.price,
                  price_currency: 'MXN',
                  received_at: new Date(),
                  raw_upload_id: uploadId,
                  import_line_id: row.id,
                  created_by: uploadData.upload.uploaded_by
                };

                // Aquí crearías el lote en product_lots
                // await Inventory.createLot(lotData);
                results.updatedInventory++;

                // Contar expirados
                if (new Date(parsedData.expiry_date) < new Date()) {
                  results.expiredItems++;
                }
              }

              results.processed++;

            } catch (error) {
              results.errors.push({
                row: row.row_index,
                error: error.message,
                rawData: row.raw_data
              });
            }
          }

          // Crear reporte de importación
          const importReport = await Import.createImportReport({
            raw_upload_id: uploadId,
            processed_rows: results.processed,
            errors_count: results.errors.length,
            expired_count: results.expiredItems,
            report_json: results
          });

          // Actualizar estado final
          const finalStatus = results.errors.length === 0 ? 'finished' : 'finished_with_errors';
          await Import.updateRawUploadStatus(uploadId, finalStatus, results.errors);

          console.log(`Procesamiento completado para upload ${uploadId}:`, {
            processed: results.processed,
            errors: results.errors.length,
            created: results.createdProducts,
            inventory: results.updatedInventory
          });

        } catch (error) {
          console.error('Error en procesamiento en segundo plano:', error);
          await Import.updateRawUploadStatus(uploadId, 'failed', [{ error: error.message }]);
        }
      }, 2000); // Simulamos 2 segundos de procesamiento

    } catch (error) {
      console.error('Error al iniciar procesamiento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener reporte de importación
  getImportReport: async (req, res) => {
    try {
      const { uploadId } = req.params;
      
      const query = `
        SELECT ir.*, ru.filename, ru.supplier_id, s.name as supplier_name
        FROM import_reports ir
        LEFT JOIN raw_uploads ru ON ir.raw_upload_id = ru.id
        LEFT JOIN suppliers s ON ru.supplier_id = s.id
        WHERE ir.raw_upload_id = $1
      `;
      
      const result = await db.query(query, [uploadId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al obtener reporte:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = importController;