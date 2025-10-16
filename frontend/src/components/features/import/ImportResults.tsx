"use client";

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ImportResultsProps {
  results: {
    success: number;
    errors: number;
    details: {
      success: any[];
      errors: Array<{
        row: number;
        error: string;
        data: any;
      }>;
    };
  };
  onNewImport: () => void;
}

export const ImportResults: React.FC<ImportResultsProps> = ({ results, onNewImport }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Importación Completada</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{results.success}</div>
            <div className="text-green-700">Éxitos</div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{results.errors}</div>
            <div className="text-red-700">Errores</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{results.success + results.errors}</div>
            <div className="text-blue-700">Total</div>
          </div>
        </div>
      </div>

      {results.errors > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalles de Errores</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.details.errors.slice(0, 10).map((error, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{error.row}</td>
                    <td className="px-4 py-2 text-sm text-red-600">{error.error}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <pre className="text-xs">{JSON.stringify(error.data, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.details.errors.length > 10 && (
              <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500">
                Mostrando 10 de {results.details.errors.length} errores
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onNewImport}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Realizar Nueva Importación
        </button>
      </div>
    </div>
  );
};