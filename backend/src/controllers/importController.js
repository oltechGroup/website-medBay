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
      
      // Optimizamos la lectura inicial: solo cargamos las primeras 10 filas
      // Esto es solo para que el usuario vea sus columnas y haga el mapeo.
      const workbook = XLSX.readFile(req.file.path, { sheetRows: 10 });
      const sheetName = workbook.SheetNames[0];
      const previewData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

      // Registrar el upload en BD para tener seguimiento del archivo físico
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
        total_rows_estimate: 0 // Se calculará con precisión en el executeImportProcess
      });

    } catch (error) {
      console.error('❌ Error en uploadFile:', error);
      res.status(500).json({ error: 'Error al procesar el archivo Excel' });
    }
  },

  // 3. Previsualización (Mantenido por compatibilidad)
  getPreview: async (req, res) => {
    res.json({ message: "Usar datos retornados en upload" });
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

  // 6. PROCESAMIENTO PRINCIPAL (MOTOR ASÍNCRONO)
  processImport: async (req, res) => {
    const { upload_id, mappings } = req.body;
    
    if (!upload_id || !mappings) {
      return res.status(400).json({ error: 'La configuración de mapeo es necesaria.' });
    }

    // --- RESPUESTA INMEDIATA ---
    // Liberamos al frontend para que muestre la barra de progreso
    res.json({ 
      success: true, 
      message: 'El procesamiento masivo ha comenzado en segundo plano.' 
    });

    // --- PROCESO EN BACKGROUND ---
    // Usamos el nuevo motor optimizado que creamos en el ImportModel
    try {
      console.log(`🚀 Iniciando ejecución de importación ID: ${upload_id}`);
      // Nota: executeImportProcess ahora incluye lógica "non-blocking" para CPU
      await ImportModel.executeImportProcess(upload_id, mappings);
      console.log(`✅ Importación ID: ${upload_id} finalizada.`);
    } catch (error) {
      console.error("❌ Error CRÍTICO en el proceso de fondo:", error);
      // Registramos el error en la tabla de progreso para que el usuario sepa qué falló
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

  // ✅ 8. NUEVO: ESTADO ACTIVO GLOBAL (Para la ventana flotante)
  getActiveStatus: async (req, res) => {
    try {
      // Reutilizamos el historial para buscar si hay algo corriendo
      // Esto evita tener que crear una query nueva en el modelo
      const history = await ImportModel.getImportHistory();
      
      // Buscamos el primero que esté 'processing'
      // (Ignoramos 'uploaded' porque eso es solo estar en el wizard, no consumiendo CPU)
      const active = history.find(item => item.status === 'processing');

      if (active) {
         // Si hay uno activo, obtenemos sus detalles precisos (porcentajes)
         const progress = await ImportModel.getImportProgress(active.id);
         return res.json({ success: true, activeImport: progress });
      }

      // Si no hay nada corriendo
      res.json({ success: true, activeImport: null });

    } catch (error) {
      // No fallamos con error 500 para no romper el polling del frontend
      console.error('Error checking active status:', error);
      res.json({ success: false, activeImport: null });
    }
  }
};

module.exports = importController;