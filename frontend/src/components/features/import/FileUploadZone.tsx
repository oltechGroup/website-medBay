'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  acceptedFormats?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  isUploading = false,
  acceptedFormats = '.xlsx, .xls, .csv'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const isValidFileType = (file: File): boolean => {
    const acceptedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/csv'
    ];
    return acceptedTypes.includes(file.type) || 
           file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls') || 
           file.name.endsWith('.csv');
  };

  const removeFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Zona de Drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInput}
          disabled={isUploading}
          className="hidden"
        />
        
        <div className="space-y-3">
          <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-900">
              {selectedFile ? 'Archivo seleccionado' : 'Arrastra tu archivo aquí'}
            </p>
            <p className="text-sm text-gray-600">
              {selectedFile 
                ? `Listo para procesar: ${selectedFile.name}`
                : `O haz clic para seleccionar (${acceptedFormats})`
              }
            </p>
          </div>

          {!selectedFile && (
            <button
              type="button"
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              Seleccionar Archivo
            </button>
          )}
        </div>
      </div>

      {/* Archivo Seleccionado */}
      {selectedFile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{selectedFile.name}</p>
                <p className="text-sm text-green-700">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Excel/CSV'}
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Estado de Carga */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-medium text-blue-900">Subiendo archivo...</p>
              <p className="text-sm text-blue-700">Procesando, por favor espera.</p>
            </div>
          </div>
        </div>
      )}

      {/* Información de Formatos */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Formatos soportados:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Excel</strong> (.xlsx, .xls) - Hasta 10MB</li>
          <li>• <strong>CSV</strong> (.csv) - Hasta 10MB</li>
        </ul>
      </div>
    </div>
  );
};