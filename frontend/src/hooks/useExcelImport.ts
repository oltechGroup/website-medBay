"use client";

import { useState } from 'react';

// Interfaces
interface ExcelData {
  headers: string[];
  rows: any[][];
}

interface ColumnMapping {
  [excelColumn: string]: string;
}

interface ImportProgress {
  current: number;
  total: number;
  status: string;
}

interface ImportResults {
  success: number;
  errors: number;
  details: {
    success: any[];
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  };
}

// Funciones de procesamiento inteligente para datos complejos
const processStockData = (value: any): { pieces: number, boxes: number } => {
  if (!value) return { pieces: 0, boxes: 0 };
  
  const result = { pieces: 0, boxes: 0 };
  
  if (typeof value === 'number') {
    result.pieces = value;
    return result;
  }
  
  const stringValue = String(value).toLowerCase();
  
  // Buscar patrones como "0 piezas / 4 cajas"
  const piezasCajasMatch = stringValue.match(/(\d+)\s*piezas?\s*\/\s*(\d+)\s*cajas?/i);
  if (piezasCajasMatch) {
    result.pieces = parseInt(piezasCajasMatch[1]) || 0;
    result.boxes = parseInt(piezasCajasMatch[2]) || 0;
    return result;
  }
  
  // Buscar "4 cajas y 2 piezas"
  const cajasPiezasMatch = stringValue.match(/(\d+)\s*cajas?\s*y\s*(\d+)\s*piezas?/i);
  if (cajasPiezasMatch) {
    result.boxes = parseInt(cajasPiezasMatch[1]) || 0;
    result.pieces = parseInt(cajasPiezasMatch[2]) || 0;
    return result;
  }
  
  // Si solo dice "piezas" o "cajas"
  if (stringValue.includes('pieza')) {
    const piezasMatch = stringValue.match(/(\d+)/);
    result.pieces = piezasMatch ? parseInt(piezasMatch[1]) : 0;
  } else if (stringValue.includes('caja')) {
    const cajasMatch = stringValue.match(/(\d+)/);
    result.boxes = cajasMatch ? parseInt(cajasMatch[1]) : 0;
  } else {
    // Si es solo un número, asumimos que son piezas
    const numericValue = parseFloat(stringValue);
    if (!isNaN(numericValue)) {
      result.pieces = numericValue;
    }
  }
  
  return result;
};

// Procesar precios manteniendo el formato original
const processPriceData = (value: any): number => {
  if (!value) return 0;
  
  if (typeof value === 'number') return value;
  
  const stringValue = String(value);
  // Extraer números, incluyendo decimales
  const priceMatch = stringValue.replace(/[^\d.,]/g, '').match(/([\d.,]+)/);
  if (priceMatch) {
    // Reemplazar comas por puntos para decimales
    const cleanPrice = priceMatch[1].replace(',', '.');
    return parseFloat(cleanPrice) || 0;
  }
  
  return 0;
};

