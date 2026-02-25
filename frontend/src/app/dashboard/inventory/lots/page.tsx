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
  Building2
} from 'lucide-react';
import { useInventory, ProductLot, PaginationMetadata } from '@/hooks/useInventory';

export default function LotsManagementPage() {
  const router = useRouter();
  const { getLots, deleteLot, loading, error } = useInventory();
  
  // 1. Estados de Datos y Paginación
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 2. Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 3. Modales
  const [lotToDelete, setLotToDelete] = useState<ProductLot | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- LÓGICA DE CARGA ---

  // Debounce para búsqueda (evita saturar el servidor)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset al buscar
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
      
      // ✅ CORRECCIÓN TS: Extraemos data y pagination del objeto PaginatedLots
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

  // --- HANDLERS ---

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
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
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
      
      {/* 🚀 HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-200">
            <Package className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Master Inventory</h1>
            <p className="text-sm text-gray-500 font-medium">Control and tracking of every batch in MedBay.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/inventory/lots/new')}
            className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg shadow-blue-900/20 text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2 stroke-[3]" />
            Register Lot
          </button>
          
          <button className="p-3 bg-white border border-gray-200 text-gray-400 rounded-2xl hover:text-gray-900 hover:border-gray-900 transition-all">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 📊 REAL-TIME SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Lots</p>
            <p className="text-xl font-black text-gray-900">{pagination?.total || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Box className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Volume</p>
            <p className="text-xl font-black text-gray-900">{lots.reduce((s, l) => s + l.quantity, 0).toLocaleString()} <span className="text-xs font-bold text-gray-400">Units</span></p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><DollarSign className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Page Value</p>
            <p className="text-xl font-black text-gray-900">{formatCurrency(lots.reduce((s, l) => s + (l.quantity * l.price), 0))}</p>
          </div>
        </div>
      </div>

      {/* 🔍 FILTER BAR */}
      <div className="bg-white rounded-[2rem] border border-gray-200 p-4 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, lot number, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-xs uppercase tracking-widest appearance-none"
            >
              <option value="all">ALL STATUS</option>
              <option value="available">ON DATE</option>
              <option value="near_expiry">NEAR EXPIRY</option>
              <option value="expired">EXPIRED</option>
            </select>
          </div>
          
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
            className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 📋 LOTS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Detail</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Partner</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Expiration</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inventory</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Unit Cost</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-50 transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
              {lots.length > 0 ? (
                lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{lot.product_name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">SKU: {lot.product_code}</span>
                          <span className="text-[10px] font-black text-blue-600">LOT: {lot.lot_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-3 w-3" />
                        <span className="text-xs font-bold">{lot.supplier_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(lot.status)}`}>
                        <Calendar className="h-3 w-3 mr-1.5" />
                        {formatDate(lot.expiry_date)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{lot.quantity}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Available Units</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-gray-900">{formatCurrency(lot.price)}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => router.push(`/dashboard/inventory/lots/${lot.id}/edit`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(lot)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Box className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No lots found in this scope</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📟 PREMIUM PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Lots)
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-all">
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-4 text-xs font-black text-blue-600">{currentPage}</div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || loading} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => handlePageChange(pagination.totalPages)} disabled={currentPage === pagination.totalPages || loading} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-all">
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🎭 DELETE MODAL */}
      {lotToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-red-50 text-red-600 mb-6 border border-red-100">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Delete Inventory Lot?</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                You are about to remove lot <span className="text-red-600 font-bold">{lotToDelete.lot_number}</span> from the system. This will subtract <span className="font-bold">{lotToDelete.quantity} units</span> permanently.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="w-full py-4 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                >
                  {deleteLoading ? 'Processing...' : 'Confirm Deletion'}
                </button>
                <button
                  onClick={() => setLotToDelete(null)}
                  disabled={deleteLoading}
                  className="w-full py-4 bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Keep this lot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}