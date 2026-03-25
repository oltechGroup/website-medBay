// frontend/src/components/features/products/ProductTable.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/hooks/useProducts';
import { getImageUrl, formatCurrency } from '@/lib/formatters';
import { Package } from 'lucide-react'; // 🚀 Icono para la unidad

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProductTable = ({ 
  products, 
  isLoading = false, 
  onEdit, 
  onDelete 
}: ProductTableProps) => {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const renderPrice = (product: Product) => {
    const { min_price, max_price, active_lots } = product;
    const hasValidPrices = min_price != null && max_price != null && min_price > 0 && max_price > 0;
    const hasActiveLots = active_lots !== undefined && active_lots > 0;

    if (!hasValidPrices || !hasActiveLots) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Not available
        </span>
      );
    }

    if (min_price === max_price || active_lots === 1) {
      return (
        <span className="text-sm font-semibold text-green-600">
          {formatCurrency(min_price || 0)}
        </span>
      );
    }

    return (
      <div className="flex flex-col space-y-1">
        <span className="text-sm font-semibold text-green-600">
          From {formatCurrency(min_price || 0)}
        </span>
        <span className="text-sm font-semibold text-green-600">
          To {formatCurrency(max_price || 0)}
        </span>
      </div>
    );
  };

  const renderCategories = (product: Product) => {
    const categories = product.category_names || [];
    const displayLimit = 2;

    if (categories.length === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          No categories
        </span>
      );
    }

    const displayedCategories = categories.slice(0, displayLimit);
    const remainingCount = categories.length - displayLimit;

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
            +{remainingCount} more
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
        <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-2 text-sm text-gray-500">Try adjusting search filters or create a new product.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/products/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Product
          </button>
        </div>
      </div>
    );
  }

  const handleEdit = (product: Product) => {
    if (onEdit) onEdit(product);
    else router.push(`/dashboard/products/edit/${product.id}`);
  };

  const handleDelete = (product: Product) => setSelectedProduct(product);
  
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
                {/* Image */}
                <div className="flex-shrink-0">
                  <img
                    src={getImageUrl(product.primary_image)}
                    alt={product.description}
                    className="w-20 h-20 rounded-lg object-cover bg-gray-50 border border-gray-100"
                    onError={(e) => { 
                        e.currentTarget.onerror = null; 
                        e.currentTarget.src = "https://placehold.co/100x100/f3f4f6/9ca3af?text=No+Image"; 
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                      {product.description}
                    </h3>
                    <div className="flex-shrink-0 text-right">
                      {renderPrice(product)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <strong className="mr-1">SKU:</strong> {product.global_sku || 'Not assigned'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <strong className="mr-1">Manufacturer:</strong> {product.manufacturer_name || 'Not assigned'}
                      </div>
                      {/* 🚀 NUEVA FILA: Unidad de Medida (UOM) */}
                      <div className="flex items-center text-sm text-blue-600 font-medium">
                        <Package className="w-3.5 h-3.5 mr-1.5" />
                        <strong className="mr-1 text-gray-600 font-bold">Packaging:</strong> 
                        {product.uom_summary || 'Standard Unit'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start text-sm">
                        <div className="flex-1">
                          <strong className="text-gray-600 block mb-1">Categories:</strong>
                          {renderCategories(product)}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <strong className="mr-1 font-bold">Images:</strong> {product.image_count || 0}
                      </div>
                      {product.active_lots !== undefined && (
                        <div className="flex items-center text-sm text-gray-600">
                          <strong className="mr-1">Active lots:</strong> {product.active_lots}
                        </div>
                      )}
                    </div>
                  </div>

                  {product.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        <span className="font-medium text-gray-600">Notes:</span> {product.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="inline-flex items-center p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="inline-flex items-center p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-red-50 hover:text-red-700"
                  title="Delete"
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

      {/* Delete Confirmation Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Delete product?</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{selectedProduct.description}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};