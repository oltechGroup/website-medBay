// backend/src/controllers/importController.js

const ImportModel = require('../models/importModel');
const XLSX = require('xlsx');
const fs = require('fs');

const importController = {

  // 1. Crear Proveedor Rápido
  createQuickSupplier: async (req, res) => {
    try {
      const { name, country_code } = req.body;
      if (!name || !country_code) {
        return res.status(400).json({ error: 'Nombre y País son requeridos' });
      }
      const supplier = await ImportModel.createQuickSupplier(name, country_code);
      res.json({ success: true, supplier });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 2. Subir Archivo y leer headers para preview
  uploadFile: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No se envió archivo' });
      
      const { supplier_id, sales_category } = req.body;
      
      const workbook = XLSX.readFile(req.file.path, { sheetRows: 10 });
      const sheetName = workbook.SheetNames[0];
      const previewData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

      const uploadId = await ImportModel.createUploadRecord({
        filename: req.file.originalname,
        path: req.file.path,
        supplier_id,
        sales_category,
        user_id: req.user.id
      });

      res.json({
        success: true,
        upload_id: uploadId,
        preview: previewData,
        columns: columns,
        total_rows_estimate: 0
      });

    } catch (error) {
      console.error('❌ Error en uploadFile:', error);
      res.status(500).json({ error: 'Error al procesar el archivo Excel' });
    }
  },

  // ✅ 3. NUEVO: PROCESAR ENTRADA MANUAL (CIRUGÍA DE PRECISIÓN)
  // Maneja la creación de un solo producto desde el formulario
  processManualImport: async (req, res) => {
    try {
      const { 
        supplier_id, sales_category, description, sku, 
        manufacturer, quantity, price, expiry_date, image_url 
      } = req.body;

      // Validación básica quirúrgica
      if (!description || !supplier_id) {
        return res.status(400).json({ error: 'Descripción y Proveedor son obligatorios.' });
      }

      // Detectar si hay una imagen física subida vía Multer
      const local_image_path = req.file ? req.file.path : null;

      const result = await ImportModel.createManualEntry({
        supplier_id,
        sales_category,
        user_id: req.user.id,
        description,
        sku,
        manufacturer,
        quantity: parseInt(quantity) || 0,
        price: parseFloat(price) || 0,
        expiry_date,
        image_url, // Si el usuario pegó un link
        local_image_path // Si el usuario subió un archivo
      });

      res.json({
        success: true,
        message: 'Entrada manual procesada exitosamente',
        upload_id: result.upload_id
      });

    } catch (error) {
      console.error('❌ Error en processManualImport:', error);
      res.status(500).json({ error: 'Error al procesar la entrada manual: ' + error.message });
    }
  },

  // 4. Plantillas de Mapeo
  getMappingTemplate: async (req, res) => {
    try {
      const { supplier_id } = req.query;
      const template = await ImportModel.getMappingTemplate(supplier_id);
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  saveMappingTemplate: async (req, res) => {
    try {
      const { supplier_id, mappings } = req.body;
      await ImportModel.saveMappingTemplate(supplier_id, mappings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 5. Limpieza de Inventario
  cleanCatalog: async (req, res) => {
    try {
      const { supplier_id, sales_category } = req.body;
      const deletedCount = await ImportModel.cleanSupplierInventory(supplier_id, sales_category);
      res.json({ 
        success: true, 
        deleted: deletedCount, 
        message: `Inventario ${sales_category} limpiado exitosamente.` 
      });
    } catch (error) {
      console.error('❌ Error en cleanCatalog:', error);
      res.status(500).json({ error: 'Error al limpiar el catálogo' });
    }
  },

  // 6. PROCESAMIENTO MASIVO (Excel)
  processImport: async (req, res) => {
    const { upload_id, mappings } = req.body;
    
    if (!upload_id || !mappings) {
      return res.status(400).json({ error: 'La configuración de mapeo es necesaria.' });
    }

    res.json({ 
      success: true, 
      message: 'El procesamiento masivo ha comenzado en segundo plano.' 
    });

    try {
      await ImportModel.executeImportProcess(upload_id, mappings);
    } catch (error) {
      console.error("❌ Error CRÍTICO en el proceso de fondo:", error);
      await ImportModel.logFatalError(upload_id, error.message);
    }
  },

  // 7. Monitoreo y Estadísticas
  getProgress: async (req, res) => {
    try {
      const progress = await ImportModel.getImportProgress(req.params.upload_id);
      res.json({ success: true, progress });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const history = await ImportModel.getImportHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getStats: async (req, res) => {
    try {
      const stats = await ImportModel.getGlobalStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ✅ 8. ESTADO ACTIVO GLOBAL (MEJORADO PARA RESTAURACIÓN DE SESIÓN)
  getActiveStatus: async (req, res) => {
    try {
      const history = await ImportModel.getImportHistory();
      const latestImport = history[0];

      if (latestImport) {
         // 🛡️ REGLA ANTI-BLOQUEO: Solo ignoramos si está subido pero sin mapear
         if (latestImport.status === 'uploaded') {
             return res.json({ success: true, activeImport: null });
         }
         
         // Prioridad 1: Si está procesando, lo devolvemos de inmediato
         if (latestImport.status === 'processing') {
             const progress = await ImportModel.getImportProgress(latestImport.id);
             return res.json({ success: true, activeImport: progress });
         }

         // Prioridad 2: Si terminó hace poco (menos de 1 hora para restaurar resultados)
         const importDate = new Date(latestImport.created_at);
         const oneHourAgo = new Date();
         oneHourAgo.setHours(oneHourAgo.getHours() - 1);

         if (importDate > oneHourAgo) {
             const progress = await ImportModel.getImportProgress(latestImport.id);
             if (progress) {
                return res.json({ success: true, activeImport: progress });
             }
         }
      }

      res.json({ success: true, activeImport: null });

    } catch (error) {
      console.error('Error checking active status:', error);
      res.json({ success: false, activeImport: null });
    }
  }
};

module.exports = importController;