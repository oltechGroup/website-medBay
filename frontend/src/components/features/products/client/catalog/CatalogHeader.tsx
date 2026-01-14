"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, ListFilter } from "lucide-react";

interface CatalogHeaderProps {
  totalResults: number;
  startIndex: number;
  endIndex: number;
}

export const CatalogHeader = ({ totalResults, startIndex, endIndex }: CatalogHeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sortBy") || "newest";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", e.target.value);
    params.set("page", "1"); // Resetear a página 1 al ordenar
    router.push(`/products?${params.toString()}`);
  };

  // Safe check logic (Intacto)
  const safeEndIndex = totalResults === 0 ? 0 : endIndex;
  const safeStartIndex = totalResults === 0 ? 0 : startIndex;

  return (
    <div className="bg-white rounded-2xl md:rounded-[1.5rem] shadow-sm border border-slate-100 p-4 md:p-5 mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md">
      
      {/* Izquierda: Contador */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg hidden sm:block">
           <ListFilter size={20} />
        </div>
        <div className="flex-1 sm:flex-none">
            {/* Título un poco más pequeño en móvil para balancear */}
            <h1 className="text-base md:text-lg font-black text-slate-800 tracking-tight leading-none">Resultados del Catálogo</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">
            Mostrando <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{safeStartIndex}-{safeEndIndex}</span> de <span className="font-bold text-slate-900">{totalResults}</span> productos
            </p>
        </div>
      </div>

      {/* Derecha: Ordenamiento */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative group w-full sm:w-auto">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none">
                <ArrowUpDown size={14} />
            </div>
            
            <select
                id="sort"
                value={currentSort}
                onChange={handleSortChange}
                // ⚠️ IMPORTANTE: text-base en móvil evita Zoom en iOS. md:text-xs regresa al diseño original en PC.
                className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-base md:text-xs font-bold pl-9 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 cursor-pointer transition-all hover:bg-white hover:shadow-sm uppercase tracking-wide"
            >
                <option value="newest">Más Recientes</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="name_asc">Nombre: A - Z</option>
                <option value="name_desc">Nombre: Z - A</option>
            </select>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={14} />
            </div>
        </div>
      </div>
    </div>
  );
};