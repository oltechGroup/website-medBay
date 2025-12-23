// frontend/src/app/products/page.tsx

"use client";

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

export default function ProductsPage() {
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

  // 3. Configuración del Banner (Elevado a Diseño Premium)
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
      
      {/* ======= HEADER ======= */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-100">
        <div className="w-[90%] max-w-[1400px] mx-auto py-4 flex items-center justify-between gap-8">
          
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src="/icons/logomed.png" alt="Logo" className="w-10 h-10 rounded-lg transition-transform group-hover:scale-105" />
            <div className="flex text-2xl font-bold leading-none tracking-tight">
              <span className="text-blue-500">Med</span><span className="text-slate-700">Bay</span>
            </div>
          </Link>

          {/* Nav para Catálogo (Solicitado) */}
          <nav className="hidden xl:flex gap-6 text-sm font-semibold text-slate-500">
            <Link href="/Characteristics" className="hover:text-blue-600 transition-colors">Características</Link>
            <Link href="/About" className="hover:text-blue-600 transition-colors">Nosotros</Link>
            <Link href="/Contact" className="hover:text-blue-600 transition-colors">Contacto</Link>
          </nav>

          {/* Buscador Integrado en Header */}
          <div className="hidden lg:block flex-1 max-w-xl">
             <ClientSearch />
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
             <Link href="/wishlist" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
               <Heart size={20} />
             </Link>
             <Link href="/cart" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors relative">
               <ShoppingCart size={20} />
               <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">2</span>
             </Link>
             <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
             <Link href="/login" className="hidden sm:block text-sm font-semibold text-blue-600 hover:text-blue-700 px-2">Ingresar</Link>
             <Link href="/register" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all shadow-md">Registro</Link>
          </div>
        </div>
      </header>

      {/* ======= BANNER DE SECCIÓN ======= */}
      <div className={`relative bg-gradient-to-r ${config.gradient} text-white py-12 overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[url('/Images/pattern.png')] bg-repeat"></div>
        <Package className="absolute -right-16 -bottom-16 w-80 h-80 text-white/5 pointer-events-none transform rotate-12" />
        
        <div className="w-[90%] max-w-[1400px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 mb-4">
             {config.tag}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            {config.title}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl font-medium leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>

      {/* ======= CONTENIDO PRINCIPAL ======= */}
      <main className="w-[90%] max-w-[1400px] mx-auto py-10">
        
        <CatalogNavigation />

        <div className="flex flex-col lg:flex-row gap-10 items-start mt-8">
          
          {/* ASIDE: FILTROS */}
          <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-28">
            <div className="flex items-center gap-2 mb-6 px-1">
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
              <div className="flex flex-col gap-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {products.map((product) => (
                  <ClientProductCard 
                    key={product.id} 
                    product={product} 
                    filterStatus={status} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] py-24 text-center border border-dashed border-slate-300 shadow-sm flex flex-col items-center mt-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                  <Search size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Sin coincidencias</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium">
                  No encontramos productos en <span className="text-blue-600">{config.title}</span> que coincidan con tu búsqueda actual.
                </p>
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
                >
                  Reiniciar búsqueda
                </button>
              </div>
            )}

            {/* PAGINACIÓN PREMIUM */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center mt-16 gap-4">
                <Link 
                  href={`/products?page=${Math.max(1, page - 1)}&status=${status}&search=${searchTerm}&minPrice=${minPrice || ''}&maxPrice=${maxPrice || ''}&sortBy=${sortBy}`}
                  className={`flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black transition-all ${page === 1 ? 'pointer-events-none opacity-30' : 'hover:border-blue-500 hover:text-blue-600 shadow-sm'}`}
                >
                  <ArrowLeft size={16} /> Anterior
                </Link>
                
                <div className="flex items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-inner">
                   <span className="text-xs font-black text-slate-400 mr-2 uppercase tracking-tighter transition-all">Página</span>
                   <span className="text-sm font-black text-blue-600">{page}</span>
                   <span className="mx-2 text-slate-300 font-light">/</span>
                   <span className="text-sm font-black text-slate-400">{pagination.totalPages}</span>
                </div>

                <Link 
                  href={`/products?page=${Math.min(pagination.totalPages, page + 1)}&status=${status}&search=${searchTerm}&minPrice=${minPrice || ''}&maxPrice=${maxPrice || ''}&sortBy=${sortBy}`}
                  className={`flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black transition-all ${page === pagination.totalPages ? 'pointer-events-none opacity-30' : 'hover:border-blue-500 hover:text-blue-600 shadow-sm'}`}
                >
                  Siguiente <ChevronRight size={16} />
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ======= FOOTER ROBUSTO ======= */}
      <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900 mt-20">
        <div className="w-[90%] max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center md:text-left">
            <div className="space-y-6">
              <img src="/icons/logocompletoblanco.png" alt="MedBay Full Logo" className="w-52 mx-auto md:mx-0 opacity-90" />
              <p className="text-sm leading-relaxed max-w-xs mx-auto md:mx-0 font-medium italic">
                Socio estratégico líder en la distribución y gestión inteligente de dispositivos médicos B2B.
              </p>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50">Plataforma</h4>
              <ul className="space-y-4 text-sm font-semibold">
                <li><Link href="/About" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Nosotros</Link></li>
                <li><Link href="/Characteristics" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Características</Link></li>
                <li><Link href="/products" className="text-blue-500 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Catálogo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50">Soporte</h4>
              <ul className="space-y-4 text-sm font-semibold">
                <li><Link href="/Contact" className="hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Contacto</Link></li>
                <li><a href="#" className="hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Devoluciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50">Legal</h4>
              <ul className="space-y-4 text-sm font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 text-center">
              © 2025 MedBay Inc. Global Access to Medical Devices.
            </p>
            <div className="flex gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
                <img src="/icons/logomedblanco.png" alt="Icon" className="h-5" />
                <span className="text-[10px] font-black border border-white px-2 py-0.5 rounded">ISO 13485 CERTIFIED</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}