'use client';

import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  Users, 
  Building, 
  AlertTriangle,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { ImportProgress as ImportProgressType } from '@/hooks/useImport';

interface ImportResultsProps {
  progressData: ImportProgressType;
  importResults?: {
    success: boolean;
    message: string;
    results?: {
      total_rows: number;
      successful_lots: number;
      errors_count: number;
      errors: any[];
      details?: {
        lots_created: number;
        products_created: number;
        manufacturers_created: number;
        currency_conversions?: number;
      };
    };
  };
  onRetry?: () => void;
  onNewImport?: () => void;
  onDownloadErrors?: () => void;
}

export const ImportResults: React.FC<ImportResultsProps> = ({
  progressData,
  importResults,
  onRetry,
  onNewImport,
  onDownloadErrors,
}) => {
  const { success, message, results } = importResults || {};
  
  // Usar datos del progreso si no hay resultados específicos
  const finalSuccess = success ?? (progressData.status === 'completed');
  const finalMessage = message ?? (progressData.status === 'completed' 
    ? '¡Importación completada exitosamente!' 
    : progressData.status === 'completed_with_errors'
    ? 'Importación completada con algunos errores'
    : 'Error en la importación'
  );

  // Calcular estadísticas desde el progreso real
  const totalRows = progressData.total_rows || 0;
  const processedRows = progressData.processed_rows || 0;
  const errorCount = progressData.error_messages?.length || 0;
  const successCount = Math.max(0, processedRows - errorCount);
  
  // Extraer detalles de los resultados si existen
  const details = results?.details;
  const lotsCreated = details?.lots_created || results?.successful_lots || 0;
  const productsCreated = details?.products_created || 0;
  const manufacturersCreated = details?.manufacturers_created || 0;
  const currencyConversions = details?.currency_conversions || 0;

  // Combinar errores de progreso y resultados
  const allErrors = [
    ...(progressData.error_messages || []),
    ...(results?.errors || [])
  ];

  // Formatear errores para mostrar
  const formatError = (error: any): string => {
    if (typeof error === 'string') return error;
    return error.fatal_error || error.error || error.chunk_error || 
           `Error en fila ${error.row_index}` || 'Error desconocido';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg p-6 ${
        finalSuccess 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {finalSuccess ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${
              finalSuccess ? 'text-green-900' : 'text-red-900'
            }`}>
              {finalSuccess 
                ? (progressData.status === 'completed_with_errors' 
                    ? '⚠️ Importación Completada con Errores' 
                    : '✅ ¡Importación Completada!')
                : '❌ Error en la Importación'
              }
            </h3>
            <p className={finalSuccess ? 'text-green-700' : 'text-red-700'}>
              {finalMessage}
            </p>
          </div>
          {progressData.percentage > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {progressData.percentage}%
              </div>
              <div className="text-sm text-gray-600">
                {processedRows}/{totalRows} filas
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Filas Procesadas */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Filas</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{processedRows}</div>
          <p className="text-xs text-gray-500">de {totalRows} procesadas</p>
        </div>

        {/* Lotes Creados */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Package className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Lotes</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{lotsCreated}</div>
          <p className="text-xs text-gray-500">creados</p>
        </div>

        {/* Productos Creados */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Productos</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{productsCreated}</div>
          <p className="text-xs text-gray-500">creados</p>
        </div>

        {/* Fabricantes Creados */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Building className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Fabricantes</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{manufacturersCreated}</div>
          <p className="text-xs text-gray-500">creados</p>
        </div>
      </div>

      {/* Estadísticas Secundarias */}
      <div className="grid grid-cols-2 gap-4">
        {/* Conversiones Monetarias */}
        {currencyConversions > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Conversiones Monetarias</span>
            </div>
            <div className="text-lg font-bold text-blue-700 mt-1">
              {currencyConversions} precios convertidos a USD
            </div>
          </div>
        )}

        {/* Resumen de Resultados */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Éxitos:</span>
            <span className="font-medium text-green-600">{successCount}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Errores:</span>
            <span className={`font-medium ${errorCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {errorCount}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Tasa de éxito:</span>
            <span className="font-medium text-blue-600">
              {processedRows > 0 ? Math.round((successCount / processedRows) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Errores Detallados */}
      {allErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">
                  Se encontraron {allErrors.length} error(es)
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Revisa los detalles a continuación y considera reintentar la importación.
                </p>
              </div>
            </div>
            {onDownloadErrors && (
              <button
                onClick={onDownloadErrors}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Descargar Errores</span>
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allErrors.slice(0, 20).map((error, index) => (
              <div key={index} className="text-sm bg-amber-100 rounded px-3 py-2">
                <div className="font-medium text-amber-800">
                  {error.row_index ? `Fila ${error.row_index}: ` : ''}
                  {formatError(error)}
                </div>
                {error.data && (
                  <div className="text-xs text-amber-600 mt-1">
                    Datos: {JSON.stringify(error.data)}
                  </div>
                )}
              </div>
            ))}
            {allErrors.length > 20 && (
              <div className="text-center text-amber-600 text-sm py-2">
                ... y {allErrors.length - 20} errores más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          {progressData.updated_at && (
            <>Completado el {new Date(progressData.updated_at).toLocaleString()}</>
          )}
        </div>
        
        <div className="flex space-x-3">
          {!finalSuccess && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reintentar</span>
            </button>
          )}
          
          <button
            onClick={onNewImport}
            className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nueva Importación
          </button>
        </div>
      </div>

      {/* Próximos Pasos - Solo si fue exitoso */}
      {finalSuccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Próximos pasos:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Revisa el inventario</strong> para ver los productos importados</li>
            <li>• <strong>Verifica precios y cantidades</strong> en el módulo de productos</li>
            <li>• <strong>Revisa las imágenes</strong> de los productos si se incluyeron</li>
            <li>• <strong>Ajusta información adicional</strong> según sea necesario</li>
            {errorCount > 0 && (
              <li>• <strong>Revisa los errores</strong> y considera corregir el archivo original</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};