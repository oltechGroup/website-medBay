'use client';

import { Factory, TrendingUp } from 'lucide-react';

interface ManufacturerStatsCardsProps {
  totalCount: number;
  isLoading?: boolean;
}

export const ManufacturerStatsCards = ({ totalCount, isLoading }: ManufacturerStatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Total de Fabricantes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total de Fabricantes</p>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-1">Registrados en el sistema</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Factory className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Estado del Sistema */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Estado del Sistema</p>
            <p className="text-2xl font-bold text-green-600">Activo</p>
            <p className="text-xs text-gray-500 mt-1">Todos los sistemas operativos</p>
          </div>
          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
};