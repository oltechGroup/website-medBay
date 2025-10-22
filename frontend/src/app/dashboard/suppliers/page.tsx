'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSuppliers } from '@/hooks/useSuppliers';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Plus, RefreshCw, Building, Edit, Trash2 } from 'lucide-react';

export default function SuppliersPage() {
  const { suppliers, isLoading, error, refetch, deleteSupplier, isDeleting } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.tax_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error('Error eliminando proveedor:', error);
        alert('Error al eliminar el proveedor');
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
          <p>Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error al cargar los proveedores</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">Gestiona los proveedores de productos médicos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Link href="/dashboard/suppliers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Proveedor
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Input
          label="Buscar proveedores"
          placeholder="Buscar por nombre, RFC, país..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4 text-gray-400" />}
        />
      </div>

      {/* Lista de proveedores */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RFC / Tax ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País / Moneda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información de Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {supplier.tax_id || 'No especificado'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{supplier.country || 'No especificado'}</div>
                    <div className="text-sm text-gray-500">{supplier.default_currency || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {supplier.contact_info ? (
                      <div>
                        {supplier.contact_info.phone && <div>📞 {supplier.contact_info.phone}</div>}
                        {supplier.contact_info.email && <div>✉️ {supplier.contact_info.email}</div>}
                        {supplier.contact_info.contact_person && <div>👤 {supplier.contact_info.contact_person}</div>}
                      </div>
                    ) : (
                      'Sin información de contacto'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(supplier.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <Link href={`/dashboard/suppliers/edit/${supplier.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      loading={isDeleting}
                      onClick={() => handleDelete(supplier.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron proveedores que coincidan con tu búsqueda' : 'No hay proveedores registrados'}
            </div>
            {!searchTerm && (
              <Link href="/dashboard/suppliers/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer proveedor
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}