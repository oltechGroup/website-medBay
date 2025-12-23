"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useCategories } from "@/hooks/useCategories"; // O tu hook correcto
import { useManufacturers } from "@/hooks/useManufacturers";

export const ActiveFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories } = useCategories();
  const { manufacturers } = useManufacturers(1, 100);

  const filters = [];

  // 1. Filtro de Texto
  const search = searchParams.get("search");
  if (search) filters.push({ key: "search", label: `Búsqueda: "${search}"` });

  // 2. Filtro de Categoría (Buscamos el nombre)
  const catId = searchParams.get("categoryId");
  if (catId) {
    const catName = categories.find(c => c.id === catId)?.name || "Categoría";
    filters.push({ key: "categoryId", label: catName });
  }

  // 3. Filtro de Fabricante
  const mfgId = searchParams.get("manufacturerId");
  if (mfgId) {
    const mfgName = manufacturers.find(m => m.id === mfgId)?.name || "Marca";
    filters.push({ key: "manufacturerId", label: mfgName });
  }

  // 4. Filtro de Precio
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice && maxPrice) filters.push({ key: "price", label: `$${minPrice} - $${maxPrice}`, isPrice: true });
  else if (minPrice) filters.push({ key: "minPrice", label: `Desde $${minPrice}` });
  else if (maxPrice) filters.push({ key: "maxPrice", label: `Hasta $${maxPrice}` });

  // 5. Filtro de Estado
  const status = searchParams.get("status");
  if (status && status !== 'all') {
    const label = status === 'available' ? 'Vigentes' : status === 'near_expiry' ? 'Próximos a Vencer' : 'Caducados';
    filters.push({ key: "status", label: label });
  }

  // Función para remover un filtro
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

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-1">
      {filters.map((filter) => (
        <span 
          key={filter.key} 
          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 shadow-sm"
        >
          {filter.label}
          <button 
            onClick={() => removeFilter(filter.key, filter.isPrice)}
            className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        </span>
      ))}
      <button 
        onClick={() => router.push('/products')}
        className="text-xs text-blue-600 hover:underline font-medium ml-2"
      >
        Borrar todos
      </button>
    </div>
  );
};