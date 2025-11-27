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
  Box, 
  ShoppingCart,
  Grid3X3,
  List,
  Plus
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  // Navegación rápida
  const quickActions = [
    {
      title: 'Ver Todos los Lotes',
      description: 'Gestión completa de todos los lotes del sistema',
      icon: List,
      color: 'blue',
      action: () => router.push('/dashboard/inventory/lots')
    },
    {
      title: 'Crear Nuevo Lote',
      description: 'Agregar un nuevo lote al inventario',
      icon: Plus,
      color: 'green', 
      action: () => router.push('/dashboard/inventory/lots/new')
    },
    {
      title: 'Dashboard Avanzado',
      description: 'Estadísticas y reportes detallados',
      icon: TrendingUp,
      color: 'purple',
      action: () => router.push('/dashboard/inventory?view=advanced')
    }
  ];

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventario Dropshipping</h1>
          <p className="text-gray-600">
            Gestión de catálogos por proveedor y categoría de productos
          </p>
        </div>

        {/* 🚀 ACCIONES RÁPIDAS */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {quickActions.map((action, index) => {
    const Icon = action.icon;
    
    return (
      <button
        key={index}
        onClick={action.action}
        className="bg-white border border-gray-300 rounded-lg p-6 text-left transition-all hover:shadow-md hover:border-blue-500 w-full"
      >
        <div className="flex items-center space-x-3 mb-3">
          <Icon className="h-6 w-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
        </div>
        <p className="text-sm text-gray-600">{action.description}</p>
      </button>
    );
  })}
</div>

        {/* 📊 DASHBOARD STATS */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Productos Únicos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.unique_products}</p>
                  <p className="text-xs text-gray-500 mt-1">Productos diferentes</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Proveedores Activos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Proveedores Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.total_suppliers}</p>
                  <p className="text-xs text-gray-500 mt-1">Con inventario</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Valor Total */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor del Inventario</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboard.total_value)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Valor total</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Última Importación */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última Importación</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDateTime(dashboard.last_import)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Fecha y hora</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
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
              className="bg-green-50 border border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                // Navegar al primer proveedor con lotes disponibles, o mostrar todos
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
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Lotes Fecha Corta */}
            <div 
              className="bg-amber-50 border border-amber-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
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
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Lotes Caducados */}
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
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
                <div className="p-3 bg-red-100 rounded-lg">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔍 BUSCAR PROVEEDORES */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Proveedores Activos ({suppliers.length})
          </h2>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* ❌ ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
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

        {filteredSuppliers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron proveedores</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza importando catálogos desde el módulo de importación'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}