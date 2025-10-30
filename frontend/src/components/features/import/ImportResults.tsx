'use client';

import React from 'react';
import { CheckCircle, XCircle, Package, Users, Building, AlertTriangle } from 'lucide-react';

interface ImportResultsProps {
  results: {
    success: boolean;
    message: string;
    stats?: {
      manufacturers_created: number;
      products_created: number;
      lots_created: number;
      errors: string[];
    };
  };
  onRetry?: () => void;
  onNewImport?: () => void;
}

export const ImportResults: React.FC<ImportResultsProps> = ({
  results,
  onRetry,
  onNewImport,
}) => {
  const { success, message, stats } = results;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg p-6 ${
        success 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {success ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${
              success ? 'text-green-900' : 'text-red-900'
            }`}>
              {success ? '¡Importación Completada!' : 'Error en la Importación'}
            </h3>
            <p className={success ? 'text-green-700' : 'text-red-700'}>
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fabricantes Creados */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Fabricantes</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.manufacturers_created}</div>
            <p className="text-xs text-gray-500">nuevos creados</p>
          </div>

          {/* Productos Creados */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Productos</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.products_created}</div>
            <p className="text-xs text-gray-500">nuevos creados</p>
          </div>

          {/* Lotes Creados */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Lotes</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.lots_created}</div>
            <p className="text-xs text-gray-500">nuevos creados</p>
          </div>
        </div>
      )}

      {/* Errors */}
      {stats?.errors && stats.errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-900 mb-2">
                Se encontraron {stats.errors.length} error(es)
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {stats.errors.map((error, index) => (
                  <div key={index} className="text-sm text-amber-700 bg-amber-100 rounded px-3 py-2">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {!success && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reintentar
          </button>
        )}
        
        <button
          onClick={onNewImport}
          className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Nueva Importación
        </button>
      </div>

      {/* Next Steps */}
      {success && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Próximos pasos:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Revisa el inventario para ver los productos importados</li>
            <li>• Verifica que los precios y cantidades sean correctos</li>
            <li>• Ajusta cualquier información adicional necesaria</li>
          </ul>
        </div>
      )}
    </div>
  );
};