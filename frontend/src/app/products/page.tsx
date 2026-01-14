// frontend/src/app/products/page.tsx

"use client";

import { Suspense } from "react"; 
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ShoppingCart, 
  Heart, 
  Search, 
  Package, 
  ChevronRight, 
  ArrowLeft,
  Filter
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ClientProductCard } from "@/components/features/products/client/ClientProductCard";
import { ProductFilters } from "@/components/features/products/client/catalog/ProductFilters";
import { CatalogHeader } from "@/components/features/products/client/catalog/CatalogHeader";
import { ClientSearch } from "@/components/features/products/client/ClientSearch";
import { ActiveFilters } from "@/components/features/products/client/catalog/ActiveFilters";
import { CatalogNavigation } from "@/components/features/products/client/catalog/CatalogNavigation";

function ProductsContent() {
  const searchParams = useSearchParams();

  // 1. Extraer filtros (Lógica Intacta)
  const page = parseInt(searchParams.get("page") || "1");
  const searchTerm = searchParams.get("search") || "";
  const manufacturerId = searchParams.get("manufacturerId") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const status = searchParams.get("status") || "all";
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const sortBy = searchParams.get("sortBy") || "newest";

  // 2. Hook de Productos
  const { products, pagination, isLoading } = useProducts({
    page,
    limit: 10,
    searchTerm,
    manufacturerId,
    categoryId,
    status,
    minPrice,
    maxPrice,
    sortBy
  });

  // 3. Configuración del Banner
  const getSectionConfig = () => {
    switch (status) {
      case 'expired':
        return {
          title: "Outlet / Caducados",
          description: "Inventario en liquidación para prácticas o usos no clínicos.",
          gradient: "from-red-950 via-red-900 to-red-800",
          tag: "LIQUIDACIÓN CONTROLADA"
        };
      case 'near_expiry':
        return {
          title: "Próximos a Vencer",
          description: "Productos 100% funcionales con fechas cortas a precios reducidos.",
          gradient: "from-amber-700 via-amber-600 to-orange-700",
          tag: "OPORTUNIDAD ESTRATÉGICA"
        };
      case 'available':
        return {
          title: "Catálogo Vigente",
          description: "Suministros médicos con garantía completa y fechas óptimas.",
          gradient: "from-emerald-900 via-emerald-800 to-teal-800",
          tag: "GARANTÍA DE FÁBRICA"
        };
      default:
        return {
          title: "Catálogo General",
          description: "Explora nuestra selección completa de dispositivos médicos certificados.",
          gradient: "from-slate-900 via-slate-800 to-slate-900",
          tag: "INVENTARIO GLOBAL"
        };
    }
  };

  const config = getSectionConfig();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* ======= BANNER DE SECCIÓN ======= */}
      {/* Ajuste: pt-32 para compensar Header Fijo en móvil */}
      <div className={`relative bg-gradient-to-r ${config.gradient} text-white pt-32 pb-12 md:py-20 overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[url('/Images/pattern.png')] bg-repeat"></div>
        
        {/* Ajuste: Icono decorativo más pequeño en móvil para no tapar texto */}
        <Package className="absolute -right-8 -bottom-8 w-40 h-40 md:-right-16 md:-bottom-16 md:w-80 md:h-80 text-white/5 pointer-events-none transform rotate-12" />
        
        <div className="w-[90%] max-w-[1400px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 mb-4">
              {config.tag}
          </div>
          {/* Ajuste: Título responsive */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 leading-tight">
            {config.title}
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl font-medium leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>

      {/* ======= CONTENIDO PRINCIPAL ======= */}
      <main className="w-[90%] max-w-[1400px] mx-auto py-6 md:py-10">
        
        <CatalogNavigation />

        <div className="flex flex-col lg:flex-row gap-6 md:gap-10 items-start mt-6 md:mt-8">
          
          {/* ASIDE: FILTROS */}
          {/* En móvil se apila arriba. Mantiene w-full para ocupar el ancho disponible */}
          <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-28">
            <div className="flex items-center gap-2 mb-4 md:mb-6 px-1">
               <Filter size={18} className="text-blue-600" />
               <span className="font-black text-sm uppercase tracking-widest text-slate-400">Filtros Avanzados</span>
            </div>
            <ProductFilters />
          </aside>

          {/* SECCIÓN DE RESULTADOS */}
          <div className="flex-1 min-w-0 w-full">
            
            <CatalogHeader 
              totalResults={pagination?.total || 0} 
              startIndex={(page - 1) * 10 + 1} 
              endIndex={Math.min(page * 10, pagination?.total || 0)} 
            />

            <ActiveFilters />

            {isLoading ? (
              <div className="space-y-6 mt-6">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white h-48 rounded-[2rem] animate-pulse border border-slate-100 shadow-sm"></div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="flex flex-col gap-4 md:gap-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {products.map((product) => (
                  <ClientProductCard 
                    key={product.id} 
                    product={product} 
                    filterStatus={status} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] md:rounded-[3rem] py-12 md:py-24 text-center border border-dashed border-slate-300 shadow-sm flex flex-col items-center mt-6 px-4">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                  <Search size={40} className="md:w-12 md:h-12" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2">Sin coincidencias</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium text-sm md:text-base">
                  No encontramos productos en <span className="text-blue-600">{config.title}</span> que coincidan con tu búsqueda actual.
                </p>
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="bg-slate-900 text-white px-6 md:px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 text-sm md:text-base"
                >
                  Reiniciar búsqueda
                </button>
              </div>
            )}

            {/* PAGINACIÓN PREMIUM */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center mt-12 gap-4 w-full">
                <div className="flex w-full sm:w-auto justify-between gap-4">
                  <Link 
                    href={`/products?page=${Math.max(1, page - 1)}&status=${status}&search=${searchTerm}&minPrice=${minPrice || ''}&maxPrice=${maxPrice || ''}&sortBy=${sortBy}`}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black transition-all ${page === 1 ? 'pointer-events-none opacity-30' : 'hover:border-blue-500 hover:text-blue-600 shadow-sm'}`}
                  >
                    <ArrowLeft size={16} /> Anterior
                  </Link>
                  
                  {/* Indicador solo visible en móvil si falta espacio, o ajustado */}
                  <div className="sm:hidden flex items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-inner">
                     <span className="text-sm font-black text-blue-600">{page}</span>
                     <span className="mx-1 text-slate-300">/</span>
                     <span className="text-sm font-black text-slate-400">{pagination.totalPages}</span>
                  </div>

                  <Link 
                    href={`/products?page=${Math.min(pagination.totalPages, page + 1)}&status=${status}&search=${searchTerm}&minPrice=${minPrice || ''}&maxPrice=${maxPrice || ''}&sortBy=${sortBy}`}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black transition-all ${page === pagination.totalPages ? 'pointer-events-none opacity-30' : 'hover:border-blue-500 hover:text-blue-600 shadow-sm'}`}
                  >
                    Siguiente <ChevronRight size={16} />
                  </Link>
                </div>

                {/* Indicador Desktop */}
                <div className="hidden sm:flex items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-inner">
                   <span className="text-xs font-black text-slate-400 mr-2 uppercase tracking-tighter transition-all">Página</span>
                   <span className="text-sm font-black text-blue-600">{page}</span>
                   <span className="mx-2 text-slate-300 font-light">/</span>
                   <span className="text-sm font-black text-slate-400">{pagination.totalPages}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}