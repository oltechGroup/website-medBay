//frontend/src/components/features/products/client/ClientSearch.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronRight, Package, Loader2 } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts"; 
import { getImageUrl, formatCurrency } from "@/lib/formatters";
import { ProductQuickView } from "./ProductQuickView"; 

export const ClientSearch = () => {
  const router = useRouter();
  
  // Search management states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // State to control the Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // DEBOUNCE logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hook connected to the Real API
  const { products, pagination, isLoading } = useProducts({
    searchTerm: debouncedTerm,
    limit: 15, 
    page: 1
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/products?search=${searchTerm}`);
      setIsActive(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product); 
    setIsActive(false); 
  };

  return (
    // Z-INDEX 50
    <div ref={containerRef} className="relative z-50 w-full max-w-2xl mx-auto">
      
      {/* --- INPUT BAR --- */}
      <div className={`
        relative flex items-center bg-white transition-all duration-300
        ${isActive ? 'rounded-t-2xl shadow-2xl ring-2 ring-blue-100' : 'rounded-2xl shadow-xl'}
      `}>
        {/* Adjustment: Responsive padding for icon */}
        <div className="pl-4 md:pl-6 text-gray-400">
          {isLoading && searchTerm !== debouncedTerm ? (
             <Loader2 size={20} className="animate-spin text-blue-500 md:w-[22px] md:h-[22px]" />
          ) : (
             <Search size={20} className="md:w-[22px] md:h-[22px]" />
          )}
        </div>
        
        <input 
          type="text" 
          placeholder="Search product, SKU..." 
          // Adjustment: text-base on mobile prevents iOS zoom. Reduced padding.
          className="w-full p-3 md:p-5 text-gray-800 outline-none text-base md:text-lg placeholder:text-gray-400 bg-transparent font-medium"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsActive(true);
          }}
          onFocus={() => setIsActive(true)}
          onKeyDown={handleKeyDown}
        />

        {searchTerm && (
          <button 
            onClick={() => { setSearchTerm(""); setDebouncedTerm(""); }}
            className="p-2 mr-1 md:mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        )}

        {/* Adjustment: More compact button on mobile */}
        <button 
          onClick={handleSearch} 
          className="mr-2 bg-blue-600 text-white font-bold py-2 px-4 md:py-3 md:px-8 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform active:scale-95 text-sm md:text-base whitespace-nowrap"
        >
          Search
        </button>
      </div>

      {/* --- RESULTS DROPDOWN --- */}
      {isActive && debouncedTerm && (
        <div className="absolute top-full left-0 w-full bg-white rounded-b-2xl shadow-2xl border-t border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin" size={24} />
              <p className="text-sm font-medium">Searching...</p>
            </div>
          ) : products && products.length > 0 ? (
            <>
              {/* Scrollable Container - Adjustment: max-h vh on mobile for keyboards */}
              <div className="max-h-[50vh] md:max-h-[380px] overflow-y-auto custom-scrollbar">
                {products.map((prod) => (
                  <div 
                    key={prod.id}
                    onClick={() => handleProductClick(prod)}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                  >
                    {/* Image - Adjustment: smaller on mobile */}
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white border border-gray-200 rounded-lg p-1 flex-shrink-0 shadow-sm group-hover:border-blue-200 transition-colors">
                       <img 
                         src={getImageUrl(prod.primary_image)} 
                         alt={prod.description}
                         className="w-full h-full object-contain mix-blend-multiply"
                         onError={(e) => e.currentTarget.src = getImageUrl(null)}
                       />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-bold text-gray-800 truncate group-hover:text-blue-700 leading-tight">
                        {prod.description}
                      </p>
                      <div className="flex items-center gap-2 md:gap-3 mt-1">
                        <span className="text-[10px] md:text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {prod.global_sku}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide truncate max-w-[100px]">
                          {prod.manufacturer_name || 'Generic'}
                        </span>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="text-right min-w-[70px] md:min-w-[80px]">
                      {prod.min_price && prod.min_price > 0 ? (
                        <p className="text-xs md:text-sm font-bold text-blue-600">
                          {formatCurrency(prod.min_price)}
                        </p>
                      ) : (
                        <p className="text-[10px] md:text-xs font-semibold text-gray-400">Quote</p>
                      )}
                      <ChevronRight size={14} className="ml-auto mt-1 text-gray-300 group-hover:text-blue-50 transition-colors md:w-4 md:h-4"/>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              {pagination && pagination.total > products.length && (
                <div 
                  onClick={handleSearch}
                  className="p-3 md:p-4 bg-gray-50 text-center cursor-pointer hover:bg-blue-50 transition-colors border-t border-gray-100 group"
                >
                  <span className="text-xs md:text-sm font-bold text-blue-600 group-hover:underline">
                    See {pagination.total - products.length} more
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 md:p-8 text-center text-gray-500">
              <Package size={28} className="mx-auto mb-2 text-gray-300 md:w-8 md:h-8" />
              <p className="text-sm">No results found</p>
              <p className="text-xs text-gray-400 mt-1">Try another term.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL RENDERING */}
      {selectedProduct && (
        <ProductQuickView 
          product={selectedProduct} 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
};