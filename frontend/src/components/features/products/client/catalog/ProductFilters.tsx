//frontend/src/components/features/products/client/catalog/ProductFilters.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, Check, DollarSign, X } from "lucide-react";
import { useManufacturers } from "@/hooks/useManufacturers";
import { useCategories } from "@/hooks/useCategories"; 

export const ProductFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Hooks de datos (Lógica intacta)
  const { manufacturers } = useManufacturers(1, 300); 
  const { categories } = useCategories();

  // Estados locales
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  
  // Buscadores locales (Lógica intacta)
  const [mfgSearch, setMfgSearch] = useState(""); 
  const [catSearch, setCatSearch] = useState("");

  // Sincronizar precios si cambian en URL
  useEffect(() => {
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  // Aplicar filtro genérico
  const applyFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  // Aplicar filtro de precio
  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  // Filtrado local de Fabricantes
  const filteredManufacturers = manufacturers.filter(m => 
    m.name.toLowerCase().includes(mfgSearch.toLowerCase())
  );

  // Filtrado local de Categorías
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const currentCategory = searchParams.get("categoryId");
  const currentManufacturer = searchParams.get("manufacturerId");

  // Verificar si hay filtros activos para mostrar el botón de limpiar
  const hasActiveFilters = currentCategory || currentManufacturer || minPrice || maxPrice;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white p-6 w-full lg:w-80 flex-shrink-0 h-fit sticky top-28 transition-all">
      
      {/* Header del Panel */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
             <Filter size={16} />
          </div>
          <h2 className="font-black text-sm uppercase tracking-widest">Filtros</h2>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={() => {
              const currentStatus = searchParams.get('status') || 'all';
              router.push(`/products?status=${currentStatus}`);
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100 transition-colors uppercase tracking-wide"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* 1. RANGO DE PRECIO */}
      <div className="mb-10">
        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={14} className="text-blue-500"/> Rango de Precio
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
            <input
              type="number"
              placeholder="Min"
              className="w-full pl-6 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all group-hover:bg-slate-100"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <span className="text-slate-300 font-bold">-</span>
          <div className="relative flex-1 group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
            <input
              type="number"
              placeholder="Max"
              className="w-full pl-6 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all group-hover:bg-slate-100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={handlePriceApply}
          className="w-full py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
        >
          Aplicar Rango
        </button>
      </div>

      {/* 2. CATEGORÍAS */}
      <div className="mb-10">
        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
            Categorías
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono">{filteredCategories.length}</span>
        </h3>
        
        {/* Buscador de Categorías */}
        <div className="relative mb-4 group">
          <input 
            type="text"
            placeholder="Buscar categoría..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-400 focus:bg-white transition-all"
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>

        <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar pr-2">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => {
              const isSelected = currentCategory === cat.id;
              return (
                <label 
                  key={cat.id} 
                  className={`flex items-center gap-3 text-sm cursor-pointer p-2.5 rounded-xl transition-all group ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                    <input 
                      type="radio" 
                      name="category"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => applyFilter("categoryId", isSelected ? null : cat.id)}
                    />
                  </div>
                  <span className="truncate">{cat.name}</span>
                </label>
              );
            })
          ) : (
            <div className="text-center py-4 opacity-50">
               <p className="text-xs font-bold text-slate-400">Sin resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. FABRICANTES */}
      <div>
        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
            Marcas
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono">{filteredManufacturers.length}</span>
        </h3>
        
        {/* Buscador de Marcas */}
        <div className="relative mb-4 group">
          <input 
            type="text"
            placeholder="Buscar marca..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-400 focus:bg-white transition-all"
            value={mfgSearch}
            onChange={(e) => setMfgSearch(e.target.value)}
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>

        <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar pr-2">
          {filteredManufacturers.length > 0 ? (
            filteredManufacturers.map((mfg) => {
              const isSelected = currentManufacturer === mfg.id;
              return (
                <label 
                  key={mfg.id} 
                  className={`flex items-center gap-3 text-sm cursor-pointer p-2.5 rounded-xl transition-all group ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                  }`}>
                    {isSelected && <Check size={10} className="text-white stroke-[3px]" />}
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isSelected}
                      onChange={() => applyFilter("manufacturerId", isSelected ? null : mfg.id)}
                    />
                  </div>
                  <span className="truncate">{mfg.name}</span>
                </label>
              );
            })
          ) : (
            <div className="text-center py-4 opacity-50">
               <p className="text-xs font-bold text-slate-400">Sin resultados</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};