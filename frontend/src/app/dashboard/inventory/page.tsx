'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProductLots } from '@/hooks/useProductLots';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Search, Plus, RefreshCw, Package, Edit, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const { productLots, isLoading, error, refetch, deleteProductLot, isDeleting } = useProductLots();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState('all');

  const filteredLots = productLots.filter(lot => {
    const matchesSearch = 
      lot.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;
    const matchesSalesCategory = salesCategoryFilter === 'all' || lot.sales_category === salesCategoryFilter;

    return matchesSearch && matchesStatus && matchesSalesCategory;
  });

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este lote?')) {
      try {
        await deleteProductLot(id);
      } catch (error) {
        console.error('Error eliminando lote:', error);
        alert('Error al eliminar el lote');
      }
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; label: string } } = {
      available: { color: 'bg-green-100 text-green-800', label: 'Disponible' },
      reserved: { color: 'bg-blue-100 text-blue-800', label: 'Reservado' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expirado' },
      near_expiry: { color: 'bg-yellow-100 text-yellow-800', label: 'Por Expirar' },
      quarantine: { color: 'bg-gray-100 text-gray-800', label: 'Cuarentena' },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>{config.label}</span>;
  };

  const getSalesCategoryBadge = (category: string) => {
    const categoryConfig: { [key: string]: { color: string; label: string } } = {
      regular: { color: 'bg-green-100 text-green-800', label: 'Regular' },
      near_expiry: { color: 'bg-yellow-100 text-yellow-800', label: 'Por Expirar' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expirado' },
    };
    const config = categoryConfig[category] || { color: 'bg-gray-100 text-gray-800', label: category };
    return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>{config.label}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2" />
          <p>Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error al cargar el inventario</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h1>
          <p className="text-gray-600">Administra el inventario de productos médicos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Link href="/dashboard/inventory/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Lote
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar"
            placeholder="Buscar por producto, lote, proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
          
          <Select
            label="Filtrar por Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'available', label: 'Disponible' },
              { value: 'reserved', label: 'Reservado' },
              { value: 'expired', label: 'Expirado' },
              { value: 'near_expiry', label: 'Por Expirar' },
              { value: 'quarantine', label: 'Cuarentena' },
            ]}
          />

          <Select
            label="Filtrar por Categoría de Venta"
            value={salesCategoryFilter}
            onChange={(e) => setSalesCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              { value: 'regular', label: 'Regular' },
              { value: 'near_expiry', label: 'Por Expirar' },
              { value: 'expired', label: 'Expirado' },
            ]}
          />
        </div>
      </div>

      {/* Resumen de Inventario */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Lotes</div>
          <div className="text-2xl font-bold text-gray-900">{productLots.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Disponibles</div>
          <div className="text-2xl font-bold text-green-600">
            {productLots.filter(lot => lot.status === 'available').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Por Expirar</div>
          <div className="text-2xl font-bold text-yellow-600">
            {productLots.filter(lot => lot.status === 'near_expiry').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Expirados</div>
          <div className="text-2xl font-bold text-red-600">
            {productLots.filter(lot => lot.status === 'expired').length}
          </div>
        </div>
      </div>

      {/* Lista de lotes */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote / Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Expiración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLots.map((lot) => (
                <tr key={lot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lot.product_name}</div>
                        <div className="text-sm text-gray-500">{lot.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{lot.lot_number}</div>
                    <div className="text-sm text-gray-500">{lot.supplier_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {lot.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(lot.expiry_date).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(lot.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getSalesCategoryBadge(lot.sales_category)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      ${lot.price_amount} {lot.price_currency}
                    </div>
                    {lot.discount_price_amount > 0 && (
                      <div className="text-sm text-red-600">
                        ${lot.discount_price_amount} {lot.discount_price_currency}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <Link href={`/dashboard/inventory/edit/${lot.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      loading={isDeleting}
                      onClick={() => handleDelete(lot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLots.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || salesCategoryFilter !== 'all' 
                ? 'No se encontraron lotes que coincidan con los filtros' 
                : 'No hay lotes registrados'}
            </div>
            {!searchTerm && statusFilter === 'all' && salesCategoryFilter === 'all' && (
              <Link href="/dashboard/inventory/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer lote
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}