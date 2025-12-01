// frontend/src/app/dashboard/inventory/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Building, 
  TrendingUp, 
  DollarSign,
  Users, 
  Calendar, 
  Tag, 
  Plus,
  RefreshCw
} from 'lucide-react';
import { useInventory, SupplierMetrics, InventoryDashboard } from '@/hooks/useInventory';
import { SupplierCard } from '@/components/features/inventory/SupplierCard';

export default function InventoryPage() {
  const router = useRouter();
  const { getSuppliersMetrics, getDashboard, loading, error } = useInventory();
  
  const [suppliers, setSuppliers] = useState<SupplierMetrics[]>([]);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersData, dashboardData] = await Promise.all([
        getSuppliersMetrics(),
        getDashboard()
      ]);
      setSuppliers(suppliersData);
      setDashboard(dashboardData);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    }
  };

  const handleSupplierClick = (supplierId: string) => {
    router.push(`/dashboard/inventory/${supplierId}`);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'No hay datos';
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clase común para los botones de acción para asegurar que sean idénticos
  const actionButtonClass = "inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-sm";

  if (loading && suppliers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 🎯 HEADER MEJORADO CON BOTONES ALINEADOS */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventario Dropshipping</h1>
              <p className="text-gray-600">
                Gestión de catálogos por proveedor y categoría de productos
              </p>
            </div>
            
            {/* GRUPO DE BOTONES DE ACCIÓN */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/dashboard/inventory/lots')}
                className={actionButtonClass}
              >
                <Package className="h-4 w-4 mr-2 text-blue-600" />
                Ver Lotes
              </button>

              <button
                onClick={() => router.push('/dashboard/inventory/lots/new')}
                className={actionButtonClass}
              >
                <Plus className="h-4 w-4 mr-2 text-green-600" />
                Crear Lote
              </button>

              <button
                onClick={loadData}
                disabled={loading}
                className={actionButtonClass}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : 'text-gray-500'}`} />
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>

        {/* 📊 DASHBOARD STATS */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Productos Únicos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.unique_products}</p>
                  <p className="text-xs text-gray-500 mt-1">Productos diferentes</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Proveedores Activos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Proveedores Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.total_suppliers}</p>
                  <p className="text-xs text-gray-500 mt-1">Con inventario</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Valor Total */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor del Inventario</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboard.total_value)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Valor total</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Última Importación */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última Importación</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDateTime(dashboard.last_import)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Fecha y hora</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📈 CATEGORÍAS DE LOTES */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Lotes en Fecha */}
            <div 
              className="bg-green-50 border-2 border-green-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => {
                if (suppliers.length > 0) {
                  router.push(`/dashboard/inventory/${suppliers[0].id}/available`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Lotes en Fecha</p>
                  <p className="text-2xl font-bold text-green-900">{dashboard.available_lots}</p>
                  <p className="text-xs text-green-600 mt-1">Vigentes</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Lotes Fecha Corta */}
            <div 
              className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => {
                if (suppliers.length > 0) {
                  router.push(`/dashboard/inventory/${suppliers[0].id}/near-expiry`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Lotes Fecha Corta</p>
                  <p className="text-2xl font-bold text-amber-900">{dashboard.near_expiry_lots}</p>
                  <p className="text-xs text-amber-600 mt-1">Próximos a caducar</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Lotes Caducados */}
            <div 
              className="bg-red-50 border-2 border-red-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => {
                if (suppliers.length > 0) {
                  router.push(`/dashboard/inventory/${suppliers[0].id}/expired`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Lotes Caducados</p>
                  <p className="text-2xl font-bold text-red-900">{dashboard.expired_lots}</p>
                  <p className="text-xs text-red-600 mt-1">Vencidos</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔍 BUSCAR PROVEEDORES */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Proveedores Activos
              </h2>
              <p className="text-sm text-gray-600">
                {suppliers.length} proveedores encontrados
              </p>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <div className="relative">
              {/* ✅ INPUT CORREGIDO: Texto negro y fondo blanco */}
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white placeholder-gray-400"
              />
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* ❌ ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">Error al cargar los datos</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 📦 GRILLA DE PROVEEDORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onClick={handleSupplierClick}
            />
          ))}
        </div>

        {/* 📭 ESTADO VACÍO */}
        {filteredSuppliers.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron proveedores</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza importando catálogos desde el módulo de importación'}
            </p>
            <button
              onClick={() => router.push('/dashboard/import')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ir a Importación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}