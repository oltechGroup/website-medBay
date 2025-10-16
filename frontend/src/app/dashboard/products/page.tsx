'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Plus, RefreshCw } from 'lucide-react';

export default function ProductsPage() {
  const { products, isLoading, error, refetch, deleteProduct, isDeleting } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.global_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.manufacturer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2" />
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error al cargar los productos</div>
        <Button onClick={handleRefresh} variant="outline">
          Reintentar
        </Button>
        <div className="mt-4 text-sm text-gray-600">
          Verifica que el backend esté corriendo en http://localhost:3001
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona tu catálogo de productos médicos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Input
          label="Buscar productos"
          placeholder="Buscar por nombre, SKU, fabricante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4 text-gray-400" />}
        />
      </div>

      {/* Lista de productos */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.global_sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.manufacturer_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.requires_license 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.requires_license ? 'Con licencia' : 'Sin licencia'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <Link href={`/dashboard/products/edit/${product.id}`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      loading={isDeleting}
                      onClick={() => handleDelete(product.id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron productos que coincidan con tu búsqueda' : 'No hay productos registrados'}
            </div>
            {!searchTerm && (
              <Link href="/dashboard/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer producto
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}