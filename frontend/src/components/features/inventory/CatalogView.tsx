// frontend/src/components/features/inventory/CatalogView.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  DollarSign, 
  Box, 
  BarChart3, 
  RefreshCw,
  Package, 
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid
} from 'lucide-react';
import { useInventory, ProductLot, PaginationMetadata } from '@/hooks/useInventory';
import { ProductCard } from '@/components/features/inventory/ProductCard';

interface CatalogViewProps {
  supplierId: string;
  status: 'available' | 'near_expiry' | 'expired' | 'equipment'; // ✅ AÑADIDO 'equipment'
  title: string;
  description: string;
  colorScheme: {
    primary: 'green' | 'amber' | 'red' | 'blue'; // ✅ AÑADIDO 'blue'
    icon: React.ComponentType<any>;
    defaultSort: string;
  };
}

export const CatalogView: React.FC<CatalogViewProps> = ({ 
  supplierId, 
  status, 
  title, 
  description, 
  colorScheme 
}) => {
  const router = useRouter();
  const { getCatalogBySupplier, loading, error } = useInventory();
  
  // 1. Estados de Datos
  const [products, setProducts] = useState<ProductLot[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 2. Estados de Filtro Local (El servidor filtra por Status, nosotros por texto aquí)
  const [filteredProducts, setFilteredProducts] = useState<ProductLot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(colorScheme.defaultSort);

  // 3. Carga de Datos Paginada
  const loadProducts = useCallback(async () => {
    try {
      const response = await getCatalogBySupplier(supplierId, status, {
        page: currentPage,
        limit: 20
      });
      
      // ✅ CORRECCIÓN TS: Extraemos .lots y .pagination
      setProducts(response.lots);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }, [supplierId, status, currentPage, getCatalogBySupplier]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 4. Filtrado y Ordenamiento Local (Sobre la página actual)
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.product_name?.toLowerCase().includes(lowerTerm) ||
        p.product_code?.toLowerCase().includes(lowerTerm)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.product_name || '').localeCompare(b.product_name || '');
        case 'price': return (a.price || 0) - (b.price || 0);
        case 'quantity': return (b.quantity || 0) - (a.quantity || 0);
        case 'expiry': return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        default: return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helpers visuales de color
  const getColorClasses = (type: 'bg' | 'text' | 'border' | 'btn') => {
    const theme = {
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', btn: 'bg-green-600 hover:bg-green-700' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', btn: 'bg-amber-600 hover:bg-amber-700' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', btn: 'bg-red-600 hover:bg-red-700' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', btn: 'bg-blue-600 hover:bg-blue-700' } // ✅ AÑADIDO 'blue'
    }[colorScheme.primary];
    return theme[type];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0
    }).format(amount);
  };

  const Icon = colorScheme.icon;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* 🚀 HEADER AREA */}
      <div className="space-y-6">
        <button
          onClick={() => router.push(`/dashboard/inventory/${supplierId}`)}
          className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform stroke-[3]" />
          Return to Partner Detail
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-[2rem] shadow-xl ${getColorClasses('bg')} ${getColorClasses('text')} border-2 ${getColorClasses('border')}`}>
              <Icon className="h-10 w-10 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{title}</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{description}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadProducts}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-gray-50 transition-all active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 mr-2 stroke-[3] ${loading ? 'animate-spin' : ''}`} />
              Re-Sync
            </button>
            <button className="inline-flex items-center px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">
              <Download className="h-4 w-4 mr-2 stroke-[3]" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* 📊 CATALOG KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${getColorClasses('bg')} ${getColorClasses('text')}`}><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Batch Count</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{pagination?.total || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Tag className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Unique Items</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{new Set(products.map(p => p.product_code)).size}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Box className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Stock Mass</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{products.reduce((s, p) => s + (p.quantity || 0), 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><DollarSign className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Asset Value</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(products.reduce((s, p) => s + ((p.quantity || 0) * (p.price || 0)), 0))}</p>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTERS - CERO TRANSPARENCIAS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row items-center gap-5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search within this catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-900 placeholder-slate-400 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full lg:w-56">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-[10px] uppercase tracking-[0.2em] appearance-none cursor-pointer text-slate-900"
            >
              <option value="name">SORT BY NAME</option>
              <option value="price">SORT BY PRICE</option>
              <option value="quantity">SORT BY QUANTITY</option>
              <option value="expiry">SORT BY EXPIRY</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📦 PRODUCT GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-300">
           <LayoutGrid className="h-16 w-16 text-slate-200 mx-auto mb-6" />
           <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No entries found</h3>
        </div>
      )}

      {/* 📟 PAGINATION CONTROLS */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-10">
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
            <ChevronsLeft className="h-5 w-5 stroke-[3]" />
          </button>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
            <ChevronLeft className="h-5 w-5 stroke-[3]" />
          </button>
          
          <div className="flex items-center gap-2 px-8 py-3 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
             <span className="text-sm font-black text-slate-900">{currentPage}</span>
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">of {pagination.totalPages}</span>
          </div>

          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
            <ChevronRight className="h-5 w-5 stroke-[3]" />
          </button>
          <button onClick={() => handlePageChange(pagination.totalPages)} disabled={currentPage === pagination.totalPages} className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:text-blue-600 disabled:opacity-20 transition-all shadow-sm">
            <ChevronsRight className="h-5 w-5 stroke-[3]" />
          </button>
        </div>
      )}
    </div>
  );
};