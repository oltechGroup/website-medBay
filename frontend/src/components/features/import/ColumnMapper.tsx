//frontend/src/components/features/import/ColumnMapper.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Map, CheckCircle, AlertCircle, Table, Download } from 'lucide-react';

interface ColumnMapperProps {
  previewData: any[];
  availableColumns: string[];
  currentMappings: any;
  onMappingsChange: (mappings: any) => void;
  onComplete: (mappings: any) => void;
  isProcessing?: boolean;
  totalRows?: number;
  currencyCode?: string; 
  imageColumn?: string;
}

const REQUIRED_FIELDS = [
  { key: 'codigo', label: 'Código', description: 'Código/SKU del producto' },
  { key: 'fabricante', label: 'Fabricante', description: 'Nombre del fabricante' },
  { key: 'descripcion', label: 'Descripción', description: 'Nombre/descripción del producto' },
  { key: 'cantidad', label: 'Cantidad', description: 'Cantidad disponible' },
  { key: 'precio', label: 'Precio', description: 'Precio del producto' },
  { key: 'fecha_caducidad', label: 'Fecha Caducidad', description: 'Fecha de caducidad' },
];

const OPTIONAL_FIELDS = [
  { key: 'imagen_url', label: 'Imagen (URL)', description: 'URL de la imagen del producto (opcional)' },
];

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  previewData,
  availableColumns,
  currentMappings,
  onMappingsChange,
  onComplete,
  isProcessing = false,
  totalRows = 0,
  currencyCode = 'USD', 
  imageColumn, 
}) => {
  const [mappings, setMappings] = useState(currentMappings || {});
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  useEffect(() => {
    setMappings(currentMappings || {});
  }, [currentMappings]);

  useEffect(() => {
    if (imageColumn && availableColumns.includes(imageColumn) && !mappings.imagen_url) {
      const newMappings = { ...mappings, imagen_url: imageColumn };
      setMappings(newMappings);
      onMappingsChange(newMappings);
    }
  }, [imageColumn, availableColumns]);

  const handleMappingChange = (fieldKey: string, columnName: string) => {
    const newMappings = { ...mappings, [fieldKey]: columnName };
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const isMappingComplete = () => {
    return REQUIRED_FIELDS.every(field => mappings[field.key] && mappings[field.key] !== '');
  };

  const getMappedField = (columnName: string) => {
    return Object.entries(mappings).find(([_, mappedColumn]) => mappedColumn === columnName)?.[0];
  };

  const isColumnMapped = (columnName: string) => {
    return Object.values(mappings).includes(columnName);
  };

  const getFieldType = (fieldKey: string) => {
    return REQUIRED_FIELDS.some(f => f.key === fieldKey) ? 'required' : 'optional';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Map className="h-6 w-6 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Mapeo de Columnas</h3>
            <p className="text-sm text-blue-700">
              Asigna cada columna de tu Excel a los campos del sistema. 
              <span className="font-medium"> Arrastra horizontalmente para ver todas las columnas →</span>
            </p>
            {currencyCode && currencyCode !== 'USD' && (
              <p className="text-sm text-blue-600 mt-1">
                💰 <strong>Conversión automática:</strong> Los precios en {currencyCode} se convertirán a USD
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-6">
        <h4 className="font-medium text-gray-900 mb-4 text-lg">Campos Requeridos</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REQUIRED_FIELDS.map((field) => (
            <div key={field.key} className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">{field.description}</p>
              
              <select
                value={mappings[field.key] || ''}
                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="" className="text-gray-500">Selecciona una columna...</option>
                {availableColumns.map((column) => (
                  <option 
                    key={column} 
                    value={column}
                    disabled={isColumnMapped(column) && mappings[field.key] !== column}
                    className="text-gray-900"
                  >
                    {column} {isColumnMapped(column) && mappings[field.key] !== column && `(asignado a ${getMappedField(column)})`}
                  </option>
                ))}
              </select>

              {mappings[field.key] && (
                <div className="mt-2 flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Asignado a: {mappings[field.key]}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-4 text-lg">Campos Opcionales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPTIONAL_FIELDS.map((field) => (
              <div key={field.key} className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors border-l-4 border-l-blue-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  <span className="text-blue-500 ml-1 text-xs">(opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">{field.description}</p>
                
                <select
                  value={mappings[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">No asignar (opcional)...</option>
                  {availableColumns.map((column) => (
                    <option 
                      key={column} 
                      value={column}
                      disabled={isColumnMapped(column) && mappings[field.key] !== column}
                      className="text-gray-900"
                    >
                      {column} {isColumnMapped(column) && mappings[field.key] !== column && `(asignado a ${getMappedField(column)})`}
                    </option>
                  ))}
                </select>

                {mappings[field.key] && (
                  <div className="mt-2 flex items-center space-x-1 text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Asignado a: {mappings[field.key]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Table className="h-5 w-5 text-gray-600" />
            <h4 className="font-medium text-gray-900 text-lg">Vista Previa - Excel Completo</h4>
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Mostrando {previewData.length} de {totalRows} filas
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 font-mono text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-gray-600 bg-gray-900">#</th>
                  {availableColumns.map((column) => {
                    const mappedField = getMappedField(column);
                    const isMapped = isColumnMapped(column);
                    const fieldType = mappedField ? getFieldType(mappedField) : null;
                    return (
                      <th 
                        key={column}
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-600 cursor-pointer transition-colors group ${
                          selectedColumn === column 
                            ? 'bg-blue-600 text-white' 
                            : isMapped 
                              ? (fieldType === 'required' ? 'bg-green-800 text-white' : 'bg-blue-800 text-white')
                              : 'bg-gray-800 text-white'
                        }`}
                        onClick={() => setSelectedColumn(column)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="whitespace-nowrap">{column}</span>
                          {isMapped && (
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs text-white ml-2 ${fieldType === 'required' ? 'bg-green-600' : 'bg-blue-600'}`}>
                              {mappedField}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={`hover:bg-gray-50 transition-colors ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200 bg-gray-100 font-medium">{rowIndex + 1}</td>
                    {availableColumns.map((column) => {
                      const value = row[column];
                      const isMapped = isColumnMapped(column);
                      const mappedField = getMappedField(column);
                      const fieldType = mappedField ? getFieldType(mappedField) : null;
                      return (
                        <td key={column} className={`px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200 font-normal text-gray-900 ${isMapped ? (fieldType === 'required' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200') : ''} ${selectedColumn === column ? 'bg-blue-100 border-blue-300' : ''}`}>
                          {value !== undefined && value !== null && value !== '' ? <span className="font-mono">{value.toString()}</span> : <span className="text-gray-400 italic">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            {isMappingComplete() ? (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Todos los campos requeridos están mapeados correctamente</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Completa todos los campos requeridos para continuar</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onComplete(mappings)}
            disabled={!isMappingComplete() || isProcessing}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isProcessing ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Procesando Importación...</>) : (<><Download className="h-5 w-5 mr-2" />Confirmar Mapeo y Procesar</>)}
          </button>
        </div>
      </div>
    </div>
  );
};