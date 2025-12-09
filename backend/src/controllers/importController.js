//backend/src/controllers/importController.js

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
      
      // Leer solo las primeras filas para no saturar memoria en upload
      const workbook = XLSX.readFile(req.file.path, { sheetRows: 10 });
      const sheetName = workbook.SheetNames[0];
      const previewData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

      // Registrar el upload en BD
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
        total_rows_estimate: 0 // Se calculará al procesar
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al leer el archivo Excel' });
    }
  },

  // 3. Previsualización (Si se necesita recargar)
  getPreview: async (req, res) => {
    // Implementación ligera si el frontend pierde el estado
    res.json({ message: "Usar datos retornados en upload" });
  },

  // 4. Plantillas
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
      res.json({ success: true, deleted: deletedCount, message: `Inventario ${sales_category} limpiado.` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al limpiar inventario' });
    }
  },

  // 6. PROCESAMIENTO PRINCIPAL
  processImport: async (req, res) => {
    // Respondemos rápido al cliente "Procesando..." y ejecutamos en background
    const { upload_id, mappings } = req.body;
    
    // Validar que existan datos
    if (!upload_id || !mappings) return res.status(400).json({ error: 'Datos incompletos' });

    res.json({ success: true, message: 'Procesamiento iniciado en segundo plano' });

    // Ejecución asíncrona (Background Job)
    try {
      await ImportModel.executeImportProcess(upload_id, mappings);
    } catch (error) {
      console.error("❌ Error CRÍTICO en background process:", error);
      await ImportModel.logFatalError(upload_id, error.message);
    }
  },

  // 7. Monitoreo
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
  }
};

module.exports = importController;