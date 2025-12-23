"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Heart, Search, Package, ArrowLeft } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ClientProductCard } from "@/components/features/products/client/ClientProductCard";
import { ProductFilters } from "@/components/features/products/client/catalog/ProductFilters";
import { CatalogHeader } from "@/components/features/products/client/catalog/CatalogHeader";
import { ClientSearch } from "@/components/features/products/client/ClientSearch";
import { ActiveFilters } from "@/components/features/products/client/catalog/ActiveFilters";

export default function ProductsPage() {
  const searchParams = useSearchParams();

  // 1. Extraer filtros de la URL
  const page = parseInt(searchParams.get("page") || "1");
  const searchTerm = searchParams.get("search") || "";
  const manufacturerId = searchParams.get("manufacturerId") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const status = searchParams.get("status") || "all";
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const sortBy = searchParams.get("sortBy") || "newest";

  // 2. Hook de Productos (Server Side Search)
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

  // 3. Configuración Visual Dinámica según la Sección
  const getSectionConfig = () => {
    switch (status) {
      case 'expired':
        return {
          title: "Outlet / Caducados",
          description: "Inventario en liquidación por fecha de caducidad vencida. Precios de remate.",
          gradient: "from-red-900 to-red-800",
          icon: "text-red-200"
        };
      case 'near_expiry':
        return {
          title: "Próximos a Vencer",
          description: "Oportunidades únicas en productos con fecha corta. Calidad garantizada a menor precio.",
          gradient: "from-amber-700 to-orange-800",
          icon: "text-amber-200"
        };
      case 'available':
        return {
          title: "Catálogo Vigente",
          description: "Productos con garantía de fábrica y fecha de caducidad óptima.",
          gradient: "from-emerald-800 to-teal-900",
          icon: "text-emerald-200"
        };
      default:
        return {
          title: "Catálogo General",
          description: "Explora nuestra selección completa de suministros médicos.",
          gradient: "from-slate-800 to-slate-900",
          icon: "text-blue-400"
        };
    }
  };

  const config = getSectionConfig();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* ======= HEADER STICKY ======= */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-200 shadow-sm">
        <div className="w-[90%] max-w-[1400px] mx-auto py-3 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src="/icons/logomed.png" alt="Logo" className="w-9 h-9 rounded-lg transition-transform group-hover:scale-105" />
            <div className="flex text-xl font-bold leading-none tracking-tight">
              <span className="text-blue-600">Med</span><span className="text-slate-800">Bay</span>
            </div>
          </Link>

          {/* Buscador Compacto (Solo visible en desktop) */}
          <div className="hidden lg:block flex-1 max-w-xl mx-auto">
             <div className="scale-95 origin-center">
                <ClientSearch /> 
             </div>
          </div>

          {/* Iconos y Auth */}
          <div className="flex items-center gap-4 flex-shrink-0">
             <div className="flex items-center gap-2">
               <Link href="/wishlist" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                 <Heart size={20} />
               </Link>
               <Link href="/cart" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 relative transition-colors">
                 <ShoppingCart size={20} />
                 {/* Badge opcional */}
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">2</span>
               </Link>
             </div>
             
             {/* Separador */}
             <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
             
             {/* Botones de Login/Registro */}
             <div className="hidden sm:flex items-center gap-2">
               <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors">
                 Ingresar
               </Link>
               <Link href="/register" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-95">
                 Registro
               </Link>
             </div>
          </div>
        </div>
      </header>

      {/* ======= BANNER DE SECCIÓN (Visualmente Diferenciador) ======= */}
      <div className={`bg-gradient-to-r ${config.gradient} text-white py-12 relative overflow-hidden`}>
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-10 bg-[url('/Images/pattern.png')] bg-repeat"></div>
        
        <div className="w-[90%] max-w-[1400px] mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Volver al Inicio
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
                {config.title}
                <Package className={`w-8 h-8 ${config.icon} opacity-80`} />
              </h1>
              <p className="text-white/80 text-lg max-w-2xl font-light">
                {config.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======= CONTENIDO PRINCIPAL ======= */}
      <main className="w-[90%] max-w-[1400px] mx-auto py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* === SIDEBAR (FILTROS) === */}
          <aside className="w-full lg:w-72 flex-shrink-0 sticky top-24 z-10">
            <ProductFilters />
          </aside>

          {/* === LISTA DE PRODUCTOS === */}
          <div className="flex-1 min-w-0">
            
            {/* Header del Catálogo (Resultados y Ordenar) */}
            <CatalogHeader 
              totalResults={pagination?.total || 0} 
              startIndex={(page - 1) * 10 + 1} 
              endIndex={Math.min(page * 10, pagination?.total || 0)} 
            />

            {/* Filtros Activos (Chips para eliminar) */}
            <ActiveFilters />

            {/* GRID DE PRODUCTOS */}
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white h-52 rounded-2xl animate-pulse border border-gray-200 shadow-sm"></div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="flex flex-col gap-4">
                {products.map((product) => (
                  <ClientProductCard 
                    key={product.id} 
                    product={product} 
                    // 🌟 MAGIA: Le pasamos el status para que filtre los lotes dentro del modal
                    filterStatus={status} 
                  />
                ))}
              </div>
            ) : (
              // Empty State Profesional
              <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-300 shadow-sm flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sin resultados</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                  No encontramos productos que coincidan con estos filtros en la sección <strong className="text-gray-700">{config.title}</strong>.
                </p>
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg"
                >
                  Ver todo el catálogo
                </button>
              </div>
            )}

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <Link 
                  href={`/products?page=${Math.max(1, page - 1)}&status=${status}&search=${searchTerm}&minPrice=${minPrice || ''}&maxPrice=${maxPrice || ''}&sortBy=${sortBy}`}
                  className={`px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium transition-colors ${page === 1 ? 'pointer-events-none opacity-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:border-gray-400'}`}
                >
                  ← Anterior
                </Link>
                <span className="px-4 py-2.5 text-gray-500 font-mono text-sm flex items-center bg-white border border-transparent">
                  {page} / {pagination.totalPages}
                </span>
                <Link 
                  href={`/products?page=${Math.min(pagination.totalPages, page + 1)}&status=${status}&search=${searchTerm}&minPrice=${minPrice || ''}&maxPrice=${maxPrice || ''}&sortBy=${sortBy}`}
                  className={`px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium transition-colors ${page === pagination.totalPages ? 'pointer-events-none opacity-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700 hover:border-gray-400'}`}
                >
                  Siguiente →
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ======= FOOTER ======= */}
      <footer className="bg-slate-900 text-slate-400 py-16 mt-20 border-t border-slate-800">
        <div className="w-[90%] max-w-[1400px] mx-auto grid md:grid-cols-4 gap-12 mb-8 text-sm">
          <div>
            <h4 className="text-white font-bold mb-6 text-xl tracking-tight">MedBay</h4>
            <p className="leading-relaxed opacity-80">
              Transformando la cadena de suministro médico con tecnología, transparencia y eficiencia.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Plataforma</h4>
            <ul className="space-y-3">
              <li><Link href="/About" className="hover:text-white transition-colors">Nosotros</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Catálogo Completo</Link></li>
              <li><Link href="/products?status=near_expiry" className="hover:text-amber-400 transition-colors">Ofertas</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Soporte</h4>
            <ul className="space-y-3">
              <li><Link href="/Contact" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Devoluciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">Privacidad de Datos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs pt-8 border-t border-slate-800 text-slate-600">
          © 2025 MedBay Inc. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}