// frontend/src/components/features/products/ProductCategoryAssign.tsx

'use client';

import { useState, useEffect } from 'react';
import { useProducts, Product } from '@/hooks/useProducts'; // Asegúrate de importar el tipo Product si existe
import { useCategories } from '@/hooks/useCategories';
import { 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Tags, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  Eye, 
  EyeOff, 
  X
} from 'lucide-react';

// --- PROPS DEFINITION TO FIX TYPESCRIPT ERROR ---
interface ProductCategoryAssignProps {
  products: any[]; // Cambia 'any' por 'Product' si lo tienes exportado en useProducts
  onAssignComplete: () => void;
}

// --- REUSABLE PAGINATION COMPONENT ---
const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems,
  isLoading
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (p: number) => void, 
  totalItems: number,
  isLoading?: boolean
}) => (
  <div className="pt-4 mt-auto border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
      <span className="text-xs text-gray-500 font-medium">
        {isLoading ? 'Loading...' : `Page ${currentPage} of ${totalPages} (${totalItems} items)`}
      </span>
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
          <button 
            onClick={() => onPageChange(1)} 
            disabled={currentPage === 1 || isLoading}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-gray-600"
            title="First page"
          >
              <ChevronsLeft className="h-4 w-4"/>
          </button>
          <button 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
            disabled={currentPage === 1 || isLoading}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-gray-600"
            title="Previous"
          >
              <ChevronLeft className="h-4 w-4"/>
          </button>
          <button 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-gray-600"
            title="Next"
          >
              <ChevronRight className="h-4 w-4"/>
          </button>
          <button 
            onClick={() => onPageChange(totalPages)} 
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-gray-600"
            title="Last page"
          >
              <ChevronsRight className="h-4 w-4"/>
          </button>
      </div>
  </div>
);

