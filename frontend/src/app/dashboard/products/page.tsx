// frontend/src/app/dashboard/products/page.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductStatsCards } from '@/components/features/products/ProductStatsCards';
import { ProductTable } from '@/components/features/products/ProductTable';
import { ProductFilters, ProductFiltersState } from '@/components/features/products/ProductFilters';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  
  // 1. Control States
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ProductFiltersState>({
    searchTerm: '',
    hasImages: 'all',
    manufacturerId: '',
    categoryId: ''
  });

  // State for Delete Error Modal
  const [deleteError, setDeleteError] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // 2. Optimized Hook 
  // ✅ Ahora incluimos isPlaceholderData para saber si estamos viendo datos viejos durante la transición
  const { 
    products, 
    pagination, 
    isLoading,
    isFetching,
    isPlaceholderData,
    deleteProduct,
    refetch 
  } = useProducts({
    page: currentPage,
    limit: 20,
    searchTerm: filters.searchTerm,
    hasImages: filters.hasImages,
    manufacturerId: filters.manufacturerId,
    categoryId: filters.categoryId
    // ✅ Se asume sortBy: 'newest' por defecto en el hook
  });

  // 3. Handlers
  const handleFiltersChange = useCallback((newFilters: ProductFiltersState) => {
    // Solo reiniciamos la página si los filtros realmente cambiaron
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || isFetching) return;
    
    setCurrentPage(newPage);
    // Scroll suave al inicio de la tabla para que el usuario vea el cambio
    const tableContainer = document.getElementById('products-list-anchor');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteProduct = async (product: any) => {
    try {
      await deleteProduct(product.id);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const title = error.response?.status === 409 ? 'Dependency Error' : 'Delete Error';
      const message = error.response?.data?.error || 'The product could not be deleted.';
      const details = error.response?.data?.details || '';

      setDeleteError({
        isOpen: true,
        title: title,
        message: `${message} ${details ? `\n\n${details}` : ''}`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" id="products-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time inventory and catalog management.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 sm:mt-0">
          <button
            onClick={() => router.push('/dashboard/products/assign-categories')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
          >
            <Tags className="mr-2 h-4 w-4 text-blue-500" />
            Assign Categories
          </button>
          
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Syncing...' : 'Sync'}
          </button>

          <button
            onClick={() => router.push('/dashboard/products/upload-images')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
          >
            <ImageIcon className="mr-2 h-4 w-4 text-purple-500" />
            Bulk Upload
          </button>
          
          <button
            onClick={() => router.push('/dashboard/products/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </button>
        </div>
      </div>

      <ProductStatsCards />

      <ProductFilters 
        onFiltersChange={handleFiltersChange}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="products-list-anchor">
        {/* Table Header and Top Pagination */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Inventory List
            {pagination?.total > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{pagination.total} Items</span>}
          </h2>

          {/* ✅ REFINED TOP PAGINATION */}
          {pagination && pagination.totalPages > 1 && (
            <div className={`flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 transition-opacity ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
              <button 
                onClick={() => handlePageChange(1)} 
                disabled={pagination.page === 1 || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600 transition-all"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4"/>
              </button>
              <button 
                onClick={() => handlePageChange(pagination.page - 1)} 
                disabled={pagination.page === 1 || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600 transition-all"
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4"/>
              </button>
              
              <div className="px-3 flex items-center gap-1">
                <span className="text-xs font-black text-blue-600">{pagination.page}</span>
                <span className="text-xs font-bold text-gray-400">/</span>
                <span className="text-xs font-bold text-gray-500">{pagination.totalPages}</span>
              </div>

              <button 
                onClick={() => handlePageChange(pagination.page + 1)} 
                disabled={pagination.page >= pagination.totalPages || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600 transition-all"
                title="Next"
              >
                <ChevronRight className="h-4 w-4"/>
              </button>
              <button 
                onClick={() => handlePageChange(pagination.totalPages)} 
                disabled={pagination.page >= pagination.totalPages || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600 transition-all"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4"/>
              </button>
            </div>
          )}
        </div>
        
        {/* Table Body */}
        <div className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
          <ProductTable
            products={products}
            isLoading={isLoading} 
            onDelete={handleDeleteProduct}
          />
        </div>

        {/* Bottom Pagination Info */}
        {!isLoading && products.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-center md:justify-end">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Showing {products.length} products on this page
                </p>
            </div>
        )}
      </div>

      {/* ✅ ERROR MODAL */}
      {deleteError.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="relative p-8 border w-full max-w-md shadow-2xl rounded-3xl bg-white mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 mb-6 border border-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
                {deleteError.title}
              </h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {deleteError.message}
                </p>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setDeleteError({ ...deleteError, isOpen: false })}
                  className="w-full inline-flex justify-center px-6 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 focus:outline-none transition-all shadow-lg shadow-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component icons helper (to match imports)
function Tags(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>; }
function ImageIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function Plus(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>; }