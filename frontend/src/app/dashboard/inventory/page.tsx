'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Building, 
  TrendingUp, 
  DollarSign,
  Users,
  Calendar
} from 'lucide-react';
import { useInventory, SupplierSummary, InventoryDashboard } from '@/hooks/useInventory';
import { SupplierCard } from '@/components/features/inventory/SupplierCard';

export default function InventoryPage() {
  const router = useRouter();
  const { getSuppliersSummary, getInventoryDashboard, loading, error } = useInventory();
  
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersData, dashboardData] = await Promise.all([
        getSuppliersSummary(),
        getInventoryDashboard()
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

        {/* Dashboard Stats */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.total_products}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Proveedores</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.total_suppliers}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${dashboard.total_value.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última Importación</p>
                  <p className="text-lg font-bold text-gray-900">
                    {dashboard.last_import_date ? 
                      new Date(dashboard.last_import_date).toLocaleDateString('es-MX') : 
                      'No hay datos'
                    }
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categorías Summary */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Productos en Fecha</p>
                  <p className="text-2xl font-bold text-green-900">{dashboard.total_regular}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Productos Fecha Corta</p>
                  <p className="text-2xl font-bold text-amber-900">{dashboard.total_near_expiry}</p>
                </div>
                <Calendar className="h-8 w-8 text-amber-600" />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Productos Caducados</p>
                  <p className="text-2xl font-bold text-red-900">{dashboard.total_expired}</p>
                </div>
                <Package className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Search and Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Proveedores ({suppliers.length})
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

        {/* Suppliers Grid */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

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