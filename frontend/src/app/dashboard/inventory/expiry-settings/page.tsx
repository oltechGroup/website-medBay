'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExpiryCategories } from '@/hooks/useExpiryCategories';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, RefreshCw, Edit, Trash2, Settings } from 'lucide-react';

export default function ExpirySettingsPage() {
  const { expiryCategories, isLoading, error, refetch, deleteExpiryCategory, isDeleting } = useExpiryCategories();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = expiryCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría de expiración?')) {
      try {
        await deleteExpiryCategory(id);
      } catch (error) {
        console.error('Error eliminando categoría de expiración:', error);
        alert('Error al eliminar la categoría de expiración');
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
          <p>Cargando parámetros de caducidad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error al cargar los parámetros de caducidad</div>
        <Button onClick={handleRefresh} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parámetros de Caducidad</h1>
          <p className="text-gray-600">Configura las categorías de productos near expiry y expirados</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Link href="/dashboard/inventory/expiry-settings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Categoría
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Input
          label="Buscar categorías"
          placeholder="Buscar por nombre, descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Settings className="h-4 w-4 text-gray-400" />}
        />
      </div>

      {/* Lista de categorías de expiración */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Umbral (días)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuento (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category.description || 'Sin descripción'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.days_threshold} días
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.discount_percentage}%
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      category.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category.sort_order}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <Link href={`/dashboard/inventory/expiry-settings/edit/${category.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      loading={isDeleting}
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron categorías que coincidan con tu búsqueda' : 'No hay categorías de expiración registradas'}
            </div>
            {!searchTerm && (
              <Link href="/dashboard/inventory/expiry-settings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primera categoría
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}