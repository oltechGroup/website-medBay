'use client';

import React, { useEffect, useState } from 'react';
import { Loader, CheckCircle, AlertCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { useImport, type ImportProgress as ImportProgressType } from '@/hooks/useImport';

interface ImportProgressProps {
  uploadId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

// PASOS ACTUALIZADOS para coincidir con el backend real
const STEPS = [
  { key: 'uploaded', label: 'Archivo Subido', description: 'Archivo cargado y verificado' },
  { key: 'processing', label: 'Procesando Datos', description: 'Creando productos y lotes' },
  { key: 'completed', label: 'Completado', description: 'Importación finalizada' },
  { key: 'completed_with_errors', label: 'Completado con Errores', description: 'Importación finalizada con advertencias' },
];

export const ImportProgress: React.FC<ImportProgressProps> = ({
  uploadId,
  onComplete,
  onError,
}) => {
  const { getImportProgress } = useImport();
  const [progress, setProgress] = useState<ImportProgressType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formatear tiempo estimado
  const formatEstimatedTime = (seconds: number): string => {
    if (seconds <= 0) return 'Completando...';
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };

  // Calcular estadísticas desde los datos reales
  const calculateStats = (progressData: ImportProgressType) => {
    const totalRows = progressData.total_rows || 0;
    const processedRows = progressData.processed_rows || 0;
    
    // En el backend, los errores vienen en error_messages array
    const errorCount = progressData.error_messages?.length || 0;
    const successCount = Math.max(0, processedRows - errorCount);
    
    return { totalRows, processedRows, errorCount, successCount };
  };

  // Polling para progreso real - CORREGIDO
  useEffect(() => {
    if (!uploadId) {
      setError('ID de upload no proporcionado');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let pollingInterval: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        const progressData = await getImportProgress(uploadId);
        
        if (!isMounted) return;

        if (progressData) {
          setProgress(progressData);
          setError(null);
          
          // Manejar estados finales
          if (progressData.status === 'completed' || progressData.status === 'completed_with_errors') {
            onComplete?.(progressData);
            clearInterval(pollingInterval);
          } else if (progressData.status === 'error') {
            const errorMessage = progressData.error_messages?.[0]?.fatal_error || 
                               progressData.error_messages?.[0]?.error || 
                               'Error en la importación';
            setError(errorMessage);
            onError?.(errorMessage);
            clearInterval(pollingInterval);
          }
        } else {
          setError('No se pudo obtener el progreso de la importación');
        }
        
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching progress:', err);
        setError('Error al conectar con el servidor');
        setLoading(false);
      }
    };

    // Iniciar polling cada 2 segundos
    pollingInterval = setInterval(fetchProgress, 2000);
    fetchProgress(); // Llamada inicial

    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
    };
  }, [uploadId, getImportProgress, onComplete, onError]);

  // Estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando progreso...</span>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Sin datos de progreso
  if (!progress) {
    return (
      <div className="text-center p-8 text-yellow-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>No hay información de progreso disponible.</p>
      </div>
    );
  }

  // Calcular estadísticas actuales
  const { totalRows, processedRows, errorCount, successCount } = calculateStats(progress);
  const currentStepIndex = STEPS.findIndex(step => step.key === progress.status);
  const isError = progress.status === 'error';
  const isCompletedWithErrors = progress.status === 'completed_with_errors';
  const isFinalState = isError || isCompletedWithErrors || progress.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {isError && '❌ Error en Importación'}
          {isCompletedWithErrors && '⚠️ Importación Completada con Errores'}
          {progress.status === 'completed' && '✅ Importación Completada'}
          {progress.status === 'processing' && '🔄 Procesando Importación'}
          {progress.status === 'uploaded' && '📤 Archivo Listo para Procesar'}
        </h3>
        <p className="text-gray-600 mt-1">
          {progress.current_operation || 'Procesando tu importación...'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border rounded-lg p-6">
        <div className="space-y-4">
          {/* Progress Line */}
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2"></div>
            <div 
              className="absolute top-1/2 left-0 h-2 bg-blue-600 rounded-full transform -translate-y-1/2 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>

          {/* Steps - Solo mostrar pasos relevantes */}
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;
              const showStep = index <= currentStepIndex || isPending;

              if (!showStep) return null;

              return (
                <div key={step.key} className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-green-100 border-green-500 text-green-600'
                      : isCurrent
                      ? 'bg-blue-100 border-blue-500 text-blue-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  } ${isError && isCurrent ? 'bg-red-100 border-red-500 text-red-600' : ''}`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isCurrent ? (
                      isError ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <Loader className="h-5 w-5 animate-spin" />
                      )
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className={`text-xs font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estadísticas en Tiempo Real */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <FileText className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-700">
              {processedRows}/{totalRows}
            </div>
            <div className="text-xs text-blue-600">Filas Procesadas</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-700">
              {successCount}
            </div>
            <div className="text-xs text-green-600">Éxitos</div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-700">
              {errorCount}
            </div>
            <div className="text-xs text-red-600">Errores</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <Clock className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-purple-700">
              {progress.percentage}%
            </div>
            <div className="text-xs text-purple-600">Progreso</div>
          </div>
        </div>

        {/* Información Adicional */}
        {progress.estimated_time_remaining > 0 && !isFinalState && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center space-x-2 text-amber-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                Tiempo estimado: {formatEstimatedTime(progress.estimated_time_remaining)}
              </span>
            </div>
          </div>
        )}

        {/* Mostrar errores si existen */}
        {progress.error_messages && progress.error_messages.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-2 text-red-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2">
                  {progress.error_messages.length} error{progress.error_messages.length > 1 ? 'es' : ''} encontrado{progress.error_messages.length > 1 ? 's' : ''}:
                </h4>
                <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                  {progress.error_messages.slice(0, 5).map((errorMsg, index) => (
                    <div key={index} className="bg-red-100 p-2 rounded text-red-700">
                      {errorMsg.fatal_error || errorMsg.error || errorMsg.chunk_error || 'Error desconocido'}
                      {errorMsg.row_index && ` (Fila ${errorMsg.row_index})`}
                    </div>
                  ))}
                  {progress.error_messages.length > 5 && (
                    <div className="text-red-600 text-xs">
                      ... y {progress.error_messages.length - 5} errores más
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de finalización */}
        {isFinalState && (
          <div className={`mt-4 p-3 rounded-lg border ${
            isError 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : isCompletedWithErrors
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              {isError ? (
                <AlertCircle className="h-4 w-4" />
              ) : isCompletedWithErrors ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isError && 'Importación fallida'}
                {isCompletedWithErrors && 'Importación completada con advertencias'}
                {progress.status === 'completed' && '¡Importación completada exitosamente!'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tips - Solo mostrar si está procesando */}
      {!isFinalState && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">No cierres esta ventana</h4>
              <p className="text-sm text-amber-700 mt-1">
                El proceso se cancelará si cierras o actualizas la página. 
                Los datos se guardarán automáticamente cuando termine la importación.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};