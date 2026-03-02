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
  if (search) filters.push({ key: "search", label: `Search: ${search}` });

  const catId = searchParams.get("categoryId");
  if (catId) {
    // ✅ TIPADO AÑADIDO: (c: any)
    const catName = categories.find((c: any) => c.id === catId)?.name || "Category";
    filters.push({ key: "categoryId", label: catName });
  }

  const mfgId = searchParams.get("manufacturerId");
  if (mfgId) {
    // ✅ TIPADO AÑADIDO: (m: any)
    const mfgName = manufacturers.find((m: any) => m.id === mfgId)?.name || "Brand";
    filters.push({ key: "manufacturerId", label: mfgName });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice && maxPrice) filters.push({ key: "price", label: `$${minPrice} - $${maxPrice}`, isPrice: true });
  else if (minPrice) filters.push({ key: "minPrice", label: `From $${minPrice}` });
  else if (maxPrice) filters.push({ key: "maxPrice", label: `Up to $${maxPrice}` });

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
      
      {/* "Filters:" Label - Hidden text on very small screens */}
      <div className="flex items-center gap-2 text-slate-400 mr-1 md:mr-2">
         <Tag size={14} />
         <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.2em]">Filters:</span>
      </div>

      {filters.map((filter) => (
        <span 
          key={filter.key} 
          // Adjustment: Reduced padding on mobile and text-xs (more legible)
          className="group inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-white border border-slate-200 rounded-full text-xs md:text-[11px] font-black text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          {/* Adjustment: Hide prefixes (TXT, REF) on mobile to save space */}
          <span className="opacity-60 uppercase tracking-tighter hidden sm:inline">
             {filter.key === 'search' ? 'TXT' : filter.key.includes('Price') ? 'PRC' : 'REF'}:
          </span>
          
          {/* Truncate very long text on mobile */}
          <span className="truncate max-w-[150px] sm:max-w-none">
            {filter.label}
          </span>

          <button 
            onClick={() => removeFilter(filter.key, filter.isPrice)}
            // Adjustment: Increase touch area
            className="ml-1 p-1 md:p-0.5 bg-slate-100 rounded-full text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      
      <button 
        onClick={clearAll}
        // Adjustment: ml-auto on mobile pushes this button to the right if space allows
        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 border-b-2 border-transparent hover:border-blue-600 transition-all ml-auto md:ml-4 py-2 md:py-1"
      >
        Clear All
      </button>
    </div>
  );
};