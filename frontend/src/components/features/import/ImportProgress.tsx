"use client";

import { Loader2 } from 'lucide-react';

interface ImportProgressProps {
  progress: {
    current: number;
    total: number;
    status: string;
  } | null;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ progress }) => {
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="text-center py-8">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Importando Productos</h3>
      <p className="text-gray-600 mb-4">{progress?.status || 'Procesando...'}</p>
      
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="text-sm text-gray-600">
        {progress?.current || 0} de {progress?.total || 0} productos procesados ({percentage}%)
      </div>
    </div>
  );
};