'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  global_sku: string;
  manufacturer_name: string;
  categories: string[];
  requires_license: boolean;
  prescription_required: boolean;
  created_at: string;
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function ProductTable({
  products,
  loading,
  pagination,
  onPageChange,
}: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay productos
        </h3>
        <p className="text-gray-600 mb-4">
          Comienza agregando tu primer producto al catálogo.
        </p>
        <Button>
          Crear Primer Producto
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fabricante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorías
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Restricciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Creación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {product.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.global_sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.manufacturer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {product.categories?.slice(0, 2).map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {category}
                      </span>
                    ))}
                    {product.categories && product.categories.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{product.categories.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-1">
                    {product.requires_license && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Licencia
                      </span>
                    )}
                    {product.prescription_required && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Receta
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(product.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setSelectedProduct(product.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            a{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            de <span className="font-medium">{pagination.total}</span> resultados
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}