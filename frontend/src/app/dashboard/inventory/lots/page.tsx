// frontend/src/app/dashboard/inventory/lots/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  Building2,
  Layers
} from 'lucide-react';
import { useInventory, ProductLot, PaginationMetadata } from '@/hooks/useInventory';

export default function LotsManagementPage() {
  const router = useRouter();
  const { getLots, deleteLot, loading, error } = useInventory();
  
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [lotToDelete, setLotToDelete] = useState<ProductLot | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- LÓGICA DE CARGA ---

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadLots = useCallback(async () => {
    try {
      const response = await getLots({
        page: currentPage,
        limit: 20,
        search: debouncedSearch,
        status: statusFilter
      });
      setLots(response.lots);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading lots:', err);
    }
  }, [currentPage, debouncedSearch, statusFilter, getLots]);

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteClick = (lot: ProductLot) => setLotToDelete(lot);

  const confirmDelete = async () => {
    if (!lotToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteLot(lotToDelete.id);
      await loadLots();
      setLotToDelete(null);
    } catch (err) {
      console.error('Error deleting lot:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- HELPERS VISUALES ---

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-50 text-green-700 border-green-100';
      case 'near_expiry': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'expired': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 🚀 HEADER - Identidad visual pesada */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Master Inventory</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Full Batch Logistics & Tracking</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/inventory/lots/new')}
            className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg shadow-blue-900/20 text-[10px] font-black uppercase tracking-widest rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2 stroke-[3]" />
            Register Entry
          </button>
          
          <button className="p-3 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 📊 REAL-TIME KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex items-center gap-5 group hover:border-blue-500 transition-all">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Global Scale</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{pagination?.total || 0}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Total Lots</p>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex items-center gap-5 group hover:border-green-500 transition-all">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-all"><Box className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Unit Mass</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{lots.reduce((s, l) => s + l.quantity, 0).toLocaleString()}</p>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Total Units</p>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex items-center gap-5 group hover:border-amber-500 transition-all">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all"><DollarSign className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Page Assets</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(lots.reduce((s, l) => s + (l.quantity * l.price), 0))}</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Current View Value</p>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTER BAR - Cero Transparencias */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row items-center gap-5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, lot number, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-900 placeholder-slate-400 text-sm shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full lg:w-56">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-[10px] uppercase tracking-[0.2em] appearance-none cursor-pointer text-slate-900"
            >
              <option value="all">ALL STATUS</option>
              <option value="available">🟢 OPTIMAL</option>
              <option value="near_expiry">🟡 WARNING</option>
              <option value="expired">🔴 EXPIRED</option>
            </select>
          </div>
          
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
            className="p-4 bg-slate-100 text-slate-500 rounded-[1.5rem] hover:bg-slate-200 transition-all hover:rotate-180 duration-500"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 📋 LOTS TABLE - Estética Pesada */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Entity</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Partner</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capital</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manage</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-50 transition-all duration-300 ${loading ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
              {lots.length > 0 ? (
                lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-blue-50/40 transition-colors group border-transparent">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{lot.product_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-widest border border-slate-200">SKU: {lot.product_code}</span>
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest border border-blue-100">LOT: {lot.lot_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-black uppercase tracking-tight">{lot.supplier_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(lot.status)}`}>
                        <Calendar className="h-3 w-3 mr-2 stroke-[3]" />
                        {formatDate(lot.expiry_date)}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-base font-black text-slate-900 leading-none">{lot.quantity}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Units In Stock</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm font-black text-slate-900 tracking-tight">{formatCurrency(lot.price)}</span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => router.push(`/dashboard/inventory/lots/${lot.id}/edit`)} className="p-2.5 bg-white border-2 border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg rounded-2xl transition-all">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(lot)} className="p-2.5 bg-white border-2 border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 hover:shadow-lg rounded-2xl transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Box className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No records found in this scope</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📟 PREMIUM PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Showing <span className="text-slate-900">{pagination.page}</span> / <span className="text-slate-900">{pagination.totalPages}</span> — <span className="text-blue-600">{pagination.total}</span> Registered Lots
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
                <ChevronsLeft className="h-4 w-4 stroke-[3]" />
              </button>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
                <ChevronLeft className="h-4 w-4 stroke-[3]" />
              </button>
              
              <div className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
                 <span className="text-xs font-black text-slate-900">{currentPage}</span>
              </div>

              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || loading} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </button>
              <button onClick={() => handlePageChange(pagination.totalPages)} disabled={currentPage === pagination.totalPages || loading} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
                <ChevronsRight className="h-4 w-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🎭 MODAL: DELETE - Contraste Máximo */}
      {lotToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] border border-slate-200 w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-[2rem] bg-red-50 text-red-600 mb-8 border border-red-100">
                <Trash2 className="h-10 w-10 stroke-[2.5]" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-3 uppercase">Delete Lot?</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed mb-10 px-4">
                Removal of batch <span className="text-red-600 font-black tracking-widest">{lotToDelete.lot_number}</span> is permanent. This will void <span className="text-slate-900 font-black">{lotToDelete.quantity} units</span> from assets.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="w-full py-5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleteLoading ? 'Processing Destruction...' : 'Confirm Deletion'}
                </button>
                <button
                  onClick={() => setLotToDelete(null)}
                  disabled={deleteLoading}
                  className="w-full py-5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all"
                >
                  Cancel Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}