// --- MAIN COMPONENT ---
// Añadimos las props definidas aquí:
export const ProductCategoryAssign = ({ products: initialProducts, onAssignComplete }: ProductCategoryAssignProps) => {
  // 1. Control States for Products
  const [viewMode, setViewMode] = useState<'without-categories' | 'all-products'>('without-categories');
  const [productPage, setProductPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce for search (waits 500ms before requesting server)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setProductPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Products Hook (Real Pagination)
  const { 
    products, 
    pagination, 
    isLoading: isProductsLoading, 
    isFetching: isProductsFetching,
    stats,
    batchAssignCategories, 
    isBatchAssigning,
    refetch 
  } = useProducts({
    page: productPage,
    limit: 20,
    searchTerm: debouncedSearch,
    categoryStatus: viewMode === 'without-categories' ? 'uncategorized' : 'all' // ✅ Send filter to backend
  });

  // 3. Categories Hook
  const { categories, isLoading: isCategoriesLoading } = useCategories(); 
  const [categorySearch, setCategorySearch] = useState('');
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Selection States
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // UI States
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Global Stats
  const totalCount = stats?.total_products || 0;
  const withCount = stats?.with_categories || 0;
  const withoutCount = stats?.without_categories || 0;
  const completionPercentage = totalCount > 0 ? Math.round((withCount / totalCount) * 100) : 0;

  // --- SELECTION HANDLERS ---
  
  // ✅ Selects only what's visible on current page (Security)
  const toggleSelectAllProducts = () => {
    const allVisibleSelected = products.length > 0 && products.every(p => selectedProducts.includes(p.id));
    
    if (allVisibleSelected) {
      // Remove visible products from current selection
      const visibleIds = products.map(p => p.id);
      setSelectedProducts(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Add missing visible products
      const visibleIds = products.map(p => p.id);
      const newSelection = [...new Set([...selectedProducts, ...visibleIds])];
      setSelectedProducts(newSelection);
    }
  };

  const toggleSelectAllCategories = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c.id));
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  // --- ASSIGNMENT HANDLER ---
  const handleAssign = async () => {
    if (selectedProducts.length === 0 || selectedCategories.length === 0) return;
    
    try {
      await batchAssignCategories(selectedProducts, selectedCategories);
      
      // Clear and Refresh
      setSelectedProducts([]);
      setSelectedCategories([]);
      setShowConfirmation(false);
      setShowDetails(false);
      
      // Llamamos a la función inyectada para actualizar la vista principal
      if (onAssignComplete) {
        onAssignComplete();
      }
      
    } catch (error) {
      console.error(error);
      alert('Error assigning categories');
    }
  };

  const selectedProductNames = products
    .filter(p => selectedProducts.includes(p.id))
    .map(p => p.description);
    
  const selectedCategoryNames = categories
    .filter(c => selectedCategories.includes(c.id))
    .map(c => c.name);

  return (
    <div className="space-y-6">
      
      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Total Products</p><p className="text-2xl font-bold text-gray-900">{totalCount}</p></div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Package className="h-6 w-6"/></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">With Category</p><p className="text-2xl font-bold text-green-600">{withCount}</p></div>
            <div className="p-3 bg-green-100 rounded-xl text-green-600"><CheckCircle className="h-6 w-6"/></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Without Category</p><p className="text-2xl font-bold text-orange-600">{withoutCount}</p></div>
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><AlertTriangle className="h-6 w-6"/></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between text-sm mb-2"><span className="font-medium text-gray-700">Progress</span><span className="font-bold text-purple-700">{completionPercentage}%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden"><div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div></div>
        </div>
      </div>

      {/* 🔮 LARGE PROGRESS BAR */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-lg font-bold text-gray-900">Categorization Progress</h3><p className="text-gray-600 mt-1 text-sm">{withCount} of {totalCount} classified products.</p></div>
          <div className="text-right"><div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div><div className="text-xs text-gray-500 font-medium uppercase">Completed</div></div>
        </div>
        <div className="w-full bg-white rounded-full h-4 border border-blue-100 p-0.5"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 shadow-sm" style={{ width: `${completionPercentage}%` }}></div></div>
      </div>

      {/* 🎯 SELECTION PANEL */}
      {(selectedProducts.length > 0 || selectedCategories.length > 0) && (
        <div className="bg-blue-600 rounded-xl p-4 shadow-lg text-white flex flex-col md:flex-row items-center justify-between animate-in slide-in-from-bottom-4 sticky top-4 z-30">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Package className="h-5 w-5"/></div>
                <div><p className="text-xs text-blue-100 uppercase font-bold">Products</p><p className="text-lg font-bold">{selectedProducts.length} <span className="text-sm font-normal opacity-80">selected</span></p></div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Tags className="h-5 w-5"/></div>
                <div><p className="text-xs text-blue-100 uppercase font-bold">Categories</p><p className="text-lg font-bold">{selectedCategories.length} <span className="text-sm font-normal opacity-80">selected</span></p></div>
            </div>
          </div>
          <button onClick={() => setShowConfirmation(true)} disabled={isBatchAssigning || selectedProducts.length === 0 || selectedCategories.length === 0} className="px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-bold transition-colors shadow-sm flex items-center gap-2">
            {isBatchAssigning ? 'Processing...' : 'Apply Categories'}
            {!isBatchAssigning && <ChevronRight className="h-4 w-4"/>}
          </button>
        </div>
      )}

      {/* 📦 MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* COLUMN 1: PRODUCTS (PAGINATED FROM BACKEND) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col h-[700px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
             <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Package className="h-5 w-5 text-gray-500"/> Products</h3>
                {isProductsFetching && <span className="text-xs text-blue-500 animate-pulse font-medium">Updating...</span>}
             </div>
             <div className="flex gap-2">
                 <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                     <button 
                        onClick={() => { setViewMode('without-categories'); setProductPage(1); }} 
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'without-categories' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        No Cat
                     </button>
                     <button 
                        onClick={() => { setViewMode('all-products'); setProductPage(1); }} 
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'all-products' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        All
                     </button>
                 </div>
                 <button onClick={toggleSelectAllProducts} className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100">
                    {products.length > 0 && products.every(p => selectedProducts.includes(p.id)) ? 'Deselect' : 'Select'} page
                 </button>
             </div>
          </div>
          
          {/* Product Search (Backend) */}
          <div className="relative mb-4">
             <input 
                type="text" 
                placeholder="🔍 Search products (Enter to search)..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-sm shadow-sm"
             />
             <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar relative">
             {isProductsLoading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                     <p className="text-sm text-gray-500">Loading products...</p>
                 </div>
             ) : products.length === 0 ? (
                 <div className="text-center py-10 text-gray-400">
                    <p>No products found.</p>
                    {viewMode === 'without-categories' && <p className="text-xs mt-2 text-green-600">Excellent! Everything is categorized.</p>}
                 </div>
             ) : (
                 products.map(product => (
                     <div 
                        key={product.id} 
                        onClick={() => toggleProduct(product.id)} 
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3 group ${selectedProducts.includes(product.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50'}`}
                     >
                         <div className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedProducts.includes(product.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                            {selectedProducts.includes(product.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                         </div>
                         <div>
                             <h4 className={`font-semibold text-sm ${selectedProducts.includes(product.id) ? 'text-blue-900' : 'text-gray-900'}`}>{product.description}</h4>
                             <p className="text-xs text-gray-500 mt-0.5 font-mono">SKU: {product.global_sku || 'N/A'}</p>
                             {product.category_ids && product.category_ids.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-1">
                                     {product.category_names?.slice(0, 2).map((cat, idx) => (
                                         <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                                             {cat}
                                         </span>
                                     ))}
                                     {(product.category_names?.length || 0) > 2 && (
                                         <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                             +{(product.category_names?.length || 0) - 2}
                                         </span>
                                     )}
                                 </div>
                             )}
                         </div>
                     </div>
                 ))
             )}
          </div>
          
          {/* Product Pagination */}
          <PaginationControls 
             currentPage={pagination.page} 
             totalPages={pagination.totalPages} 
             onPageChange={setProductPage}
             totalItems={pagination.total} 
             isLoading={isProductsLoading || isProductsFetching}
          />
        </div>

        {/* COLUMN 2: CATEGORIES */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col h-[700px]">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Tags className="h-5 w-5 text-gray-500"/> Categories</h3>
               <button onClick={toggleSelectAllCategories} className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                   {selectedCategories.length === filteredCategories.length && filteredCategories.length > 0 ? 'Deselect' : 'Select'} visible
               </button>
           </div>

           <div className="relative mb-4">
               <input 
                  type="text" 
                  placeholder="🔍 Search categories..." 
                  value={categorySearch} 
                  onChange={(e) => setCategorySearch(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-400 text-sm shadow-sm"
               />
               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
               {isCategoriesLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
                        <p className="text-sm">Loading categories...</p>
                    </div>
               ) : filteredCategories.length === 0 ? (
                   <div className="text-center py-10 text-gray-400"><p>No categories found.</p></div>
               ) : (
                   filteredCategories.map(category => (
                       <div key={category.id} onClick={() => toggleCategory(category.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 group ${selectedCategories.includes(category.id) ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200 hover:bg-gray-50'}`}>
                           <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedCategories.includes(category.id) ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`}>
                               {selectedCategories.includes(category.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                           </div>
                           <h4 className={`font-semibold text-sm ${selectedCategories.includes(category.id) ? 'text-green-900' : 'text-gray-900'}`}>{category.name}</h4>
                       </div>
                   ))
               )}
           </div>
           
           <div className="pt-4 mt-auto border-t border-gray-100 text-center">
                <span className="text-xs text-gray-500 font-medium">Showing {filteredCategories.length} categories</span>
           </div>
        </div>
      </div>

      {/* 🎭 CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${showDetails ? 'w-full max-w-4xl h-[600px]' : 'w-full max-w-md'}`}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">Confirm Assignment</h3>
                  <button onClick={() => setShowConfirmation(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6"/></button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                  {!showDetails ? (
                      <div className="text-center py-4">
                          <p className="text-gray-600 text-lg mb-2">Assign <span className="font-bold text-green-600 mx-1">{selectedCategories.length} categories</span> to <span className="font-bold text-blue-600 mx-1">{selectedProducts.length} products</span>.</p>
                          <p className="text-sm text-gray-500">This will create <strong>{selectedCategories.length * selectedProducts.length} new relations</strong>.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 gap-6 h-full">
                          <div className="border border-gray-200 rounded-xl p-4 flex flex-col h-full bg-white">
                              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Package className="h-4 w-4"/> Products ({selectedProducts.length})</h4>
                              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar border-t pt-2">
                                  {selectedProductNames.length > 0 
                                    ? selectedProductNames.map((name, i) => <div key={i} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{name}</div>)
                                    : <div className="text-xs text-gray-400 italic">Product names from other pages are not shown here, but will be processed.</div>
                                  }
                              </div>
                          </div>
                          <div className="border border-gray-200 rounded-xl p-4 flex flex-col h-full bg-white">
                              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Tags className="h-4 w-4"/> Categories ({selectedCategories.length})</h4>
                              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar border-t pt-2">
                                  {selectedCategoryNames.map((name, i) => <div key={i} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{name}</div>)}
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-end items-center">
                  <button onClick={() => setShowDetails(!showDetails)} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 mr-auto transition-colors">
                      {showDetails ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>} {showDetails ? 'Hide details' : 'View details'}
                  </button>
                  <button onClick={() => setShowConfirmation(false)} className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={handleAssign} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all">Confirm Assignment</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};