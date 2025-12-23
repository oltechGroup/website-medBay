// frontend/src/components/features/products/client/ClientSearch.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronRight, Package, Loader2 } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts"; 
import { getImageUrl, formatCurrency } from "@/lib/formatters";
import { ProductQuickView } from "./ProductQuickView"; // ✅ Importamos el Modal

export const ClientSearch = () => {
  const router = useRouter();
  
  // Estados para manejo de búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Estado para controlar el Modal desde el buscador
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // DEBOUNCE: Espera 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hook conectado a la API Real
  const { products, pagination, isLoading } = useProducts({
    searchTerm: debouncedTerm,
    limit: 15, 
    page: 1
  });

  // Cerrar dropdown al hacer click fuera
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

  // ✅ Función para abrir el modal en lugar de navegar
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product); // Guardamos el producto para el modal
    setIsActive(false); // Cerramos el dropdown de búsqueda
  };

  return (
    // Z-INDEX 50
    <div ref={containerRef} className="relative z-50 w-full max-w-2xl mx-auto">
      
      {/* --- INPUT BAR --- */}
      <div className={`
        relative flex items-center bg-white transition-all duration-300
        ${isActive ? 'rounded-t-2xl shadow-2xl ring-2 ring-blue-100' : 'rounded-2xl shadow-xl'}
      `}>
        <div className="pl-6 text-gray-400">
          {isLoading && searchTerm !== debouncedTerm ? (
             <Loader2 size={22} className="animate-spin text-blue-500" />
          ) : (
             <Search size={22} />
          )}
        </div>
        
        <input 
          type="text" 
          placeholder="Buscar por nombre, SKU o categoría..." 
          className="w-full p-5 text-gray-800 outline-none text-lg placeholder:text-gray-400 bg-transparent font-medium"
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
            className="p-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        <button 
          onClick={handleSearch} 
          className="mr-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform active:scale-95"
        >
          Buscar
        </button>
      </div>

      {/* --- DROPDOWN RESULTADOS --- */}
      {isActive && debouncedTerm && (
        <div className="absolute top-full left-0 w-full bg-white rounded-b-2xl shadow-2xl border-t border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin" size={24} />
              <p className="text-sm font-medium">Buscando en catálogo...</p>
            </div>
          ) : products && products.length > 0 ? (
            <>
              {/* Contenedor con Scroll */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                {products.map((prod) => (
                  <div 
                    key={prod.id}
                    onClick={() => handleProductClick(prod)} // ✅ AHORA ABRE MODAL
                    className="flex items-center gap-4 p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                  >
                    {/* Imagen */}
                    <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg p-1 flex-shrink-0 shadow-sm group-hover:border-blue-200 transition-colors">
                       <img 
                         src={getImageUrl(prod.primary_image)} 
                         alt={prod.description}
                         className="w-full h-full object-contain mix-blend-multiply"
                         onError={(e) => e.currentTarget.src = getImageUrl(null)}
                       />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700 leading-tight">
                        {prod.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {prod.global_sku}
                        </span>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                          {prod.manufacturer_name || 'Genérico'}
                        </span>
                      </div>
                    </div>

                    {/* Precio y Acción */}
                    <div className="text-right min-w-[80px]">
                      {prod.min_price && prod.min_price > 0 ? (
                        <p className="text-sm font-bold text-blue-600">
                          {formatCurrency(prod.min_price)}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-gray-400">Cotizar</p>
                      )}
                      <ChevronRight size={16} className="ml-auto mt-1 text-gray-300 group-hover:text-blue-500 transition-colors"/>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              {pagination && pagination.total > products.length && (
                <div 
                  onClick={handleSearch}
                  className="p-4 bg-gray-50 text-center cursor-pointer hover:bg-blue-50 transition-colors border-t border-gray-100 group"
                >
                  <span className="text-sm font-bold text-blue-600 group-hover:underline">
                    Ver {pagination.total - products.length} resultados más en catálogo
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Package size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No encontramos productos para "{searchTerm}"</p>
              <p className="text-xs text-gray-400 mt-1">Intenta con otro nombre, código o categoría.</p>
            </div>
          )}
        </div>
      )}

      {/* ✅ RENDERIZADO DEL MODAL */}
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