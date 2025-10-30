'use client';

import React from 'react';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportProgressProps {
  currentStep?: number;
  totalSteps?: number;
  status?: 'uploading' | 'mapping' | 'processing' | 'complete' | 'error';
  message?: string;
}

const STEPS = [
  { key: 'uploading', label: 'Subiendo archivo', description: 'Procesando el archivo Excel' },
  { key: 'mapping', label: 'Mapeando columnas', description: 'Asignando campos del sistema' },
  { key: 'processing', label: 'Procesando datos', description: 'Creando productos y lotes' },
  { key: 'complete', label: 'Completado', description: 'Importación finalizada' },
];

export const ImportProgress: React.FC<ImportProgressProps> = ({
  currentStep = 2,
  totalSteps = 4,
  status = 'processing',
  message = 'Procesando tu importación...',
}) => {
  const getStepIndex = (stepKey: string) => {
    return STEPS.findIndex(step => step.key === stepKey);
  };

  const currentStepIndex = getStepIndex(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Procesando Importación</h3>
        <p className="text-gray-600 mt-1">{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border rounded-lg p-6">
        <div className="space-y-4">
          {/* Progress Line */}
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-600 transform -translate-y-1/2 transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            ></div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-4 gap-4">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.key} className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-green-100 border-green-500 text-green-600'
                      : isCurrent
                      ? 'bg-blue-100 border-blue-500 text-blue-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isCurrent ? (
                      <Loader className="h-5 w-5 animate-spin" />
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

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <Loader className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {status === 'uploading' && 'Subiendo y analizando archivo...'}
                {status === 'mapping' && 'Preparando interfaz de mapeo...'}
                {status === 'processing' && 'Creando productos y actualizando inventario...'}
                {status === 'complete' && 'Proceso completado exitosamente'}
              </p>
              <p className="text-sm text-blue-700">
                {status === 'processing' && 'Esto puede tomar unos momentos dependiendo del tamaño del archivo.'}
                {status === 'complete' && 'Los datos han sido importados correctamente.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">No cierres esta ventana</h4>
            <p className="text-sm text-amber-700 mt-1">
              El proceso se cancelará si cierras o actualizas la página. Los cambios se guardarán automáticamente cuando termine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};