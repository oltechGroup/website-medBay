'use client';

import React, { useState, useEffect } from 'react';
import { Map, CheckCircle, AlertCircle, Table, Download, XCircle, MinusCircle } from 'lucide-react';

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
  { key: 'descripcion', label: 'Descripción', description: 'Corazón del producto (Obligatorio)', canSkip: false },
  { key: 'codigo', label: 'Código / SKU', description: 'Identificador del proveedor', canSkip: true },
  { key: 'fabricante', label: 'Fabricante', description: 'Marca o laboratorio', canSkip: true },
  { key: 'cantidad', label: 'Cantidad', description: 'Stock de este lote', canSkip: true },
  { key: 'precio', label: 'Precio', description: 'Costo unitario', canSkip: true },
  { key: 'fecha_caducidad', label: 'Fecha Caducidad', description: 'Vencimiento del producto', canSkip: true },
];

const OPTIONAL_FIELDS = [
  { key: 'imagen_url', label: 'Imagen (URL)', description: 'URL de la imagen del producto' },
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

  const handleMappingChange = (fieldKey: string, value: string) => {
    const newMappings = { ...mappings, [fieldKey]: value };
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  // Ahora solo la descripción es estrictamente requerida para avanzar
  // Los demás deben tener una columna O estar marcados como not_applicable
  const isMappingComplete = () => {
    return REQUIRED_FIELDS.every(field => {
      if (field.key === 'descripcion') return !!mappings[field.key];
      return !!mappings[field.key] || mappings[field.key] === 'not_applicable';
    });
  };

  const getMappedField = (columnName: string) => {
    return Object.entries(mappings).find(([_, mappedColumn]) => mappedColumn === columnName)?.[0];
  };

  const isColumnMapped = (columnName: string) => {
    return Object.values(mappings).includes(columnName);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Map className="h-6 w-6 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Configuración de Corazón de Importación</h3>
            <p className="text-sm text-blue-700">
              Si un dato no existe en tu Excel, marca <strong>"No aplica"</strong>. MedBay generará la información necesaria.
            </p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-6">
        <h4 className="font-medium text-gray-900 mb-6 text-lg flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500"/> Definición de Atributos
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REQUIRED_FIELDS.map((field) => (
            <div key={field.key} className={`relative border rounded-xl p-5 transition-all shadow-sm ${mappings[field.key] === 'not_applicable' ? 'bg-gray-50 border-gray-300 opacity-80' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
              
              <div className="flex justify-between items-start mb-2">
                <label className="block text-sm font-bold text-gray-800">
                  {field.label} {field.key === 'descripcion' && <span className="text-red-500">*</span>}
                </label>
                
                {field.canSkip && (
                  <button 
                    onClick={() => handleMappingChange(field.key, mappings[field.key] === 'not_applicable' ? '' : 'not_applicable')}
                    className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tighter transition-colors ${mappings[field.key] === 'not_applicable' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  >
                    {mappings[field.key] === 'not_applicable' ? 'Habilitar' : 'No Aplica'}
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mb-4 h-8">{field.description}</p>
              
              {mappings[field.key] === 'not_applicable' ? (
                <div className="w-full py-2 px-3 bg-gray-200 rounded-md text-gray-500 text-sm font-medium flex items-center justify-center italic">
                  <MinusCircle className="w-4 h-4 mr-2" /> Campo omitido
                </div>
              ) : (
                <select
                  value={mappings[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${!mappings[field.key] ? 'border-amber-300' : 'border-gray-300'}`}
                >
                  <option value="">Selecciona columna...</option>
                  {availableColumns.map((column) => (
                    <option 
                      key={column} 
                      value={column}
                      disabled={isColumnMapped(column) && mappings[field.key] !== column}
                    >
                      {column}
                    </option>
                  ))}
                </select>
              )}

              {mappings[field.key] && mappings[field.key] !== 'not_applicable' && (
                <div className="mt-3 flex items-center text-green-600 animate-in fade-in zoom-in-95">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Mapeado</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-8">
          <h4 className="font-medium text-gray-900 mb-4 text-lg">Información Visual (Opcional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OPTIONAL_FIELDS.map((field) => (
              <div key={field.key} className="border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
                <p className="text-xs text-gray-500 mb-4">{field.description}</p>
                <select
                  value={mappings[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                >
                  <option value="">No asignar...</option>
                  {availableColumns.map((column) => (
                    <option key={column} value={column} disabled={isColumnMapped(column) && mappings[field.key] !== column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
           <div className="flex items-center space-x-2">
              <Table className="h-5 w-5 text-gray-600" />
              <span className="font-bold text-gray-700 text-sm">Previsualización de Datos</span>
           </div>
           <span className="text-[10px] font-bold bg-gray-200 px-2 py-1 rounded uppercase">Total: {totalRows} filas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs font-mono">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-500 border-r w-10">#</th>
                {availableColumns.map((column) => (
                  <th 
                    key={column}
                    className={`px-4 py-3 text-left font-bold border-r min-w-[150px] transition-colors ${isColumnMapped(column) ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                  >
                    {column}
                    {isColumnMapped(column) && (
                      <div className="text-[9px] uppercase mt-1 opacity-80">→ {getMappedField(column)}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {previewData.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30">
                  <td className="px-4 py-2 border-r bg-gray-50 text-gray-400 font-bold">{idx + 1}</td>
                  {availableColumns.map((col) => (
                    <td key={col} className={`px-4 py-2 border-r ${isColumnMapped(col) ? 'bg-blue-50/50' : ''}`}>
                      {row[col]?.toString() || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-200">
        <div className="flex items-center space-x-3">
          {isMappingComplete() ? (
            <div className="flex items-center text-green-700 font-bold text-sm bg-green-100 px-4 py-2 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 mr-2" /> Mapeo listo para procesar
            </div>
          ) : (
            <div className="flex items-center text-amber-700 font-bold text-sm bg-amber-100 px-4 py-2 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 mr-2" /> Falta asignar descripción u otros campos
            </div>
          )}
        </div>

        <button
          onClick={() => onComplete(mappings)}
          disabled={!isMappingComplete() || isProcessing}
          className="flex items-center px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 shadow-lg transition-all transform active:scale-95"
        >
          {isProcessing ? 'Procesando...' : <><Download className="h-5 w-5 mr-2" /> Iniciar Importación Masiva</>}
        </button>
      </div>
    </div>
  );
};