import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    // También validar por extensión por si el tipo MIME no está disponible
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Por favor, sube un archivo Excel (.xlsx, .xls) o CSV');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('El archivo no puede ser mayor a 10MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Arrastra tu archivo aquí
            </h3>
            <p className="text-gray-600">
              o haz clic para seleccionar un archivo
            </p>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Formatos soportados: .xlsx, .xls, .csv</span>
            </div>
            <div>Tamaño máximo: 10MB</div>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={handleFileInput}
            />
            <span className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Seleccionar Archivo
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};