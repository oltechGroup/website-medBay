// frontend/src/components/features/products/ProductCategoryAssign.tsx

'use client';

import { useState, useEffect } from 'react';
import { useProducts, Product } from '@/hooks/useProducts'; 
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

// --- PROPS DEFINITION ---
interface ProductCategoryAssignProps {
  products: Product[]; 
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
          
          <span className="px-2 text-xs font-bold text-gray-700">{currentPage}</span>

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
export const ProductCategoryAssign = ({ onAssignComplete }: ProductCategoryAssignProps) => {
  // 1. Control States for Products
  // Cambiado por defecto a 'without-categories' para priorizar el trabajo pendiente
  const [viewMode, setViewMode] = useState<'without-categories' | 'all-products'>('without-categories');
  const [productPage, setProductPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setProductPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Products Hook (Real Pagination & Stats)
  const { 
    products, 
    pagination, 
    isLoading: isProductsLoading, 
    isFetching: isProductsFetching,
    stats,
    batchAssignCategories, 
    isBatchAssigning
  } = useProducts({
    page: productPage,
    limit: 20,
    searchTerm: debouncedSearch,
    // ✅ Ahora el backend reconoce 'uncategorized' gracias a nuestra edición previa
    categoryStatus: viewMode === 'without-categories' ? 'uncategorized' : 'all' 
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

  // ✅ DATA REAL: Ahora los stats vienen del backend optimizado
  const totalCount = stats?.total_products || 0;
  const withCount = stats?.with_categories || 0;
  const withoutCount = stats?.without_categories || 0;
  const completionPercentage = totalCount > 0 ? Math.round((withCount / totalCount) * 100) : 0;

  // --- SELECTION HANDLERS ---
  const toggleSelectAllProducts = () => {
    const allVisibleSelected = products.length > 0 && products.every(p => selectedProducts.includes(p.id));
    if (allVisibleSelected) {
      const visibleIds = products.map(p => p.id);
      setSelectedProducts(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
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
      setSelectedProducts([]);
      setSelectedCategories([]);
      setShowConfirmation(false);
      setShowDetails(false);
      if (onAssignComplete) onAssignComplete();
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
      
      {/* 📊 STATS CARDS - Data linked to backend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Total Products</p><p className="text-2xl font-bold text-gray-900">{totalCount}</p></div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Package className="h-6 w-6"/></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Categorized</p><p className="text-2xl font-bold text-green-600">{withCount}</p></div>
            <div className="p-3 bg-green-100 rounded-xl text-green-600"><CheckCircle className="h-6 w-6"/></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-500">Uncategorized</p><p className="text-2xl font-bold text-orange-600">{withoutCount}</p></div>
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><AlertTriangle className="h-6 w-6"/></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between text-sm mb-2"><span className="font-medium text-gray-700">Progress</span><span className="font-bold text-purple-700">{completionPercentage}%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-700" style={{ width: `${completionPercentage}%` }}></div>
            </div>
        </div>
      </div>

      {/* 🎯 SELECTION PANEL (Floating Sticky) */}
      {(selectedProducts.length > 0 || selectedCategories.length > 0) && (
        <div className="bg-slate-900 rounded-xl p-4 shadow-2xl text-white flex flex-col md:flex-row items-center justify-between animate-in slide-in-from-bottom-4 sticky top-4 z-30 border border-slate-700">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Package className="h-5 w-5"/></div>
                <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Products</p><p className="text-lg font-bold">{selectedProducts.length}</p></div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Tags className="h-5 w-5"/></div>
                <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">To Categories</p><p className="text-lg font-bold">{selectedCategories.length}</p></div>
            </div>
          </div>
          <button 
            onClick={() => setShowConfirmation(true)} 
            disabled={isBatchAssigning || selectedProducts.length === 0 || selectedCategories.length === 0} 
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
          >
            {isBatchAssigning ? 'Processing...' : 'Apply Selection'}
            {!isBatchAssigning && <ChevronRight className="h-4 w-4"/>}
          </button>
        </div>
      )}

      {/* 📦 MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* COLUMN 1: PRODUCTS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col h-[700px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
             <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Products</h3>
                {isProductsFetching && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full animate-pulse font-bold uppercase">Syncing...</span>}
             </div>
             <div className="flex gap-2">
                 <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                     <button 
                        onClick={() => { setViewMode('without-categories'); setProductPage(1); }} 
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === 'without-categories' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        Uncategorized
                     </button>
                     <button 
                        onClick={() => { setViewMode('all-products'); setProductPage(1); }} 
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === 'all-products' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        All
                     </button>
                 </div>
                 <button onClick={toggleSelectAllProducts} className="text-[10px] font-bold uppercase text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    {products.length > 0 && products.every(p => selectedProducts.includes(p.id)) ? 'Deselect Page' : 'Select Page'}
                 </button>
             </div>
          </div>
          
          <div className="relative mb-4">
             <input 
                type="text" 
                placeholder="Search products by name or SKU..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-sm shadow-sm transition-all"
             />
             <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar relative">
             {isProductsLoading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Loading Inventory</p>
                 </div>
             ) : products.length === 0 ? (
                 <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No products found.</p>
                    {viewMode === 'without-categories' && <p className="text-xs mt-1 text-green-600 font-medium">Excellent! Everything is categorized.</p>}
                 </div>
             ) : (
                 products.map(product => (
                     <div 
                        key={product.id} 
                        onClick={() => toggleProduct(product.id)} 
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3 group ${selectedProducts.includes(product.id) ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                     >
                         <div className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedProducts.includes(product.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                            {selectedProducts.includes(product.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                         </div>
                         <div className="min-w-0">
                             <h4 className={`font-bold text-sm truncate ${selectedProducts.includes(product.id) ? 'text-blue-900' : 'text-slate-800'}`}>{product.description}</h4>
                             <p className="text-[10px] text-slate-400 mt-0.5 font-mono font-bold uppercase tracking-tighter">SKU: {product.global_sku || 'N/A'}</p>
                             {product.category_names && product.category_names.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-2">
                                     {product.category_names.slice(0, 2).map((cat, idx) => (
                                         <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                             {cat}
                                         </span>
                                     ))}
                                     {product.category_names.length > 2 && (
                                         <span className="text-[9px] font-bold text-slate-400">+{product.category_names.length - 2} more</span>
                                     )}
                                 </div>
                             )}
                         </div>
                     </div>
                 ))
             )}
          </div>
          
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
               <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Categories</h3>
               <button onClick={toggleSelectAllCategories} className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                   {selectedCategories.length === filteredCategories.length && filteredCategories.length > 0 ? 'Deselect All' : 'Select All'}
               </button>
           </div>

           <div className="relative mb-4">
               <input 
                  type="text" 
                  placeholder="Search categories..." 
                  value={categorySearch} 
                  onChange={(e) => setCategorySearch(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 placeholder-gray-400 text-sm shadow-sm transition-all"
               />
               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
               {isCategoriesLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Loading Catalog</p>
                    </div>
               ) : filteredCategories.length === 0 ? (
                   <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                       <p className="text-sm font-bold text-slate-500">No categories found.</p>
                   </div>
               ) : (
                   filteredCategories.map(category => (
                       <div key={category.id} onClick={() => toggleCategory(category.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 group ${selectedCategories.includes(category.id) ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'}`}>
                           <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedCategories.includes(category.id) ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-gray-300 group-hover:border-emerald-400'}`}>
                               {selectedCategories.includes(category.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                           </div>
                           <h4 className={`font-bold text-sm ${selectedCategories.includes(category.id) ? 'text-emerald-900' : 'text-slate-800'}`}>{category.name}</h4>
                       </div>
                   ))
               )}
           </div>
           
           <div className="pt-4 mt-auto border-t border-gray-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total {filteredCategories.length} categories available</span>
           </div>
        </div>
      </div>

      {/* 🎭 CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${showDetails ? 'w-full max-w-4xl h-[600px]' : 'w-full max-w-md'}`}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Confirm Assignment</h3>
                  <button onClick={() => setShowConfirmation(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="h-5 w-5 text-slate-500"/></button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                  {!showDetails ? (
                      <div className="text-center">
                          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                             <Tags size={40} />
                          </div>
                          <p className="text-slate-600 text-lg leading-relaxed">
                            You are about to assign <span className="font-black text-blue-600 underline decoration-2 underline-offset-4">{selectedCategories.length} categories</span> to <span className="font-black text-slate-900">{selectedProducts.length} products</span>.
                          </p>
                          <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">A total of {selectedCategories.length * selectedProducts.length} relations will be created.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 gap-8 h-full">
                          <div className="flex flex-col h-full">
                              <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Selected Products ({selectedProducts.length})</h4>
                              <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                  {selectedProductNames.map((name, i) => <div key={i} className="text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 truncate">{name}</div>)}
                              </div>
                          </div>
                          <div className="flex flex-col h-full">
                              <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Target Categories ({selectedCategories.length})</h4>
                              <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                  {selectedCategoryNames.map((name, i) => <div key={i} className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">{name}</div>)}
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end items-center">
                  <button onClick={() => setShowDetails(!showDetails)} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-2 mr-auto transition-colors tracking-widest">
                      {showDetails ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>} {showDetails ? 'Hide list' : 'View full list'}
                  </button>
                  <button onClick={() => setShowConfirmation(false)} className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
                  <button onClick={handleAssign} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">Confirm Assignment</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};