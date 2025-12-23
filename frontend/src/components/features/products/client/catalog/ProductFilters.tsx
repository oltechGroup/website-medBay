"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, Check } from "lucide-react";
import { useManufacturers } from "@/hooks/useManufacturers";
import { useCategories } from "@/hooks/useCategories"; 

export const ProductFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Hooks
  const { manufacturers } = useManufacturers(1, 200); // Traemos más para el buscador local
  const { categories } = useCategories();

  // Estados locales
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [mfgSearch, setMfgSearch] = useState(""); // Buscador local de marcas

  useEffect(() => {
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

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

  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  // Filtrado local de fabricantes
  const filteredManufacturers = manufacturers.filter(m => 
    m.name.toLowerCase().includes(mfgSearch.toLowerCase())
  );

  const currentCategory = searchParams.get("categoryId");
  const currentManufacturer = searchParams.get("manufacturerId");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 w-full lg:w-72 flex-shrink-0 h-fit sticky top-24">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-slate-800">
          <Filter size={18} className="text-slate-500" />
          <h2 className="font-bold text-lg">Filtrar por</h2>
        </div>
        {(currentCategory || currentManufacturer || minPrice || maxPrice) && (
          <button 
            onClick={() => router.push(`/products?status=${searchParams.get('status') || 'all'}`)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold uppercase tracking-wide"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* 1. RANGO DE PRECIO */}
      <div className="mb-8">
        <h3 className="font-bold text-sm text-slate-800 mb-3">Precio</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
            <input
              type="number"
              placeholder="Min"
              className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <span className="text-gray-300">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
            <input
              type="number"
              placeholder="Max"
              className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={handlePriceApply}
          className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-transform active:scale-95 shadow-sm"
        >
          Aplicar
        </button>
      </div>

      {/* 2. CATEGORÍAS */}
      <div className="mb-8">
        <h3 className="font-bold text-sm text-slate-800 mb-3">Categorías</h3>
        <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.id;
            return (
              <label 
                key={cat.id} 
                className={`flex items-center gap-3 text-sm cursor-pointer p-2 rounded-lg transition-colors group ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  <input 
                    type="radio" 
                    name="category"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => applyFilter("categoryId", isSelected ? null : cat.id)}
                  />
                </div>
                <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>{cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. FABRICANTES (Con Buscador) */}
      <div>
        <h3 className="font-bold text-sm text-slate-800 mb-3">Marcas</h3>
        
        {/* Buscador de Marcas */}
        <div className="relative mb-3">
          <input 
            type="text"
            placeholder="Buscar marca..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-300"
            value={mfgSearch}
            onChange={(e) => setMfgSearch(e.target.value)}
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
          {filteredManufacturers.length > 0 ? (
            filteredManufacturers.map((mfg) => {
              const isSelected = currentManufacturer === mfg.id;
              return (
                <label 
                  key={mfg.id} 
                  className={`flex items-center gap-3 text-sm cursor-pointer p-2 rounded-lg transition-colors group ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                    {isSelected && <Check size={10} className="text-white" />}
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isSelected}
                      onChange={() => applyFilter("manufacturerId", isSelected ? null : mfg.id)}
                    />
                  </div>
                  <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>{mfg.name}</span>
                </label>
              );
            })
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">No se encontraron marcas</p>
          )}
        </div>
      </div>

    </div>
  );
};