// Función para leer archivos - SOPORTE COMPLETO PARA EXCEL Y CSV
const readFile = (file: File): Promise<ExcelData> => {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Para CSV
        if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length < 2) {
            reject(new Error('El archivo debe contener al menos una fila de datos'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map(line => 
            line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
          ).filter(row => row.some(cell => cell !== ''));

          resolve({ headers, rows });
        } 
        // Para Excel
        else if (file.name.toLowerCase().endsWith('.xlsx') || 
                 file.name.toLowerCase().endsWith('.xls') || 
                 file.type.includes('spreadsheet') || 
                 file.type.includes('excel')) {
          
          // Importación dinámica de xlsx
          const XLSX = await import('xlsx');
          
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON con headers
          const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (!Array.isArray(jsonData) || jsonData.length < 2) {
            reject(new Error('El archivo debe contener al menos una fila de datos'));
            return;
          }

          // Asegurar que los headers son strings
          const headers = (jsonData[0] as unknown[]).map(header => 
            header !== null && header !== undefined ? String(header) : ''
          ).filter(header => header !== '');

          // Filtrar filas vacías
          const rows = jsonData.slice(1)
            .filter((row): row is unknown[] => Array.isArray(row))
            .map(row => row.map(cell => 
              cell !== null && cell !== undefined ? String(cell) : ''
            ))
            .filter(row => row.some(cell => cell !== ''));

          resolve({ headers, rows });
        } else {
          reject(new Error('Formato de archivo no soportado. Use Excel (.xlsx, .xls) o CSV.'));
        }
      } catch (error) {
        console.error('Error procesando archivo:', error);
        reject(new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    
    // Leer según el tipo de archivo
    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

export const useExcelImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Función para hacer peticiones API - CORREGIDA (sin redirecciones automáticas)
  const apiRequest = async (endpoint: string, options: any = {}) => {
    // Obtener token de forma más robusta
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
      
      // Si no hay token, mostrar error en lugar de redirigir
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
      }
    }

    try {
      const response = await fetch(`http://localhost:3001/api${endpoint}`, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        body: options.body,
      });

      if (response.status === 401) {
        // Token expirado o inválido - manejar sin redirección automática
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error en la petición API:', error);
      throw error;
    }
  };

  // Handle file upload
  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setIsImporting(true);
      const data = await readFile(uploadedFile);
      setFile(uploadedFile);
      setExcelData(data);
      
      // Auto-detect column mappings based on header names
      const autoMappings = autoDetectMappings(data.headers);
      setColumnMapping(autoMappings);
      
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  // Auto-detect column mappings - ACTUALIZADO con campos separados para piezas/cajas
  const autoDetectMappings = (headers: string[]): ColumnMapping => {
    const mappings: ColumnMapping = {};
    const fieldPatterns = {
      code: ['codigo', 'sku', 'id', 'referencia', 'articulo', 'code', 'id_producto', 'producto_id'],
      name: ['nombre', 'producto', 'descripcion', 'item', 'name', 'product', 'descripción'],
      description: ['descripcion', 'detalles', 'description', 'details', 'caracteristicas'],
      price_piece: ['precio_pieza', 'precio_unitario', 'precio_suelto', 'price_piece', 'precio_unidad', 'precio'],
      price_box: ['precio_caja', 'precio_por_caja', 'price_box', 'precio_caja'],
      stock_pieces: ['piezas', 'stock_piezas', 'unidades', 'cantidad_piezas', 'piezas_sueltas', 'stock', 'cantidad'],
      stock_boxes: ['cajas', 'stock_cajas', 'cantidad_cajas', 'cajas_enteras'],
      manufacturer_id: ['fabricante', 'marca', 'laboratorio', 'manufacturer', 'brand', 'lab', 'proveedor'],
      category_id: ['categoria', 'rubro', 'category', 'type', 'clasificación', 'clasificacion'],
      expiration_date: ['vencimiento', 'fecha_vencimiento', 'expiration', 'expiry_date', 'fecha_venc'],
      batch_number: ['lote', 'batch', 'numero_lote', 'batch_number', 'num_lote', 'lote_num'],
    };

    headers.forEach(header => {
      const headerLower = header.toLowerCase().trim();
      
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (patterns.some(pattern => headerLower.includes(pattern.toLowerCase()))) {
          mappings[header] = field;
          break;
        }
      }
    });

    return mappings;
  };

  // Validate mappings before import - ACTUALIZADO (solo código y nombre requeridos)
  const validateMappings = (mappings: ColumnMapping, data: ExcelData): string[] => {
    const errors: string[] = [];
    const requiredFields = ['code', 'name'];
    
    requiredFields.forEach(field => {
      if (!Object.values(mappings).includes(field)) {
        errors.push(`El campo ${field} es requerido`);
      }
    });

    if (data.rows.length === 0) {
      errors.push('No hay datos para importar');
    }

    return errors;
  };

  // Start import process
  const handleImport = async () => {
    if (!file || !excelData || !columnMapping) {
      throw new Error('Datos de importación incompletos');
    }

    const errors = validateMappings(columnMapping, excelData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      throw new Error('Errores de validación encontrados');
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: excelData.rows.length, status: 'Preparando importación...' });

    try {
      // Transform data according to mappings - CON PROCESAMIENTO CORRECTO
      const transformedData = excelData.rows.map((row: any[], index: number) => {
        const transformed: any = {};
        
        Object.entries(columnMapping).forEach(([excelHeader, field]) => {
          const headerIndex = excelData.headers.indexOf(excelHeader);
          if (headerIndex !== -1 && row[headerIndex] !== undefined) {
            const rawValue = row[headerIndex];
            
            // Procesar según el tipo de campo
            switch (field) {
              case 'stock_pieces':
              case 'stock_boxes':
                const stockData = processStockData(rawValue);
                transformed.stock_pieces = stockData.pieces;
                transformed.stock_boxes = stockData.boxes;
                break;
                
              case 'price_piece':
              case 'price_box':
                transformed[field] = processPriceData(rawValue);
                break;
                
              default:
                transformed[field] = rawValue;
            }
          }
        });

        return transformed;
      });

      // Send to backend in batches
      const BATCH_SIZE = 50;
      let successCount = 0;
      let errorCount = 0;
      const successDetails: any[] = [];
      const errorDetails: Array<{ row: number; error: string; data: any }> = [];

      for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
        const batch = transformedData.slice(i, i + BATCH_SIZE);
        
        setImportProgress({
          current: i,
          total: transformedData.length,
          status: `Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(transformedData.length / BATCH_SIZE)}...`
        });

        try {
          const response = await apiRequest('/products/import', {
            method: 'POST',
            body: JSON.stringify({ products: batch })
          });
          
          if (response) {
            successCount += response.success || 0;
            errorCount += response.errors || 0;
            
            if (response.details) {
              successDetails.push(...(response.details.success || []));
              errorDetails.push(...(response.details.errors || []));
            }
          }
        } catch (error) {
          console.error('Error importing batch:', error);
          errorCount += batch.length;
          batch.forEach((rowData: any, batchIndex: number) => {
            errorDetails.push({
              row: i + batchIndex + 2, // +2 porque Excel tiene header y empieza en 1
              error: 'Error del servidor al procesar el lote',
              data: rowData
            });
          });
        }

        // Pequeña pausa para no saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({
        success: successCount,
        errors: errorCount,
        details: {
          success: successDetails,
          errors: errorDetails
        }
      });

    } catch (error) {
      console.error('Import error:', error);
      throw error;
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Reset import state
  const resetImport = () => {
    setFile(null);
    setExcelData(null);
    setColumnMapping({});
    setImportProgress(null);
    setImportResults(null);
    setIsImporting(false);
    setValidationErrors([]);
  };

  return {
    file,
    setFile: handleFileUpload,
    excelData,
    columnMapping,
    setColumnMapping,
    importProgress,
    importResults,
    isImporting,
    handleImport,
    resetImport,
    validationErrors
  };
};