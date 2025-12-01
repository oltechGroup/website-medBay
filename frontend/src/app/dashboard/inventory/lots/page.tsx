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
  Download,
  Box,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useInventory, ProductLot } from '@/hooks/useInventory';

export default function LotsManagementPage() {
  const router = useRouter();
  const { getLots, deleteLot, loading, error } = useInventory();
  
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [filteredLots, setFilteredLots] = useState<ProductLot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Estado para el modal de eliminación
  const [lotToDelete, setLotToDelete] = useState<ProductLot | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadLots();
  }, []);

  useEffect(() => {
    filterLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(lot =>
        lot.product_name?.toLowerCase().includes(lowerTerm) ||
        lot.product_code?.toLowerCase().includes(lowerTerm) ||
        lot.supplier_name?.toLowerCase().includes(lowerTerm) ||
        lot.lot_number?.toLowerCase().includes(lowerTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lot => lot.status === statusFilter);
    }

    setFilteredLots(filtered);
  };

  // Abre el modal
  const handleDeleteClick = (lot: ProductLot) => {
    setLotToDelete(lot);
  };

  // Confirma la eliminación
  const confirmDelete = async () => {
    if (!lotToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteLot(lotToDelete.id);
      await loadLots(); // Recargar lista
      setLotToDelete(null); // Cerrar modal
    } catch (err) {
      console.error('Error deleting lot:', err);
      alert('Error al eliminar el lote');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (lotId: string) => {
    router.push(`/dashboard/inventory/lots/${lotId}/edit`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'near_expiry': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'near_expiry': return <AlertCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'En Fecha';
      case 'near_expiry': return 'Fecha Corta';
      case 'expired': return 'Caducado';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    // Ajuste simple de zona horaria para visualización
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('es-MX');
  };

  // Cálculos para tarjetas superiores
  const totalLots = lots.length;
  const totalValue = lots.reduce((sum, lot) => sum + (lot.quantity * lot.price), 0);
  const totalUnits = lots.reduce((sum, lot) => sum + lot.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Lotes</h1>
                <p className="text-gray-600">Administra todos los lotes de inventario del sistema</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={loadLots}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button
                onClick={() => router.push('/dashboard/inventory/lots/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Lote
              </button>
              
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{totalLots}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades Totales</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString('es-MX')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Box className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {/* ✅ FIX: Texto negro y fondo blanco */}
                <input
                  type="text"
                  placeholder="Buscar lotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              {/* ✅ FIX: Texto negro y fondo blanco */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
              >
                <option value="all">Todos los estados</option>
                <option value="available">En Fecha</option>
                <option value="near_expiry">Fecha Corta</option>
                <option value="expired">Caducados</option>
              </select>

              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RESULTS SUMMARY */}
        <div className="flex items-center justify-between mb-4 px-1">
           <p className="text-sm text-gray-500">
             Mostrando <span className="font-medium text-gray-900">{filteredLots.length}</span> resultados
           </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}

        {/* TABLE */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
            {filteredLots.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caducidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLots.map((lot) => (
                      <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lot.product_name}</div>
                          <div className="text-xs text-gray-500">{lot.product_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lot.supplier_name}</div>
                          <div className="text-xs text-gray-500">{lot.supplier_sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {lot.lot_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {formatDate(lot.expiry_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lot.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(lot.price)}
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
                              className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {/* Botón de eliminar (abre modal) */}
                            <button
                              onClick={() => handleDeleteClick(lot)}
                              className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar"
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
            ) : (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No se encontraron lotes</h3>
                <p className="text-gray-500 mt-1">Prueba ajustar los filtros de búsqueda</p>
              </div>
            )}
          </div>
        )}

        {/* 📊 RESUMEN FINAL (Pie de página agregado) */}
        {filteredLots.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
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

      {/* 🗑️ MODAL DE CONFIRMACIÓN */}
      {lotToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white animate-in fade-in zoom-in duration-200">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">¿Eliminar lote?</h3>
              <div className="mt-2 px-4 py-2">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar el lote <strong>{lotToDelete.lot_number}</strong>? 
                  Esta acción eliminará {lotToDelete.quantity} unidades del inventario y no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-5">
                <button
                  onClick={() => setLotToDelete(null)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  disabled={deleteLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}