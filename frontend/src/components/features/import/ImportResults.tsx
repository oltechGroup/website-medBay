//frontend/src/components/features/import/ImportResults.tsx

'use client';

import React from 'react';
import { CheckCircle, XCircle, Package, Users, Building, AlertTriangle, FileText, Download, Layers, FilterX } from 'lucide-react';
import { ImportProgress as ImportProgressType } from '@/hooks/useImport';

interface ImportResultsProps {
  progressData: ImportProgressType;
  importResults?: { success: boolean; message: string; results?: any };
  onRetry?: () => void;
  onNewImport?: () => void;
  onDownloadErrors?: () => void;
}

export const ImportResults: React.FC<ImportResultsProps> = ({ progressData, importResults, onRetry, onNewImport, onDownloadErrors }) => {
  const { success, message, results } = importResults || {};
  const finalSuccess = success ?? (progressData.status === 'completed' || progressData.status === 'finished');
  
  const errorList = progressData.error_messages?.errors || [];
  const errorCount = errorList.length;
  
  const stats: any = progressData.error_messages?.stats || {};
  const lotsCreated = stats.created_lots || 0;
  const productsCreated = stats.created_products || 0;
  const manufacturersCreated = stats.created_manufacturers || 0;
  const mergedRows = stats.merged_rows || 0;
  const skippedRows = stats.skipped_rows || 0;

  const totalRows = progressData.total_rows || 0;
  const percentage = 100;

  let finalMessage = message;
  if (!finalMessage) {
    if (finalSuccess) {
       if (mergedRows > 0) finalMessage = `¡Completado! Se consolidaron ${mergedRows} filas repetidas.`;
       else finalMessage = '¡Importación completada exitosamente!';
    } else if (progressData.status === 'completed_with_errors') finalMessage = 'Importación finalizada con advertencias';
    else finalMessage = 'Hubo problemas durante la importación';
  }

  const formatError = (error: any): string => {
    let msg = typeof error === 'string' ? error : (error.fatal_error || error.message || 'Error desconocido');
    if (msg.includes('Fila omitida:')) return msg.replace('Fila omitida:', '').trim();
    if (msg.includes('unique constraint') || msg.includes('ON CONFLICT')) return 'Registro duplicado (ya existe)';
    return msg;
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-6 ${finalSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center space-x-3">
          {finalSuccess ? <CheckCircle className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-red-600" />}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${finalSuccess ? 'text-green-900' : 'text-red-900'}`}>
              {finalSuccess ? (errorCount > 0 ? '⚠️ Completado con Observaciones' : '✅ ¡Importación Exitosa!') : '❌ Error en la Importación'}
            </h3>
            <p className={finalSuccess ? 'text-green-700' : 'text-red-700'}>{finalMessage}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
            <div className="text-sm text-gray-600">{totalRows} filas leídas</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2"><Package className="h-5 w-5 text-green-600" /><span className="text-sm font-medium text-gray-700">Lotes</span></div>
          <div className="text-2xl font-bold text-green-600">{lotsCreated}</div>
          <p className="text-xs text-gray-500">creados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2"><Users className="h-5 w-5 text-blue-600" /><span className="text-sm font-medium text-gray-700">Productos</span></div>
          <div className="text-2xl font-bold text-blue-600">{productsCreated}</div>
          <p className="text-xs text-gray-500">nuevos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2"><Building className="h-5 w-5 text-purple-600" /><span className="text-sm font-medium text-gray-700">Fabricantes</span></div>
          <div className="text-2xl font-bold text-purple-600">{manufacturersCreated}</div>
          <p className="text-xs text-gray-500">nuevos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2"><Layers className="h-5 w-5 text-gray-600" /><span className="text-sm font-medium text-gray-700">Unificadas</span></div>
          <div className="text-2xl font-bold text-gray-600">{mergedRows}</div>
          <p className="text-xs text-gray-500">filas repetidas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2"><FileText className="h-5 w-5 text-blue-500" /><span className="text-sm font-medium text-gray-700">Leídas Total</span></div>
            <div className="text-2xl font-bold text-blue-500">{totalRows}</div>
         </div>
         <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2"><FilterX className="h-5 w-5 text-orange-500" /><span className="text-sm font-medium text-gray-700">Omitidas/Errores</span></div>
            <div className="text-2xl font-bold text-orange-500">{errorCount}</div>
         </div>
      </div>

      {errorList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">{errorList.length} Filas requieren atención</h4>
                <p className="text-sm text-amber-700 mt-1">Estas filas no se importaron (faltan datos obligatorios o formato inválido).</p>
              </div>
            </div>
            {onDownloadErrors && (
              <button onClick={onDownloadErrors} className="flex items-center space-x-2 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors">
                <Download className="h-4 w-4" /><span>Descargar Reporte</span>
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errorList.slice(0, 50).map((error: any, index: number) => (
              <div key={index} className="text-sm bg-amber-100 rounded px-3 py-2">
                <div className="font-medium text-amber-800">Fila Excel #{error.row_index || '?'}: <span className="font-normal text-amber-900">{formatError(error)}</span></div>
              </div>
            ))}
            {errorList.length > 50 && <div className="text-center text-amber-600 text-sm py-2">... y {errorList.length - 50} más</div>}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">{progressData.updated_at && <>Completado el {new Date(progressData.updated_at).toLocaleString()}</>}</div>
        <div className="flex space-x-3">
          {onNewImport && <button onClick={onNewImport} className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Nueva Importación</button>}
        </div>
      </div>
    </div>
  );
};