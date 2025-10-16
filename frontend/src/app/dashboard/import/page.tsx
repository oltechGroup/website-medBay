"use client"; // AGREGAR ESTA LÍNEA AL INICIO

import { useState } from 'react';
import { FileUploadZone } from '@/components/features/import/FileUploadZone';
import { ColumnMapper } from '@/components/features/import/ColumnMapper';
import { ImportProgress } from '@/components/features/import/ImportProgress';
import { ImportResults } from '@/components/features/import/ImportResults';
import { useExcelImport } from '@/hooks/useExcelImport';

export default function ImportPage() {
  const {
    file,
    setFile,
    excelData,
    columnMapping,
    setColumnMapping,
    importProgress,
    importResults,
    isImporting,
    handleImport,
    resetImport,
    validationErrors
  } = useExcelImport();

  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'importing' | 'results'>('upload');

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setCurrentStep('mapping');
  };

  const handleStartImport = async () => {
    setCurrentStep('importing');
    await handleImport();
    setCurrentStep('results');
  };

  const handleNewImport = () => {
    resetImport();
    setCurrentStep('upload');
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Importar Productos desde Excel</h1>
        <p className="text-gray-600 mt-2">
          Sube un archivo Excel o CSV y mapea las columnas con los campos del sistema
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {['upload', 'mapping', 'importing', 'results'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : index < ['upload', 'mapping', 'importing', 'results'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`w-24 h-1 mx-2 ${
                    index < ['upload', 'mapping', 'importing', 'results'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Subir Archivo</span>
          <span>Mapear Columnas</span>
          <span>Importar</span>
          <span>Resultados</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentStep === 'upload' && (
          <FileUploadZone onFileUpload={handleFileUpload} />
        )}

        {currentStep === 'mapping' && file && excelData && (
          <div>
            <ColumnMapper
              file={file}
              excelData={excelData}
              columnMapping={columnMapping}
              onMappingChange={setColumnMapping}
              validationErrors={validationErrors}
            />
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={handleStartImport}
                disabled={!columnMapping || Object.keys(columnMapping).length === 0 || validationErrors.length > 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Iniciar Importación
              </button>
            </div>
          </div>
        )}

        {currentStep === 'importing' && (
          <ImportProgress progress={importProgress} />
        )}

        {currentStep === 'results' && importResults && (
          <ImportResults 
            results={importResults} 
            onNewImport={handleNewImport}
          />
        )}
      </div>
    </div>
  );
}