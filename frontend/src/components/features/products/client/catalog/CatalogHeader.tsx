"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

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

  // Safe check para no mostrar "Mostrando 1-0" si no hay resultados
  const safeEndIndex = totalResults === 0 ? 0 : endIndex;
  const safeStartIndex = totalResults === 0 ? 0 : startIndex;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      
      {/* Izquierda: Contador */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Catálogo de Productos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mostrando <span className="font-semibold text-gray-900">{safeStartIndex}-{safeEndIndex}</span> de <span className="font-semibold text-gray-900">{totalResults}</span> resultados
        </p>
      </div>

      {/* Derecha: Ordenamiento */}
      <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
        <ArrowUpDown size={16} className="text-gray-400 ml-2" />
        <label htmlFor="sort" className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Ordenar por:
        </label>
        <div className="relative">
          <select
            id="sort"
            value={currentSort}
            onChange={handleSortChange}
            className="appearance-none bg-transparent border-none text-gray-800 text-sm font-bold focus:ring-0 cursor-pointer pr-8 py-1"
          >
            <option value="newest">Más Recientes</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="name_asc">Nombre: A - Z</option>
            <option value="name_desc">Nombre: Z - A</option>
          </select>
        </div>
      </div>
    </div>
  );
};