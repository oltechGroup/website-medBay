'use client';

import { Search } from 'lucide-react';

interface ManufacturerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
}

export const ManufacturerFilters = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit
}: ManufacturerFiltersProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Barra de Búsqueda */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar fabricantes por nombre..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Información de Búsqueda */}
      {searchTerm && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Mostrando resultados para: <strong>"{searchTerm}"</strong>
          </p>
        </div>
      )}
    </div>
  );
};