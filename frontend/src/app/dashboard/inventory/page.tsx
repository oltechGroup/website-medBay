// frontend/src/app/dashboard/inventory/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  History,
  ArrowRight
} from 'lucide-react';
import { useInventory, SupplierMetrics, InventoryDashboard, PaginationMetadata } from '@/hooks/useInventory';
import { SupplierCard } from '@/components/features/inventory/SupplierCard';

export default function InventoryPage() {
  const router = useRouter();
  const { getSuppliersMetrics, getDashboard, loading, error } = useInventory();
  
  // 1. Estados de Control
  const [suppliers, setSuppliers] = useState<SupplierMetrics[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 2. Carga de datos con Paginación
  const loadData = useCallback(async (page: number = 1, search: string = '') => {
    try {
      const [suppliersRes, dashboardData] = await Promise.all([
        getSuppliersMetrics({ page, limit: 6, search }), // 6 tarjetas por página queda muy bien visualmente
        getDashboard()
      ]);
      
      // ✅ CORRECCIÓN TS: Accedemos a la propiedad .suppliers del objeto paginado
      setSuppliers(suppliersRes.suppliers);
      setPagination(suppliersRes.pagination);
      setDashboard(dashboardData);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    }
  }, [getSuppliersMetrics, getDashboard]);

  useEffect(() => {
    loadData(currentPage, searchTerm);
  }, [currentPage, searchTerm, loadData]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSupplierClick = (supplierId: string) => {
    router.push(`/dashboard/inventory/${supplierId}`);
  };

  // Helper para formato de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper para etiquetas de estado de importación
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50 border-green-100';
      case 'near_expiry': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'expired': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  // Clase común para botones
  const actionButtonClass = "inline-flex items-center px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all active:scale-95 disabled:opacity-50";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* 🎯 HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Stock Intelligence</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Global dropshipping inventory and supply chain metrics.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={() => router.push('/dashboard/inventory/lots')} className={actionButtonClass}>
            <Package className="h-4 w-4 mr-2 text-blue-600 stroke-[3]" />
            Master List
          </button>

          <button onClick={() => router.push('/dashboard/inventory/lots/new')} className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-lg shadow-blue-900/20 text-xs font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95">
            <Plus className="h-4 w-4 mr-2 stroke-[3]" />
            Entry
          </button>

          <button onClick={() => loadData(currentPage, searchTerm)} disabled={loading} className={actionButtonClass}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : 'text-gray-400'}`} />
            Sync
          </button>
        </div>
      </div>

      {/* 📊 CORE KPIS */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Catalog Scope</p>
                <p className="text-2xl font-black text-gray-900">{dashboard.unique_products}</p>
                <p className="text-[10px] font-bold text-purple-600 mt-1">Unique SKUs</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Tag className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Supply Chain</p>
                <p className="text-2xl font-black text-gray-900">{dashboard.total_suppliers}</p>
                <p className="text-[10px] font-bold text-green-600 mt-1">Active Partners</p>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Asset Value</p>
                <p className="text-2xl font-black text-gray-900">{formatCurrency(dashboard.total_value)}</p>
                <p className="text-[10px] font-bold text-amber-600 mt-1">Estimated Inventory</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* ✅ ACTUALIZADO: ÚLTIMA IMPORTACIÓN CON DETALLE */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm group">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity Pulse</p>
              <History className="h-4 w-4 text-blue-600" />
            </div>
            {dashboard.last_import ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-gray-900 truncate max-w-[120px]">
                    {dashboard.last_import_supplier || 'Unknown'}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border ${getStatusColor(dashboard.last_import_type)}`}>
                    {dashboard.last_import_type?.replace('_', ' ') || 'Process'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-gray-500">
                  {new Date(dashboard.last_import).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <p className="text-xs font-bold text-gray-400 italic">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {/* 🩺 INVENTORY HEALTH GRID */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50/50 border border-green-100 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-700/60 mb-2">Optimal Stock</h4>
              <p className="text-3xl font-black text-green-900">{dashboard.available_lots}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-200" />
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700/60 mb-2">Risk: Near Expiry</h4>
              <p className="text-3xl font-black text-amber-900">{dashboard.near_expiry_lots}</p>
            </div>
            <Calendar className="h-10 w-10 text-amber-200" />
          </div>

          <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700/60 mb-2">Action: Expired</h4>
              <p className="text-3xl font-black text-red-900">{dashboard.expired_lots}</p>
            </div>
            <Package className="h-10 w-10 text-red-200" />
          </div>
        </div>
      )}

      {/* 🔍 SUPPLIER MANAGEMENT TABLE/GRID AREA */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Supplier Directory</h2>
          </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by supplier name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm shadow-sm"
            />
          </div>
        </div>

        {/* 📦 SUPPLIER GRID WITH PAGINATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-gray-100 animate-pulse"></div>
            ))
          ) : suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onClick={handleSupplierClick}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
               <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
               <p className="text-gray-500 font-bold">No suppliers match your search.</p>
            </div>
          )}
        </div>

        {/* 📟 PAGINATION CONTROLS */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2 px-6 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
               <span className="text-xs font-black text-blue-600">{currentPage}</span>
               <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">of {pagination.totalPages}</span>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages || loading}
              className="p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}