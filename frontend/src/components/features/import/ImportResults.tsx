//frontend/src/components/features/import/ImportResults.tsx
'use client';

import React from 'react';
import { 
  CheckCircle, XCircle, Package, Users, Building, 
  AlertTriangle, FileText, Download, Layers, FilterX, 
  History, ArrowRight 
} from 'lucide-react';
import { ImportProgress as ImportProgressType } from '@/hooks/useImport';

interface ImportResultsProps {
  progressData: ImportProgressType;
  importResults?: { success: boolean; message: string; results?: any };
  onRetry?: () => void;
  onNewImport?: () => void;
  onDownloadErrors?: () => void;
}

export const ImportResults: React.FC<ImportResultsProps> = ({ 
  progressData, 
  importResults, 
  onNewImport, 
  onDownloadErrors 
}) => {
  const { success, message } = importResults || {};
  
  // Determinamos el éxito basado en el estado del progreso asíncrono
  const finalSuccess = success ?? (
    progressData.status === 'completed' || 
    progressData.status === 'finished' || 
    progressData.status === 'completed_with_errors'
  );
  
  const errorList = progressData.error_messages?.errors || [];
  const errorCount = errorList.length;
  
  const stats: any = progressData.error_messages?.stats || {};
  const lotsCreated = stats.created_lots || 0;
  const productsCreated = stats.created_products || 0;
  const manufacturersCreated = stats.created_manufacturers || 0;
  const skippedRows = stats.skipped_rows || 0;

  const totalRows = progressData.total_rows || 0;

  // Formateador de errores amigable para MedBay
  const formatError = (error: any): string => {
    let msg = typeof error === 'string' ? error : (error.error || error.message || 'Error de validación');
    if (msg.includes('unique constraint')) return 'El SKU ya existe para este proveedor';
    if (msg.includes('value too long')) return 'Dato demasiado largo para el sistema';
    return msg;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Banner de Estado Principal */}
      <div className={`rounded-2xl p-6 shadow-sm border-2 ${
        finalSuccess 
          ? (errorCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200') 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              finalSuccess 
                ? (errorCount > 0 ? 'bg-amber-500 text-white' : 'bg-green-500 text-white') 
                : 'bg-red-500 text-white'
            }`}>
              {finalSuccess 
                ? (errorCount > 0 ? <AlertTriangle size={32} /> : <CheckCircle size={32} />) 
                : <XCircle size={32} />
              }
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">
                {finalSuccess 
                  ? (errorCount > 0 ? 'Proceso Finalizado con Alertas' : '¡Importación Masiva Exitosa!') 
                  : 'Fallo Crítico en la Importación'}
              </h3>
              <p className="text-gray-600 font-medium">
                {message || (finalSuccess 
                  ? `Se procesaron ${totalRows.toLocaleString()} registros correctamente.` 
                  : 'El servidor no pudo completar la operación masiva.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Estadísticas de Negocio */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow text-center">
          <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="text-3xl font-black text-gray-900">{lotsCreated.toLocaleString()}</div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Lotes de Inventario</p>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow text-center">
          <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-3xl font-black text-gray-900">{productsCreated.toLocaleString()}</div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Nuevos Catálogos</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow text-center">
          <Building className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="text-3xl font-black text-gray-900">{manufacturersCreated.toLocaleString()}</div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Fabricantes</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow text-center">
          <FilterX className="h-6 w-6 text-orange-500 mx-auto mb-2" />
          <div className="text-3xl font-black text-orange-500">{errorCount.toLocaleString()}</div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Filas Omitidas</p>
        </div>
      </div>

      {/* Sección de Errores y Advertencias */}
      {errorCount > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h4 className="font-bold text-gray-800 text-sm">Detalle de Filas No Importadas</h4>
            </div>
            {onDownloadErrors && (
              <button 
                onClick={onDownloadErrors}
                className="flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={14} />
                <span>Exportar Log de Errores</span>
              </button>
            )}
          </div>
          
          <div className="p-4 max-h-72 overflow-y-auto space-y-2">
            {errorList.slice(0, 100).map((err: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-gray-400 w-16">FILA #{err.row || err.row_index || '?'}</span>
                  <span className="font-semibold text-gray-700">{formatError(err)}</span>
                </div>
                {err.sku && <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-mono text-gray-600">SKU: {err.sku}</span>}
              </div>
            ))}
            {errorCount > 100 && (
              <div className="text-center py-4 text-gray-400 text-sm italic font-medium">
                ... y {errorCount - 100} errores más. Descarga el reporte para ver la lista completa.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer de Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t gap-4">
        <div className="flex items-center text-gray-400 text-xs font-medium uppercase tracking-tighter">
          <History size={14} className="mr-2" />
          Procesado el {progressData.updated_at ? new Date(progressData.updated_at).toLocaleString('es-MX') : '—'}
        </div>
        
        <div className="flex space-x-4 w-full sm:w-auto">
          {onNewImport && (
            <button 
              onClick={onNewImport}
              className="flex-1 sm:flex-none flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Nueva Importación <ArrowRight size={18} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};