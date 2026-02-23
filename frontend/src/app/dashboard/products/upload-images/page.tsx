// frontend/src/app/dashboard/products/upload-images/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductImageUpload } from '@/components/features/products/ProductImageUpload';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Image as ImageIcon,
  Search,
  CheckCircle
} from 'lucide-react';

export default function UploadImagesPage() {
  const router = useRouter();
  
  // 1. Control States
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Optimized Hook
  const { 
    products,
    pagination, 
    stats,
    isLoading,
    isFetching,
    refetch 
  } = useProducts({
    page,
    limit: 10,
    searchTerm: debouncedSearch,
    hasImages: 'without' 
  });

  const totalProducts = stats?.total_products || 0;
  const productsWithImages = stats?.products_with_images || 0;
  const percentageComplete = totalProducts > 0 
    ? Math.round((productsWithImages / totalProducts) * 100) 
    : 0;

  const handleUploadComplete = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-blue-600"/>
            Image Manager
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Drag and drop photos for pending products.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
        >
          Back to Products
        </button>
      </div>

      {/* 📊 Progress Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Visual Catalog Progress</h3>
            <p className="text-gray-500 text-sm mt-1">
              <span className="font-bold text-gray-900">{stats?.products_without_images || 0}</span> pending products.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{percentageComplete}%</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Completed</div>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative"
            style={{ width: `${percentageComplete}%` }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 🔍 Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <input 
            type="text" 
            placeholder="Search product by name or SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>
        <div className="text-sm text-gray-500 font-medium whitespace-nowrap bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
          {pagination?.total || 0} found
        </div>
      </div>

      {/* ✅ PAGINATION CONTROLS (TOP) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <span className="text-sm text-gray-600 font-medium ml-2">
            Page <span className="text-gray-900 font-bold">{pagination.page}</span> of {pagination.totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(1)} 
              disabled={pagination.page === 1 || isFetching}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-600 bg-white"
              title="First page"
            >
              <ChevronsLeft className="h-5 w-5"/>
            </button>
            <button 
              onClick={() => setPage(Math.max(1, page - 1))} 
              disabled={pagination.page === 1 || isFetching}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-600 bg-white"
              title="Previous"
            >
              <ChevronLeft className="h-5 w-5"/>
            </button>
            
            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

            <button 
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} 
              disabled={pagination.page >= pagination.totalPages || isFetching}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-600 bg-white"
              title="Next"
            >
              <ChevronRight className="h-5 w-5"/>
            </button>
            <button 
              onClick={() => setPage(pagination.totalPages)} 
              disabled={pagination.page >= pagination.totalPages || isFetching}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-600 bg-white"
              title="Last page"
            >
              <ChevronsRight className="h-5 w-5"/>
            </button>
          </div>
        </div>
      )}

      {/* 🖼️ Main Upload Area */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-2xl border border-gray-200 border-dashed">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-green-50 rounded-2xl border border-green-100 text-center p-8">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-800">Excellent!</h3>
            <p className="text-green-700 mt-2 max-w-md">
              {searchTerm 
                ? "No pending products found with that name."
                : "You have no products pending images."}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="mt-4 text-sm text-green-700 font-medium hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className={`transition-opacity duration-200 space-y-6 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <ProductImageUpload
              productsWithoutImages={products}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}