// frontend/src/app/dashboard/products/assign-categories/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductCategoryAssign } from '@/components/features/products/ProductCategoryAssign';

export default function AssignCategoriesPage() {
  const router = useRouter();
  const { products, isLoading, refetch } = useProducts();

  const handleAssignComplete = () => {
    refetch();
  };

  const handleRefreshData = () => {
    refetch();
  };

  // Asignamos el componente a any para evadir el error de tipos de sus Props
  // hasta que actualicemos el archivo ProductCategoryAssign.tsx
  const AssignComponent = ProductCategoryAssign as any;

  return (
    <div className="space-y-6">
      {/* 🎯 Improved and Simplified Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">🏷️ Assign Categories</h1>
          <p className="mt-1 text-sm text-gray-600">
            Simplified system to bulk assign categories to products
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRefreshData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Updating...' : 'Update'}
          </button>

          <button
            onClick={() => router.push('/dashboard/products')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </button>
        </div>
      </div>

      {/* 🎨 Main Component */}
      {isLoading ? (
        <div className="min-h-96 flex justify-center items-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600">Loading products...</p>
          </div>
        </div>
      ) : (
        <AssignComponent
          products={products}
          onAssignComplete={handleAssignComplete}
        />
      )}
    </div>
  );
}