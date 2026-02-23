//frontend/src/components/features/suppliers/SupplierFilters.tsx
'use client';

import { Search, Filter } from 'lucide-react';
import Input from '@/components/ui/Input';
import { useCountriesBasic } from '@/hooks/useCountries';

interface SupplierFiltersProps {
  filters: {
    search: string;
    country: string;
    status: string;
  };
  onSearch: (search: string) => void;
  onFilterChange: (key: string, value: string) => void;
}

export default function SupplierFilters({ filters, onSearch, onFilterChange }: SupplierFiltersProps) {
  const { data: countries, isLoading: isLoadingCountries } = useCountriesBasic();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search by name */}
        <div className="md:col-span-2">
          <Input
            label="Search Suppliers"
            placeholder="Search by name, contact, address..."
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>

        {/* Filter by country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={filters.country}
            onChange={(e) => onFilterChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            <option value="">All Countries</option>
            {isLoadingCountries ? (
              <option value="" disabled>Loading countries...</option>
            ) : (
              countries?.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Filter by status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}