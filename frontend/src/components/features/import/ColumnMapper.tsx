//frontend/src/components/features/import/ColumnMapper.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Map, CheckCircle, AlertCircle, Table, Download, MinusCircle, ArrowRight } from 'lucide-react';

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
  { key: 'descripcion', label: 'Description', description: 'Core of the product (Required)', canSkip: false },
  { key: 'codigo', label: 'Code / SKU', description: 'Supplier identifier', canSkip: true },
  { key: 'fabricante', label: 'Manufacturer', description: 'Brand or laboratory', canSkip: true },
  { key: 'cantidad', label: 'Quantity', description: 'Stock for this lot', canSkip: true },
  { key: 'precio', label: 'Price', description: 'Unit cost', canSkip: true },
  { key: 'fecha_caducidad', label: 'Expiration Date', description: 'Product expiration', canSkip: true },
];

const OPTIONAL_FIELDS = [
  { key: 'imagen_url', label: 'Image (URL)', description: 'Product image URL' },
  { key: 'notas', label: 'Notes / Includes', description: 'Additional info or included accessories' }, // ✅ NUEVO CAMPO AGREGADO
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageColumn, availableColumns]);

  const handleMappingChange = (fieldKey: string, value: string) => {
    const newMappings = { ...mappings, [fieldKey]: value };
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const isMappingComplete = () => {
    return REQUIRED_FIELDS.every(field => {
      if (field.key === 'descripcion') return !!mappings[field.key];
      return !!mappings[field.key] || mappings[field.key] === 'not_applicable';
    });
  };

  const getMappedField = (columnName: string) => {
    return Object.entries(mappings).find(([, mappedColumn]) => mappedColumn === columnName)?.[0];
  };

  const isColumnMapped = (columnName: string) => {
    return Object.values(mappings).includes(columnName);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Informative Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Map className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 text-lg">Import Configuration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Map your Excel columns. If a data point doesn't exist (like Quantity or Price), mark it as <strong>"Not applicable"</strong> and the system will handle it automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Mapping Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-6 text-xl flex items-center border-b pb-4">
          <CheckCircle className="mr-2 h-6 w-6 text-green-600"/> Attribute Definition
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REQUIRED_FIELDS.map((field) => {
            const isNotApplicable = mappings[field.key] === 'not_applicable';
            const isMapped = mappings[field.key] && !isNotApplicable;

            return (
              <div 
                key={field.key} 
                className={`relative border rounded-xl p-5 transition-all duration-200 ${
                  isNotApplicable 
                    ? 'bg-gray-50 border-gray-300 border-dashed' 
                    : isMapped 
                      ? 'bg-white border-blue-400 ring-1 ring-blue-100 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <label className={`text-sm font-bold ${isNotApplicable ? 'text-gray-500' : 'text-gray-800'}`}>
                    {field.label} {field.key === 'descripcion' && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.canSkip && (
                    <button 
                      onClick={() => handleMappingChange(field.key, isNotApplicable ? '' : 'not_applicable')}
                      className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide transition-colors ${
                        isNotApplicable 
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      {isNotApplicable ? 'Enable' : 'Skip'}
                    </button>
                  )}
                </div>
                
                <p className={`text-xs mb-4 h-5 truncate ${isNotApplicable ? 'text-gray-400' : 'text-gray-500'}`}>
                  {field.description}
                </p>
                
                {isNotApplicable ? (
                  <div className="w-full py-2.5 px-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm font-medium flex items-center justify-center">
                    <MinusCircle className="w-4 h-4 mr-2" /> Not applicable
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={mappings[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm appearance-none font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                        !mappings[field.key] ? 'border-amber-400' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select column...</option>
                      {availableColumns.map((column) => (
                        <option 
                          key={column} 
                          value={column} 
                          disabled={isColumnMapped(column) && mappings[field.key] !== column}
                          className="text-gray-900"
                        >
                          {column}
                        </option>
                      ))}
                    </select>
                    {/* Visual dropdown indicator */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                )}

                {isMapped && (
                  <div className="mt-3 flex items-center text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold w-fit animate-in fade-in slide-in-from-left-2">
                    <CheckCircle className="h-3 w-3 mr-1.5" />
                    READY
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Fields */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <h4 className="font-bold text-gray-800 mb-6 text-lg">Additional Information (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OPTIONAL_FIELDS.map((field) => (
              <div key={field.key} className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 hover:bg-white transition-colors">
                <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
                <p className="text-xs text-gray-500 mb-4">{field.description}</p>
                <div className="relative">
                  <select
                    value={mappings[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Do not assign...</option>
                    {availableColumns.map((column) => (
                      <option key={column} value={column} disabled={isColumnMapped(column) && mappings[field.key] !== column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Improved Preview Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white">
           <div className="flex items-center space-x-2">
              <Table className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-sm tracking-wide">DATA PREVIEW</span>
           </div>
           <span className="text-xs font-bold bg-gray-700 px-3 py-1 rounded-full border border-gray-600">
             Total: {totalRows.toLocaleString()} rows
           </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-12 bg-gray-50">
                  #
                </th>
                {availableColumns.map((column) => {
                  const isMapped = isColumnMapped(column);
                  const mappedFieldKey = getMappedField(column);
                  const mappedLabel = REQUIRED_FIELDS.find(f => f.key === mappedFieldKey)?.label || OPTIONAL_FIELDS.find(f => f.key === mappedFieldKey)?.label;

                  return (
                    <th 
                      key={column}
                      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200 min-w-[160px] transition-colors ${
                        isMapped ? 'bg-blue-50 text-blue-800 border-b-2 border-b-blue-500' : 'text-gray-600'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{column}</span>
                        {isMapped && (
                          <span className="mt-1 inline-flex items-center text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded w-fit">
                            <ArrowRight className="w-3 h-3 mr-1"/> {mappedLabel}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {previewData.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-400 bg-gray-50 border-r border-gray-200 text-center">
                    {idx + 1}
                  </td>
                  {availableColumns.map((col) => {
                    const isMapped = isColumnMapped(col);
                    return (
                      <td 
                        key={col} 
                        className={`px-4 py-3 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200 ${
                          isMapped ? 'bg-blue-50/30 font-medium text-gray-900' : ''
                        }`}
                      >
                        {row[col]?.toString() || <span className="text-gray-300 italic">empty</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 text-center font-medium">
          Showing the first 5 rows for verification
        </div>
      </div>

      {/* Final Action Button */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-xl ring-1 ring-black/5">
          <div className="flex items-center space-x-3">
            {isMappingComplete() ? (
              <div className="flex items-center text-green-800 font-bold text-sm bg-green-100 px-4 py-2 rounded-lg border border-green-200 shadow-sm">
                <CheckCircle className="h-5 w-5 mr-2" /> Configuration ready
              </div>
            ) : (
              <div className="flex items-center text-amber-800 font-bold text-sm bg-amber-100 px-4 py-2 rounded-lg border border-amber-200 shadow-sm">
                <AlertCircle className="h-5 w-5 mr-2" /> Complete the required fields (*)
              </div>
            )}
          </div>

          <button
            onClick={() => onComplete(mappings)}
            disabled={!isMappingComplete() || isProcessing}
            className={`
              flex items-center px-8 py-3.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg
              ${!isMappingComplete() || isProcessing 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-gray-900 text-white hover:bg-black hover:shadow-gray-900/20'}
            `}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" /> Start Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};