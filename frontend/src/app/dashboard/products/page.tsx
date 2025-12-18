// frontend/src/app/dashboard/products/page.tsx

// frontend/src/app/dashboard/products/page.tsx

'use client';

import { useState, useCallback } from 'react';
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
  AlertCircle // Icono para el error
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  
  // 1. Estados de Control
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ProductFiltersState>({
    searchTerm: '',
    hasImages: 'all',
    manufacturerId: '',
    categoryId: ''
  });

  // Estado para el Modal de Error al Eliminar
  const [deleteError, setDeleteError] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // 2. Hook Optimizado
  const { 
    products, 
    pagination, 
    isLoading,
    isFetching,
    deleteProduct,
    refetch 
  } = useProducts({
    page: currentPage,
    limit: 20,
    searchTerm: filters.searchTerm,
    hasImages: filters.hasImages,
    manufacturerId: filters.manufacturerId,
    categoryId: filters.categoryId
  });

  // 3. Manejadores
  const handleFiltersChange = useCallback((newFilters: ProductFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const tableContainer = document.getElementById('products-header');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteProduct = async (product: any) => {
    try {
      await deleteProduct(product.id);
      // Éxito: Se cierra el modal de confirmación en la tabla y React Query actualiza la lista
    } catch (error: any) {
      console.error('Error deleting product:', error);
      
      // Capturamos el mensaje del backend
      const title = error.response?.status === 409 ? 'No se puede eliminar' : 'Error al eliminar';
      const message = error.response?.data?.error || 'Hubo un error inesperado al intentar eliminar el producto.';
      const details = error.response?.data?.details || '';

      // Abrimos nuestro Modal de Error personalizado
      setDeleteError({
        isOpen: true,
        title: title,
        message: `${message} ${details ? `\n\n${details}` : ''}`
      });
    }
  };

  const handleRefreshData = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" id="products-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona todos los productos de tu inventario
          </p>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:mt-0">
          <button
            onClick={() => router.push('/dashboard/products/assign-categories')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Asignar Categorías
          </button>
          
          <button
            onClick={handleRefreshData}
            disabled={isLoading || isFetching}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className={`mr-2 h-4 w-4 ${isLoading || isFetching ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading || isFetching ? 'Actualizando...' : 'Actualizar'}
          </button>

          <button
            onClick={() => router.push('/dashboard/products/upload-images')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Subir Imágenes
          </button>
          
          <button
            onClick={() => router.push('/dashboard/products/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      <ProductStatsCards />

      <ProductFilters 
        onFiltersChange={handleFiltersChange}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* Encabezado de Tabla y Paginación Arriba */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Lista de Productos
            {pagination?.total > 0 && <span className="text-sm text-gray-500 font-normal">({pagination.total} en total)</span>}
            {isFetching && !isLoading && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse ml-2">
                Actualizando...
              </span>
            )}
          </h2>

          {/* ✅ PAGINACIÓN SUPERIOR */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 self-start md:self-auto">
              <button 
                onClick={() => handlePageChange(1)} 
                disabled={pagination.page === 1 || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600"
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4"/>
              </button>
              <button 
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))} 
                disabled={pagination.page === 1 || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600"
                title="Anterior"
              >
                <ChevronLeft className="h-4 w-4"/>
              </button>
              
              <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button 
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))} 
                disabled={pagination.page >= pagination.totalPages || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600"
                title="Siguiente"
              >
                <ChevronRight className="h-4 w-4"/>
              </button>
              <button 
                onClick={() => handlePageChange(pagination.totalPages)} 
                disabled={pagination.page >= pagination.totalPages || isFetching}
                className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 text-gray-600"
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4"/>
              </button>
            </div>
          )}
        </div>
        
        {/* Tabla */}
        <ProductTable
          products={products}
          isLoading={isLoading} 
          onDelete={handleDeleteProduct}
        />
      </div>

      {/* ✅ MODAL DE ERROR (Diseño idéntico al de confirmación) */}
      {deleteError.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="relative p-6 border w-full max-w-md shadow-2xl rounded-xl bg-white">
            <div className="text-center">
              {/* Icono de Alerta */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {deleteError.title}
              </h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  {deleteError.message}
                </p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setDeleteError({ ...deleteError, isOpen: false })}
                  className="w-full inline-flex justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Entendido, cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}