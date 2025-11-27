// frontend/src/components/features/products/ProductTable.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/hooks/useProducts';

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProductTable = ({ products, isLoading = false, onEdit, onDelete }: ProductTableProps) => {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ✅ FUNCIÓN: Formatear precio en USD
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // ✅ FUNCIÓN: Mostrar precios de manera inteligente - VERSIÓN CORREGIDA
const renderPrice = (product: Product) => {
  const { min_price, max_price, active_lots } = product;

  // ✅ CORRECCIÓN: Verificar si los precios son null/undefined/0 en lugar de solo active_lots
  const hasValidPrices = min_price != null && max_price != null && min_price > 0 && max_price > 0;
  const hasActiveLots = active_lots && active_lots > 0;

  // Si no hay precios válidos O no hay lotes activos
  if (!hasValidPrices || !hasActiveLots) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        No disponible
      </span>
    );
  }

  // Si solo hay un precio o los precios son iguales
  if (min_price === max_price || active_lots === 1) {
    return (
      <span className="text-sm font-semibold text-green-600">
        {formatPrice(min_price)}
      </span>
    );
  }

  // Si hay rango de precios
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-semibold text-green-600">
        Desde {formatPrice(min_price)}
      </span>
      <span className="text-sm font-semibold text-green-600">
        Hasta {formatPrice(max_price)}
      </span>
    </div>
  );
};

  // ✅ FUNCIÓN: Mostrar categorías con límite y colores
  const renderCategories = (product: Product) => {
    const categories = product.category_names || [];
    const displayLimit = 2; // Mostrar máximo 2 categorías

    if (categories.length === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          Sin categorías
        </span>
      );
    }

    const displayedCategories = categories.slice(0, displayLimit);
    const remainingCount = categories.length - displayLimit;

    // Colores para las categorías
    const colorClasses = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-indigo-100 text-indigo-800'
    ];

    return (
      <div className="flex flex-wrap gap-1">
        {displayedCategories.map((category, index) => (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              colorClasses[index % colorClasses.length]
            }`}
          >
            {category}
          </span>
        ))}
        {remainingCount > 0 && (
          <span 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
            title={categories.slice(displayLimit).join(', ')}
          >
            +{remainingCount} más
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No hay productos</h3>
        <p className="mt-2 text-sm text-gray-500">Comienza creando tu primer producto.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/products/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Producto
          </button>
        </div>
      </div>
    );
  }

  const handleEdit = (product: Product) => {
    if (onEdit) {
      onEdit(product);
    } else {
      router.push(`/dashboard/products/edit/${product.id}`);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
  };

  const confirmDelete = () => {
    if (selectedProduct && onDelete) {
      onDelete(selectedProduct);
    }
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1 min-w-0">
                {/* Imagen del producto */}
                <div className="flex-shrink-0">
                  {product.primary_image ? (
                    <img
                      src={product.primary_image}
                      alt={product.description}
                      className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Información del producto - MEJORADA */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                      {product.description}
                    </h3>
                    {/* ✅ PRECIO PRINCIPAL - Ubicación destacada */}
                    <div className="flex-shrink-0 text-right">
                      {renderPrice(product)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Columna izquierda - Información básica */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <span className="truncate">
                          <strong>SKU:</strong> {product.global_sku || 'No asignado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">
                          <strong>Fabricante:</strong> {product.manufacturer_name || 'No asignado'}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          <strong>Imágenes:</strong> {product.image_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Columna derecha - Categorías y información adicional */}
                    <div className="space-y-2">
                      {/* ✅ CATEGORÍAS */}
                      <div className="flex items-start text-sm">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <div className="flex-1">
                          <strong className="text-gray-600">Categorías:</strong>
                          <div className="mt-1">
                            {renderCategories(product)}
                          </div>
                        </div>
                      </div>

                      {/* ✅ LOTES ACTIVOS */}
                      {product.active_lots !== undefined && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>
                            <strong>Lotes activos:</strong> {product.active_lots}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notas (si existen) */}
                  {product.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        <span className="font-medium text-gray-600">Notas:</span> {product.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="inline-flex items-center p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  title="Editar producto"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handleDelete(product)}
                  className="inline-flex items-center p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  title="Eliminar producto"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmación para eliminar */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">¿Eliminar producto?</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar <strong>{selectedProduct.description}</strong>? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};