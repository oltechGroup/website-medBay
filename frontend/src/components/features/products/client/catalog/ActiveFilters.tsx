//frontend/src/components/features/products/client/catalog/ActiveFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, Tag } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useManufacturers } from "@/hooks/useManufacturers";

export const ActiveFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories } = useCategories();
  const { manufacturers } = useManufacturers(1, 300);

  const filters = [];

  const search = searchParams.get("search");
  if (search) filters.push({ key: "search", label: `Búsqueda: ${search}` });

  const catId = searchParams.get("categoryId");
  if (catId) {
    const catName = categories.find(c => c.id === catId)?.name || "Categoría";
    filters.push({ key: "categoryId", label: catName });
  }

  const mfgId = searchParams.get("manufacturerId");
  if (mfgId) {
    const mfgName = manufacturers.find(m => m.id === mfgId)?.name || "Marca";
    filters.push({ key: "manufacturerId", label: mfgName });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice && maxPrice) filters.push({ key: "price", label: `$${minPrice} - $${maxPrice}`, isPrice: true });
  else if (minPrice) filters.push({ key: "minPrice", label: `Desde $${minPrice}` });
  else if (maxPrice) filters.push({ key: "maxPrice", label: `Hasta $${maxPrice}` });

  const removeFilter = (key: string, isPrice = false) => {
    const params = new URLSearchParams(searchParams.toString());
    if (isPrice) {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const clearAll = () => {
    const currentStatus = searchParams.get('status') || 'all';
    router.push(`/products?status=${currentStatus}`);
  };

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 md:mb-8 animate-in fade-in slide-in-from-left-2 duration-500">
      
      {/* Etiqueta "Filtros:" - Oculta texto en pantallas muy pequeñas */}
      <div className="flex items-center gap-2 text-slate-400 mr-1 md:mr-2">
         <Tag size={14} />
         <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.2em]">Filtros:</span>
      </div>

      {filters.map((filter) => (
        <span 
          key={filter.key} 
          // Ajuste: Padding reducido en móvil y texto text-xs (más legible)
          className="group inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-white border border-slate-200 rounded-full text-xs md:text-[11px] font-black text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          {/* Ajuste: Ocultar prefijos (TXT, REF) en móvil para ahorrar espacio */}
          <span className="opacity-60 uppercase tracking-tighter hidden sm:inline">
             {filter.key === 'search' ? 'TXT' : filter.key.includes('Price') ? 'PRC' : 'REF'}:
          </span>
          
          {/* Truncar texto muy largo en móvil */}
          <span className="truncate max-w-[150px] sm:max-w-none">
            {filter.label}
          </span>

          <button 
            onClick={() => removeFilter(filter.key, filter.isPrice)}
            // Ajuste: Aumentar área de toque
            className="ml-1 p-1 md:p-0.5 bg-slate-100 rounded-full text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      
      <button 
        onClick={clearAll}
        // Ajuste: ml-auto en móvil empuja este botón a la derecha si hay espacio
        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 border-b-2 border-transparent hover:border-blue-600 transition-all ml-auto md:ml-4 py-2 md:py-1"
      >
        Limpiar Todo
      </button>
    </div>
  );
};