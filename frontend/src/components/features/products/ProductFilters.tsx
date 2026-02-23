// frontend/src/components/features/products/ProductFilters.tsx

'use client';

import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useManufacturers } from '@/hooks/useManufacturers';

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFiltersState) => void;
  searchPlaceholder?: string;
  className?: string;
}

export interface ProductFiltersState {
  searchTerm: string;
  hasImages: 'all' | 'with' | 'without';
  manufacturerId: string;
  categoryId: string;
}

export const ProductFilters = ({ 
  onFiltersChange, 
  searchPlaceholder = "Search products by description, SKU or manufacturer...", 
  className = "" 
}: ProductFiltersProps) => {
  const { categories } = useCategories();
  const { manufacturers } = useManufacturers();
  
  const [filters, setFilters] = useState<ProductFiltersState>({
    searchTerm: '',
    hasImages: 'all',
    manufacturerId: '',
    categoryId: ''
  });

  // Debounce for filters
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof ProductFiltersState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    const resetFilters: ProductFiltersState = {
      searchTerm: '',
      hasImages: 'all',
      manufacturerId: '',
      categoryId: ''
    };
    setFilters(resetFilters);
  };

  const hasActiveFilters = 
    filters.searchTerm || 
    filters.hasImages !== 'all' || 
    filters.manufacturerId || 
    filters.categoryId;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
      {/* IMPROVEMENT: More spaced and organized layout */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        {/* Main Search - Wider */}
        <div className="flex-1 min-w-0">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder={searchPlaceholder}
            />
          </div>
        </div>

        {/* IMPROVEMENT: Grid filters with more spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-w-0">
          {/* Image Filter */}
          <div className="min-w-0">
            <label htmlFor="hasImages" className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <select
              id="hasImages"
              value={filters.hasImages}
              onChange={(e) => handleFilterChange('hasImages', e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
            >
              <option value="all">All images</option>
              <option value="with">With images</option>
              <option value="without">Without images</option>
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div className="min-w-0">
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturer
            </label>
            <select
              id="manufacturer"
              value={filters.manufacturerId}
              onChange={(e) => handleFilterChange('manufacturerId', e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
            >
              <option value="">All manufacturers</option>
              {manufacturers.map(manufacturer => (
                <option key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="min-w-0">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
            >
              <option value="">All categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          <div className="flex items-end min-w-0">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="mr-1.5 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.searchTerm && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{filters.searchTerm}"
              <button
                onClick={() => handleFilterChange('searchTerm', '')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none"
              >
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.hasImages === 'with' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              With images
              <button
                onClick={() => handleFilterChange('hasImages', 'all')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200 focus:outline-none"
              >
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.hasImages === 'without' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Without images
              <button
                onClick={() => handleFilterChange('hasImages', 'all')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-orange-200 focus:outline-none"
              >
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.manufacturerId && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Manufacturer: {manufacturers.find(m => m.id === filters.manufacturerId)?.name}
              <button
                onClick={() => handleFilterChange('manufacturerId', '')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200 focus:outline-none"
              >
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.categoryId && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Category: {categories.find(c => c.id === filters.categoryId)?.name}
              <button
                onClick={() => handleFilterChange('categoryId', '')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 focus:outline-none"
              >
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};