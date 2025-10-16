"use client";

import { useState } from 'react';
import { MapPin, HelpCircle } from 'lucide-react';

interface ColumnMapperProps {
  file: File;
  excelData: any;
  columnMapping: { [key: string]: string };
  onMappingChange: (mapping: { [key: string]: string }) => void;
  validationErrors: string[];
}

const MEDBAY_FIELDS = [
  { key: 'code', label: 'Código del Producto', required: true, description: 'SKU, referencia o ID único' },
  { key: 'name', label: 'Nombre del Producto', required: true, description: 'Nombre completo del producto' },
  { key: 'description', label: 'Descripción', required: false, description: 'Descripción detallada' },
  { key: 'price_piece', label: 'Precio por Pieza', required: false, description: 'Precio unitario por pieza suelta' },
  { key: 'price_box', label: 'Precio por Caja', required: false, description: 'Precio por caja (si aplica)' },
  { key: 'stock_pieces', label: 'Stock en Piezas', required: false, description: 'Cantidad de piezas sueltas' },
  { key: 'stock_boxes', label: 'Stock en Cajas', required: false, description: 'Cantidad de cajas' },
  { key: 'manufacturer_id', label: 'Fabricante', required: false, description: 'Marca o fabricante' },
  { key: 'category_id', label: 'Categoría', required: false, description: 'Categoría del producto' },
  { key: 'expiration_date', label: 'Fecha de Vencimiento', required: false, description: 'Fecha de expiración' },
  { key: 'batch_number', label: 'Número de Lote', required: false, description: 'Lote del producto' },
];

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  excelData,
  columnMapping,
  onMappingChange,
  validationErrors
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const handleMappingChange = (excelHeader: string, medbayField: string) => {
    const newMapping = { ...columnMapping };
    
    if (medbayField === '') {
      // Clear mapping
      delete newMapping[excelHeader];
    } else {
      // Remove any existing mapping for this MedBay field
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === medbayField) {
          delete newMapping[key];
        }
      });
      
      newMapping[excelHeader] = medbayField;
    }
    
    onMappingChange(newMapping);
  };

  const getMappedField = (excelHeader: string) => {
    return columnMapping[excelHeader] || '';
  };

  const getFieldLabel = (fieldKey: string) => {
    const field = MEDBAY_FIELDS.find(f => f.key === fieldKey);
    return field ? field.label : fieldKey;
  };

  return (
    <div className="space-y-6">
      {/* Header Simple */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Paso 2: Asignar Columnas</h3>
            <p className="text-blue-700">
              Para cada columna de tu Excel, selecciona a qué campo de MedBay corresponde.
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Ayuda</span>
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">¿Cómo funciona?</h4>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
            <li><strong>Precios:</strong> Si tienes precios diferentes para piezas y cajas, asigna a "Precio por Pieza" y "Precio por Caja"</li>
            <li><strong>Stock:</strong> Asigna "Stock en Piezas" para piezas sueltas y "Stock en Cajas" para cajas completas</li>
            <li><strong>Campos obligatorios:</strong> Solo Código y Nombre son requeridos</li>
            <li>Si una columna no aplica, déjala en "Selecciona un campo..."</li>
          </ul>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Errores de Validación:</h4>
          <ul className="list-disc list-inside text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mapeo Simple con Selects */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {excelData.headers.map((header: string) => (
            <div key={header} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columna del Excel:
                  </label>
                  <div className="p-2 bg-gray-50 rounded border text-gray-900 font-medium">
                    {header}
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campo en MedBay:
                  </label>
                  <select
                    value={getMappedField(header)}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona un campo...</option>
                    {MEDBAY_FIELDS.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required && '*'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado:
                  </label>
                  {columnMapping[header] ? (
                    <div className="text-green-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>Mapeado a: {getFieldLabel(columnMapping[header])}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">No mapeado</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vista Previa Simplificada */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="text-sm font-medium text-gray-700">
            Vista Previa (primeras 5 filas)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {excelData.headers.map((header: string) => (
                  <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    <div>{header}</div>
                    {columnMapping[header] && (
                      <div className="text-xs text-green-600 font-normal">
                        → {getFieldLabel(columnMapping[header])}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {excelData.rows.slice(0, 5).map((row: any[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                      {cell || <span className="text-gray-400">vacío</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {excelData.rows.length > 5 && (
          <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 border-t">
            Mostrando 5 de {excelData.rows.length} filas
          </div>
        )}
      </div>
    </div>
  );
};