//frontend/src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShoppingCart, Heart, ShieldCheck, 
  CheckCircle, AlertTriangle, XCircle,
  ChevronRight, ArrowRight, Sparkles, Stethoscope, LogOut, User
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth"; // ✅ Importamos Auth
import { ClientProductCard } from "@/components/features/products/client/ClientProductCard"; 
import { ClientSearch } from "@/components/features/products/client/ClientSearch"; 

export default function Home() {
  const { products } = useProducts();
  const { user, isAuthenticated, logout } = useAuth(); // ✅ Hook de autenticación
  const [mounted, setMounted] = useState(false); // ✅ Estado para controlar hidratación

  // Solución al problema de "pérdida de token al recargar":
  // Esperamos a que el componente se monte en el cliente para leer el estado de Zustand persistido.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Función auxiliar para formatear el rol visualmente
  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">ADMIN</span>;
    if (role === 'medical_professional') return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">MÉDICO</span>;
    return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">EMPRESA</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* ======= HERO ======= */}
      <section className="relative pt-24 pb-32 bg-slate-900">
         <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img 
              src="/Images/5.png" 
              alt="Fondo Médico" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-50"></div>
         </div>
         
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

            <div className="mt-8 relative z-[60]"> 
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
    </div>
  );
}