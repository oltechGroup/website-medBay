// frontend/src/components/features/categories/CategoryTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories, Category } from '@/hooks/useCategories';
import { 
  Edit3, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  AlertCircle,
  Calendar,
  Layers
} from 'lucide-react';

interface CategoryTableProps {
  onEdit: (category: Category) => void;
}

export const CategoryTable = ({ onEdit }: CategoryTableProps) => {
  const router = useRouter();
  
  // 1. Estados de Control
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 2. Debounce para la búsqueda (Evita peticiones excesivas)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset a pág 1 al buscar
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 3. Hook con Paginación Real
  const { 
    categories, 
    pagination, 
    isLoading, 
    isFetching,
    isPlaceholderData,
    deleteCategory, 
    isDeleting 
  } = useCategories({
    page: currentPage,
    limit: 10,
    searchTerm: debouncedSearch
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage) {
        setCurrentPage(newPage);
    }
  };

  // --- RENDERIZADO DE CARGA ---
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse border border-gray-100"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar Area */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <input
            type="text"
            placeholder="Search category by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          {isFetching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              </div>
          )}
        </div>
      </div>

      {/* Categories List */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No categories found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Your category catalog is empty.'}
            </p>
          </div>
        ) : (
          categories.map((category: Category) => ( // ✅ TIPADO CORREGIDO: category: Category
            <div
              key={category.id}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-black text-gray-900 truncate uppercase tracking-tight">
                        {category.name}
                    </h3>
                    {category.parent_id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100">
                        Sub
                      </span>
                    )}
                  </div>
                  
                  {category.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-1 font-medium italic">
                        "{category.description}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                      <Calendar className="h-3 w-3" />
                      {new Date(category.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    
                    {category.parent_name && (
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100">
                        <Layers className="h-3 w-3" />
                        Parent: {category.parent_name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(category)}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirm(category.id)}
                    disabled={isDeleting}
                    className="p-2.5 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Confirmación de Borrado Integrada */}
              {deleteConfirm === category.id && (
                <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-red-900 uppercase tracking-tight">Delete this category?</p>
                      <p className="text-xs text-red-600 font-medium">Warning: This action is permanent.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        No, cancel
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={isDeleting}
                        className="px-4 py-2 text-xs font-black text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer & Pagination Navigation */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Page {pagination.page} of {pagination.totalPages} • Total {pagination.total} results
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => handlePageChange(1)} 
              disabled={pagination.page === 1 || isFetching}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20 text-gray-600 transition-all"
            >
              <ChevronsLeft className="h-4 w-4"/>
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)} 
              disabled={pagination.page === 1 || isFetching}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20 text-gray-600 transition-all"
            >
              <ChevronLeft className="h-4 w-4"/>
            </button>
            
            <div className="px-4 text-xs font-black text-blue-600">
                {pagination.page}
            </div>

            <button 
              onClick={() => handlePageChange(pagination.page + 1)} 
              disabled={pagination.page >= pagination.totalPages || isFetching}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20 text-gray-600 transition-all"
            >
              <ChevronRight className="h-4 w-4"/>
            </button>
            <button 
              onClick={() => handlePageChange(pagination.totalPages)} 
              disabled={pagination.page >= pagination.totalPages || isFetching}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-20 text-gray-600 transition-all"
            >
              <ChevronsRight className="h-4 w-4"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};