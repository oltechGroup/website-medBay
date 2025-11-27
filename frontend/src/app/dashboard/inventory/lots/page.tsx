// frontend/src/app/dashboard/inventory/lots/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Building,
  Calendar,
  DollarSign,
  Box,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useInventory, ProductLot } from '@/hooks/useInventory';

export default function LotsManagementPage() {
  const router = useRouter();
  const { getLots, deleteLot, loading, error } = useInventory();
  
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [filteredLots, setFilteredLots] = useState<ProductLot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadLots();
  }, []);

  useEffect(() => {
    filterLots();
  }, [lots, searchTerm, statusFilter]);

  const loadLots = async () => {
    try {
      const lotsData = await getLots();
      setLots(lotsData);
    } catch (err) {
      console.error('Error loading lots:', err);
    }
  };

  const filterLots = () => {
    let filtered = lots;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(lot =>
        lot.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.lot_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lot => lot.status === statusFilter);
    }

    setFilteredLots(filtered);
  };

  const handleDelete = async (lotId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lote? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeleteLoading(lotId);
      await deleteLot(lotId);
      await loadLots(); // Recargar la lista
    } catch (err) {
      console.error('Error deleting lot:', err);
      alert('Error al eliminar el lote');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (lotId: string) => {
    router.push(`/dashboard/inventory/lots/${lotId}/edit`);
  };

  const handleView = (supplierId: string) => {
    router.push(`/dashboard/inventory/${supplierId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'near_expiry':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'near_expiry':
        return <AlertCircle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'En Fecha';
      case 'near_expiry':
        return 'Fecha Corta';
      case 'expired':
        return 'Caducado';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  // Estadísticas
  const totalLots = lots.length;
  const totalValue = lots.reduce((sum, lot) => sum + (lot.quantity * lot.price), 0);
  const totalUnits = lots.reduce((sum, lot) => sum + lot.quantity, 0);

  const availableLots = lots.filter(lot => lot.status === 'available').length;
  const nearExpiryLots = lots.filter(lot => lot.status === 'near_expiry').length;
  const expiredLots = lots.filter(lot => lot.status === 'expired').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Lotes</h1>
                <p className="text-gray-600">
                  Administra todos los lotes de inventario del sistema
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard/inventory/lots/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Lote
              </button>
              
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* 📊 ESTADÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{totalLots}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalUnits.toLocaleString('es-MX')}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Box className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(lots.map(lot => lot.supplier_name)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 📊 DISTRIBUCIÓN POR ESTADO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Lotes en Fecha</p>
                <p className="text-2xl font-bold text-green-900">{availableLots}</p>
                <p className="text-xs text-green-600 mt-1">
                  {totalLots > 0 ? `${Math.round((availableLots / totalLots) * 100)}% del total` : '0%'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Lotes Fecha Corta</p>
                <p className="text-2xl font-bold text-amber-900">{nearExpiryLots}</p>
                <p className="text-xs text-amber-600 mt-1">
                  {totalLots > 0 ? `${Math.round((nearExpiryLots / totalLots) * 100)}% del total` : '0%'}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Lotes Caducados</p>
                <p className="text-2xl font-bold text-red-900">{expiredLots}</p>
                <p className="text-xs text-red-600 mt-1">
                  {totalLots > 0 ? `${Math.round((expiredLots / totalLots) * 100)}% del total` : '0%'}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 FILTROS Y BÚSQUEDA */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar lotes por producto, código, proveedor o número de lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">Todos los estados</option>
                <option value="available">En Fecha</option>
                <option value="near_expiry">Fecha Corta</option>
                <option value="expired">Caducados</option>
              </select>

              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 📈 RESUMEN DE RESULTADOS */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm font-medium text-blue-800">
                Mostrando <span className="font-bold">{filteredLots.length}</span> de <span className="font-bold">{lots.length}</span> lotes
              </p>
            </div>
          </div>
          
          {filteredLots.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Valor filtrado: <span className="font-semibold text-gray-900">
                  {formatCurrency(filteredLots.reduce((sum, lot) => sum + (lot.quantity * lot.price), 0))}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* ❌ MENSAJE DE ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">Error al cargar los lotes</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 📦 TABLA DE LOTES */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {filteredLots.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lote
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Caducidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLots.map((lot) => (
                      <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lot.product_name || 'Sin nombre'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {lot.product_code || 'Sin código'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lot.supplier_name}</div>
                          <div className="text-sm text-gray-500">{lot.supplier_sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lot.lot_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDate(lot.expiry_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Box className="h-4 w-4 text-gray-400 mr-2" />
                            {lot.quantity} {lot.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                            {formatCurrency(lot.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lot.status)}`}>
                            {getStatusIcon(lot.status)}
                            <span className="ml-1">{getStatusText(lot.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(lot.id)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Editar lote"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleView(lot.supplier_id!)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Ver proveedor"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(lot.id)}
                              disabled={deleteLoading === lot.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                              title="Eliminar lote"
                            >
                              {deleteLoading === lot.id ? (
                                <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* 📭 ESTADO VACÍO */
              <div className="text-center py-16">
                <div className="p-4 bg-blue-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchTerm || statusFilter !== 'all' ? 'No se encontraron lotes' : 'No hay lotes registrados'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No se encontraron lotes que coincidan con tus criterios de búsqueda.'
                    : 'Comienza agregando lotes al inventario usando el botón "Crear Lote".'
                  }
                </p>
                <div className="flex justify-center space-x-4">
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all"
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Limpiar filtros
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/dashboard/inventory/lots/new')}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Crear Primer Lote
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📊 PIE DE PÁGINA INFORMATIVO */}
        {filteredLots.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Lotes</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600">Productos únicos:</p>
                    <p className="font-medium text-gray-900">
                      {new Set(filteredLots.map(lot => lot.product_code)).size} productos
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Proveedores:</p>
                    <p className="font-medium text-gray-900">
                      {new Set(filteredLots.map(lot => lot.supplier_name)).size} proveedores
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stock promedio:</p>
                    <p className="font-medium text-gray-900">
                      {Math.round(filteredLots.reduce((sum, lot) => sum + lot.quantity, 0) / filteredLots.length)} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor promedio:</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(filteredLots.reduce((sum, lot) => sum + (lot.quantity * lot.price), 0) / filteredLots.length)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}