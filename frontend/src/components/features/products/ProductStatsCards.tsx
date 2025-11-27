// frontend/src/components/features/products/ProductStatsCards.tsx

'use client';

import { useProducts } from '@/hooks/useProducts';

export const ProductStatsCards = () => {
  // ✅ CORRECCIÓN: Llamar useProducts UNA sola vez
  const { stats: statistics, isLoading } = useProducts();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Estado sin datos
  if (!statistics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
        <p className="text-yellow-600">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const { 
    total_products, 
    products_with_images, 
    products_without_images 
  } = statistics;

  // Cálculos seguros
  const withImagesPercentage = total_products > 0 
    ? Math.round((products_with_images / total_products) * 100)
    : 0;

  const withoutImagesPercentage = total_products > 0
    ? Math.round((products_without_images / total_products) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total de Productos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Productos</p>
            <p className="text-2xl font-bold text-gray-900">{total_products}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Productos con Imágenes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Con Imágenes</p>
            <p className="text-2xl font-bold text-gray-900">{products_with_images}</p>
            <p className="text-xs text-gray-500 mt-1">
              {withImagesPercentage}% del total
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Productos sin Imágenes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Sin Imágenes</p>
            <p className="text-2xl font-bold text-gray-900">{products_without_images}</p>
            <p className="text-xs text-gray-500 mt-1">
              {withoutImagesPercentage}% del total
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-xl">
            <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};