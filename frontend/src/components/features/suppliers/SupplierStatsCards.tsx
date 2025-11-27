'use client';

import { Building, Globe, Activity, Archive } from 'lucide-react';

interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  byCountry: Array<{
    country_code: string;
    country_name: string;
    supplier_count: number;
  }>;
}

interface SupplierStatsCardsProps {
  stats?: SupplierStats;
  isLoading?: boolean;
}

export default function SupplierStatsCards({ stats, isLoading }: SupplierStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-6 h-24"></div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-center text-gray-500">
              Sin datos disponibles
            </div>
          </div>
        ))}
      </div>
    );
  }

  const topCountry = stats.byCountry.length > 0 ? stats.byCountry[0] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Proveedores */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Todos los registros</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Proveedores Activos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Activos</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% del total` : 'Sin datos'}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Proveedores Inactivos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Inactivos</p>
            <p className="text-2xl font-bold text-amber-600">{stats.inactive}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? `${Math.round((stats.inactive / stats.total) * 100)}% del total` : 'Sin datos'}
            </p>
          </div>
          <div className="p-3 bg-amber-100 rounded-xl">
            <Archive className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* País Principal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">País Principal</p>
            <p className="text-2xl font-bold text-purple-600">
              {topCountry ? topCountry.supplier_count : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {topCountry ? topCountry.country_name : 'Sin datos'}
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-xl">
            <Globe className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}