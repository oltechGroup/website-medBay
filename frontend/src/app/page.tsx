//frontend/src/app/page.tsx

"use client";

import Link from "next/link";
import { 
  ShoppingCart, Heart, ShieldCheck, 
  CheckCircle, AlertTriangle, XCircle,
  ChevronRight, ArrowRight, Sparkles, Stethoscope
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ClientProductCard } from "@/components/features/products/client/ClientProductCard"; 
import { ClientSearch } from "@/components/features/products/client/ClientSearch"; 

export default function Home() {
  const { products } = useProducts();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* ======= HEADER ======= */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-100">
        <div className="w-[90%] max-w-[1400px] mx-auto py-4 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/icons/logomed.png" alt="Logo" className="w-10 h-10 rounded-lg transition-transform group-hover:scale-105" />
            <div className="flex text-2xl font-bold leading-none tracking-tight">
              <span className="text-blue-500">Med</span><span className="text-slate-700">Bay</span>
            </div>
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
            <Link href="/products" className="hover:text-blue-600 transition-colors font-bold">Catálogo</Link>
            <Link href="/Characteristics" className="hover:text-blue-600 transition-colors">Características</Link>
            <Link href="/About" className="hover:text-blue-600 transition-colors">Nosotros</Link>
            <Link href="/Contact" className="hover:text-blue-600 transition-colors">Contacto</Link>
          </nav>

          <div className="flex items-center gap-3">
             <Link href="/wishlist" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
               <Heart size={20} />
             </Link>
             <Link href="/cart" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors relative">
               <ShoppingCart size={20} />
               <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">2</span>
             </Link>
             <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
             <Link href="/login" className="hidden sm:block text-sm font-semibold text-blue-600 hover:text-blue-700 px-3">Ingresar</Link>
             <Link href="/register" className="hidden sm:block bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg">Registro</Link>
          </div>
        </div>
      </header>

      {/* ======= HERO ======= */}
      {/* CORRECCIÓN 1: Quitamos overflow-hidden de aquí para que el buscador no se corte */}
      <section className="relative pt-24 pb-32 bg-slate-900">
         
         {/* Fondo Decorativo (Aquí sí mantenemos overflow-hidden para la imagen de fondo) */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img 
              src="/Images/5.png" 
              alt="Fondo Médico" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-50"></div>
         </div>
         
         {/* Contenido Hero + Buscador */}
         <div className="relative z-50 w-[90%] max-w-[1000px] mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold mb-8 animate-fade-in">
               <Stethoscope size={14} /> EL ESTÁNDAR GLOBAL EN SUMINISTROS B2B
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight leading-tight">
              Suministros médicos <br/> <span className="text-blue-400 italic">inteligentes y a tiempo.</span>
            </h1>
            <p className="text-slate-200 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
              Gestiona compras B2B con fechas de caducidad transparentes y múltiples lotes por producto en una sola plataforma.
            </p>

            <div className="mt-8 relative z-[60]"> {/* Z-Index alto para el buscador */}
              <ClientSearch />
            </div>
         </div>
      </section>

      {/* ======= TARJETAS DE CATEGORÍA FLOTANTES ======= */}
      <section className="relative z-20 -mt-16 w-[90%] max-w-[1200px] mx-auto px-4 md:px-0 pointer-events-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto">
          
          <Link href="/products?status=available" className="group">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white hover:border-emerald-200 transition-all duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 mb-6 shadow-sm">
                <CheckCircle size={28} />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Lotes Vigentes</h3>
              <p className="text-slate-500 font-medium">Garantía completa de fábrica y fechas óptimas.</p>
              <div className="mt-6 flex items-center gap-2 text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Explorar <ChevronRight size={16} />
              </div>
            </div>
          </Link>

          <Link href="/products?status=near_expiry" className="group">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white hover:border-amber-200 transition-all duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 mb-6 shadow-sm">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Próximos a Vencer</h3>
              <p className="text-slate-500 font-medium">Oportunidades únicas con descuentos por caducidad.</p>
              <div className="mt-6 flex items-center gap-2 text-amber-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Ver Ofertas <ChevronRight size={16} />
              </div>
            </div>
          </Link>

           <Link href="/products?status=expired" className="group">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-white hover:border-red-200 transition-all duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all duration-500 mb-6 shadow-sm">
                <XCircle size={28} />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Outlet / Caducados</h3>
              <p className="text-slate-500 font-medium">Insumos para prácticas, educación o merma controlada.</p>
              <div className="mt-6 flex items-center gap-2 text-red-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Ver Inventario <ChevronRight size={16} />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* ======= PROMO SECTION ======= */}
      <section className="py-24 w-[90%] max-w-[1200px] mx-auto px-4 md:px-0">
        <div className="relative bg-slate-950 rounded-[3rem] p-10 md:p-20 shadow-2xl text-white overflow-hidden flex flex-col md:flex-row items-center border border-white/5">
           
           {/* Imagen de fondo sutil */}
           <div className="absolute inset-0 opacity-10 pointer-events-none">
             <img src="/Images/2.jpg" alt="" className="w-full h-full object-cover grayscale" />
           </div>

           <div className="md:w-3/5 z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6 uppercase tracking-widest">
               <Sparkles size={14} /> Destacado del mes
             </div>
             <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tight">
               Equipamiento Médico <br/> de <span className="text-blue-500 italic">Alta Protección</span>
             </h2>
             <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-md font-medium leading-relaxed">
               Encuentra mascarillas, guantes y batas quirúrgicas con certificación ISO. Precios especiales por volumen para instituciones.
             </p>
             <Link href="/products" className="inline-flex items-center gap-3 bg-white text-slate-950 px-10 py-4 rounded-2xl font-black text-lg hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5">
               Ver Catálogo Completo <ArrowRight size={20} />
             </Link>
           </div>

           {/* CORRECCIÓN 2: Imagen centrada verticalmente */}
           <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 w-[40%] h-auto pointer-events-none">
             <img 
               src="/Images/Home2.png" 
               alt="Mascarilla 3D" 
               className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
             />
           </div>
        </div>
      </section>

      {/* ======= LISTADO DE PRODUCTOS ======= */}
      <section className="py-20 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto px-4 md:px-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] mb-3">Recién integrados</div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Últimos Productos</h2>
            </div>
            <Link href="/products" className="group flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest border-b-2 border-blue-600/10 pb-1 hover:border-blue-600 transition-all">
              Explorar todo el catálogo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            {products && products.length > 0 ? (
              products.slice(0, 5).map((product) => (
                <ClientProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <ShieldCheck className="text-slate-300" size={40} />
                </div>
                <p className="text-slate-500 font-bold text-lg italic">Sincronizando catálogo con proveedores...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======= FOOTER ROBUSTO ======= */}
      <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
        <div className="w-[90%] max-w-[1200px] mx-auto px-4 md:px-0">
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
                <li><Link href="/products" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Catálogo</Link></li>
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
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 text-center md:text-left">
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