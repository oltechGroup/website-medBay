// frontend/src/app/dashboard/products/page.tsx

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductStatsCards } from '@/components/features/products/ProductStatsCards';
import { ProductTable } from '@/components/features/products/ProductTable';
import { ProductFilters, ProductFiltersState } from '@/components/features/products/ProductFilters';

export default function ProductsPage() {
  const router = useRouter();
  const { 
    products, 
    isLoading, 
    deleteProduct,
    isDeleting,
    refetch 
  } = useProducts();

  const [filters, setFilters] = useState<ProductFiltersState>({
    searchTerm: '',
    hasImages: 'all',
    manufacturerId: '',
    categoryId: ''
  });

  // ✅ CORRECCIÓN DEFINITIVA: Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const {
        searchTerm,
        hasImages,
        manufacturerId,
        categoryId
      } = filters;

      // Búsqueda por término
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          product.description?.toLowerCase().includes(term) ||
          product.global_sku?.toLowerCase().includes(term) ||
          product.manufacturer_name?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // ✅ CORRECCIÓN CRÍTICA: Filtro por imágenes - MANERA CORRECTA
      if (hasImages === 'with') {
        // Solo productos que tienen AL MENOS 1 imagen
        if (!product.image_count || product.image_count < 1) return false;
      }
      
      if (hasImages === 'without') {
        // Solo productos que tienen CERO imágenes
        if (product.image_count && product.image_count > 0) return false;
      }

      // Filtro por fabricante
      if (manufacturerId && product.manufacturer_id !== manufacturerId) return false;

      // Filtro por categoría
      if (categoryId && (!product.category_ids || !product.category_ids.includes(categoryId))) return false;

      return true;
    });
  }, [products, filters]);

  const handleFiltersChange = (newFilters: ProductFiltersState) => {
    setFilters(newFilters);
  };

  const handleDeleteProduct = async (product: any) => {
    try {
      await deleteProduct(product.id);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleRefreshData = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona todos los productos de tu inventario
          </p>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:mt-0">
          <button
            onClick={() => router.push('/dashboard/products/assign-categories')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Asignar Categorías
          </button>
          
          {/* Botón de Actualizar Información */}
          <button
            onClick={handleRefreshData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Actualizando...' : 'Actualizar Info'}
          </button>

          <button
            onClick={() => router.push('/dashboard/products/upload-images')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Subir Imágenes
          </button>
          
          <button
            onClick={() => router.push('/dashboard/products/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <ProductStatsCards />

      {/* Filtros Mejorados */}
      <ProductFilters 
        onFiltersChange={handleFiltersChange}
      />

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Productos {filteredProducts.length > 0 && `(${filteredProducts.length})`}
          </h2>
          {isLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando...
            </div>
          )}
        </div>
        
        <ProductTable
          products={filteredProducts}
          isLoading={isLoading}
          onDelete={handleDeleteProduct}
        />
      </div>
    </div>
  );
}