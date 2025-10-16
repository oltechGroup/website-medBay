'use client';

import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ProductFiltersProps {
  filters: {
    search: string;
    category: string;
    manufacturer: string;
  };
  onSearch: (searchTerm: string) => void;
  onFilterChange: (key: string, value: string) => void;
}

export default function ProductFilters({
  filters,
  onSearch,
  onFilterChange,
}: ProductFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <Input
            label="Buscar productos"
            placeholder="Nombre, SKU o descripción..."
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>

        {/* Filtro por categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas</option>
            <option value="medicamentos">Medicamentos</option>
            <option value="equipo-medico">Equipo Médico</option>
            <option value="desechables">Desechables</option>
          </select>
        </div>

        {/* Filtro por fabricante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fabricante
          </label>
          <select
            value={filters.manufacturer}
            onChange={(e) => onFilterChange('manufacturer', e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="pfizer">Pfizer</option>
            <option value="johnson-johnson">Johnson & Johnson</option>
            <option value="roche">Roche</option>
          </select>
        </div>
      </div>

      {/* Botones de acción de filtros */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Filtros activos: {[filters.search, filters.category, filters.manufacturer].filter(Boolean).length}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSearch('');
            onFilterChange('category', '');
            onFilterChange('manufacturer', '');
          }}
        >
          Limpiar Filtros
        </Button>
      </div>
    </div>
  );
}