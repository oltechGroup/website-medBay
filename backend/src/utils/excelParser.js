// Utilidades para parsear diferentes formatos de Excel

const excelParser = {
  // Parsear precios en diferentes formatos
  parsePrice: (priceString) => {
    if (!priceString) return null;
    
    // Remover símbolos de moneda y espacios
    let cleaned = priceString.toString()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    
    // Si tiene punto como separador de miles, limpiar
    if (cleaned.split('.').length > 2) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  },

  // Parsear cantidades mixtas (piezas/cajas)
  parseQuantity: (quantityString, unitsPerBox = 1) => {
    if (!quantityString) return 0;
    
    const str = quantityString.toString().toLowerCase();
    
    // Detectar formato "10 cajas" o "10 boxes"
    if (str.includes('caja') || str.includes('box')) {
      const boxes = parseInt(str.replace(/[^\d]/g, ''));
      return boxes * unitsPerBox;
    }
    
    // Detectar formato "10 piezas" o "10 units"
    if (str.includes('pieza') || str.includes('unit')) {
      return parseInt(str.replace(/[^\d]/g, ''));
    }
    
    // Si es solo número, asumir piezas
    return parseInt(str) || 0;
  },

  // Parsear fechas en diferentes formatos
  parseDate: (dateString) => {
    if (!dateString) return null;
    
    const str = dateString.toString().trim();
    
    // Intentar diferentes formatos de fecha
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/ // M/D/YY
    ];
    
    for (const format of formats) {
      const match = str.match(format);
      if (match) {
        let year, month, day;
        
        if (format === formats[0]) {
          // YYYY-MM-DD
          [, year, month, day] = match;
        } else if (format === formats[1]) {
          // DD/MM/YYYY
          [, day, month, year] = match;
        } else {
          // DD-MM-YYYY o M/D/YY
          [, day, month, year] = match;
        }
        
        // Ajustar año de 2 dígitos
        if (year.length === 2) {
          year = `20${year}`;
        }
        
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        return isNaN(date.getTime()) ? null : date;
      }
    }
    
    return null;
  },

  // Extraer fecha del nombre del archivo
  extractDateFromFilename: (filename) => {
    const patterns = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      /(\d{8})/ // YYYYMMDD
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        let dateStr;
        
        if (pattern === patterns[0]) {
          dateStr = match[0]; // YYYY-MM-DD
        } else if (pattern === patterns[1]) {
          const [, day, month, year] = match;
          dateStr = `${year}-${month}-${day}`;
        } else {
          const datePart = match[0];
          dateStr = `${datePart.slice(0,4)}-${datePart.slice(4,6)}-${datePart.slice(6,8)}`;
        }
        
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      }
    }
    
    return null;
  },

  // Detección automática de columnas con fuzzy matching
  autoDetectColumns: (excelData) => {
    if (!excelData || excelData.length === 0) return {};
    
    const firstRow = excelData[0];
    const columnNames = Object.keys(firstRow);
    const mappings = {};
    
    // Patrones comunes en español/inglés para detectar columnas
    const patterns = {
      product_name: ['producto', 'product', 'nombre', 'name', 'descripción', 'description', 'item'],
      sku: ['sku', 'código', 'code', 'referencia', 'reference', 'codigo', 'modelo'],
      manufacturer: ['fabricante', 'manufacturer', 'marca', 'brand', 'maker', 'producer'],
      category: ['categoría', 'category', 'familia', 'family', 'tipo', 'type', 'grupo'],
      price: ['precio', 'price', 'costo', 'cost', 'valor', 'importe', 'monto'],
      quantity: ['cantidad', 'quantity', 'stock', 'inventario', 'qty', 'stock', 'existencia'],
      lot_number: ['lote', 'lot', 'batch', 'número de lote', 'lot number', 'batch number'],
      expiry_date: ['caducidad', 'expiry', 'vencimiento', 'expiration', 'fecha caducidad', 'fecha vencimiento', 'exp date'],
      unit: ['unidad', 'unit', 'medida', 'measure', 'tipo unidad', 'unit type'],
      supplier_sku: ['sku proveedor', 'supplier sku', 'código proveedor', 'codigo proveedor']
    };
    
    columnNames.forEach(columnName => {
      const lowerColumn = columnName.toLowerCase().trim();
      
      for (const [field, patterns] of Object.entries(patterns)) {
        if (patterns.some(pattern => {
          // Búsqueda exacta o parcial
          return lowerColumn === pattern || 
                 lowerColumn.includes(pattern) ||
                 pattern.includes(lowerColumn);
        })) {
          mappings[field] = columnName;
          break;
        }
      }
    });
    
    return mappings;
  },

  // Validar datos parseados
  validateParsedData: (parsedData) => {
    const errors = [];
    
    if (!parsedData.product_name) {
      errors.push('Nombre del producto es requerido');
    }
    
    if (!parsedData.lot_number) {
      errors.push('Número de lote es requerido');
    }
    
    if (!parsedData.expiry_date) {
      errors.push('Fecha de expiración es requerida');
    } else if (new Date(parsedData.expiry_date) < new Date()) {
      errors.push('Producto ya expirado');
    }
    
    if (!parsedData.quantity || parsedData.quantity <= 0) {
      errors.push('Cantidad debe ser mayor a 0');
    }
    
    if (!parsedData.price || parsedData.price <= 0) {
      errors.push('Precio debe ser mayor a 0');
    }
    
    return errors;
  }
};

module.exports = excelParser;