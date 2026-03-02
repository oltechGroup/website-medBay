// frontend/src/app/dashboard/inventory/[supplier_id]/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building, 
  Package, 
  Calendar, 
  ArrowLeft,
  ArrowRight,
  Tag,
  BarChart3,
  Upload,
  Eye,
  DollarSign,
  Box,
  ShoppingCart,
  RefreshCw,
  Clock,
  Stethoscope // ✅ IMPORTADO PARA EQUIPMENT
} from 'lucide-react';
import { useInventory, SupplierMetrics } from '@/hooks/useInventory';
import Link from 'next/link';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getSuppliersMetrics, loading } = useInventory();
  
  const [supplier, setSupplier] = useState<SupplierMetrics | null>(null);

  const loadSupplierData = useCallback(async () => {
    try {
      const response = await getSuppliersMetrics({ limit: 100 }); 
      const foundSupplier = response.suppliers.find((s: SupplierMetrics) => s.id === params.supplier_id);
      setSupplier(foundSupplier || null);
    } catch (error) {
      console.error('Error loading supplier data:', error);
    }
  }, [getSuppliersMetrics, params.supplier_id]);

  useEffect(() => {
    loadSupplierData();
  }, [loadSupplierData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading && !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-12 text-center">
        <div className="bg-white rounded-[2.5rem] border border-gray-200 p-12 max-w-xl mx-auto shadow-sm">
          <Building className="h-16 w-16 text-gray-200 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Supplier Not Found</h3>
          <p className="text-gray-500 font-medium mb-8 text-sm">The requested entity is not available in the current scope.</p>
          <button
            onClick={() => router.push('/dashboard/inventory')}
            className="inline-flex items-center px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2 stroke-[3]" />
            Return to Inventory
          </button>
        </div>
      </div>
    );
  }

  const totalLots = supplier.total_lots || 1;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      
      {/* 🚀 HEADER AREA */}
      <div className="space-y-6">
        <button
          onClick={() => router.push('/dashboard/inventory')}
          className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform stroke-[3]" />
          Back to Global Inventory
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-200">
              <Building className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{supplier.supplier_name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supply Partner</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active Connection</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              href={`/dashboard/import?supplier_id=${supplier.id}`}
              className="inline-flex items-center px-6 py-3 border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <Upload className="h-4 w-4 mr-2 stroke-[3] text-blue-600" />
              Import Data
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 CORE PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm group hover:border-blue-200 transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Stock Diversity</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{supplier.unique_products}</p>
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-tight">Unique SKUs</p>
            </div>
            <Tag className="h-8 w-8 text-purple-100 group-hover:text-purple-500 transition-colors" />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm group hover:border-blue-200 transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Operational Batches</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{supplier.active_lots}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Active Lots</p>
            </div>
            <Box className="h-8 w-8 text-blue-100 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm group hover:border-blue-200 transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Volume Mass</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{supplier.total_units?.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-tight">Total Units</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-100 group-hover:text-green-500 transition-colors" />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm group hover:border-blue-200 transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Asset Value</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(supplier.total_value)}</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Estimated Capital</p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-100 group-hover:text-amber-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* 🩺 INVENTORY HEALTH & NAVIGATION - ✅ AHORA 4 COLUMNAS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Health Distribution</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Optimal', val: supplier.available_lots, desc: 'Ready for market', col: 'green', link: 'available', icon: Package },
            { title: 'Warning', val: supplier.near_expiry_lots, desc: 'Short-dated risk', col: 'amber', link: 'near-expiry', icon: Clock },
            { title: 'Alert', val: supplier.expired_lots, desc: 'Expired units', col: 'red', link: 'expired', icon: Tag },
            { title: 'Equip', val: supplier.equipment_lots || 0, desc: 'Instruments & Tech', col: 'blue', link: 'equipment', icon: Stethoscope } // ✅ NUEVO
          ].map((status) => (
            <Link key={status.title} href={`/dashboard/inventory/${supplier.id}/${status.link}`} className="group">
              <div className={`bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden h-full flex flex-col justify-between`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{status.title}</h3>
                    <p className="text-sm font-bold text-slate-600 italic mt-1">{status.desc}</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    status.col === 'green' ? 'bg-green-50 text-green-600 border-green-100' : 
                    status.col === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    status.col === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-red-50 text-red-600 border-red-100'
                  } border`}>
                    <status.icon className="h-5 w-5 stroke-[3]" />
                  </div>
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <span className={`text-5xl font-black text-slate-900 tracking-tighter transition-colors`}>{status.val}</span>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:translate-x-2 transition-transform">
                    View
                    <ArrowRight className="h-3 w-3 stroke-[4]" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 🔮 VISUAL TIMELINE PROGRESS */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Inventory Composition</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time batch synchronization</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Activity Record</p>
              <p className="text-sm font-bold text-white mt-1">
                {supplier.last_import ? new Date(supplier.last_import).toLocaleString() : 'No data'}
              </p>
            </div>
          </div>

          {/* ✅ BARRA DE PROGRESO ACTUALIZADA (Añadido Equipo) */}
          <div className="flex w-full bg-white/10 rounded-full h-4 overflow-hidden mb-6 border border-white/5">
            <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${(supplier.available_lots/totalLots)*100}%` }} />
            <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${(supplier.near_expiry_lots/totalLots)*100}%` }} />
            <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${(supplier.expired_lots/totalLots)*100}%` }} />
            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${((supplier.equipment_lots || 0)/totalLots)*100}%` }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Optimal: {Math.round((supplier.available_lots/totalLots)*100)}%</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Risk: {Math.round((supplier.near_expiry_lots/totalLots)*100)}%</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Alert: {Math.round((supplier.expired_lots/totalLots)*100)}%</span>
            </div>
            {/* ✅ LEYENDA PARA EQUIPO */}
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Equip: {Math.round(((supplier.equipment_lots || 0)/totalLots)*100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}