"use client";

import Link from "next/link";
import { 
  ShoppingCart, Heart, CreditCard, Truck, ShieldCheck, 
  CheckCircle, AlertTriangle, XCircle 
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ClientProductCard } from "@/components/features/products/client/ClientProductCard"; 
import { ClientSearch } from "@/components/features/products/client/ClientSearch"; 

export default function Home() {
  const { products } = useProducts();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* ======= HEADER (Z-60: Siempre arriba de todo) ======= */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-100">
        <div className="w-[90%] max-w-[1400px] mx-auto py-4 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/icons/logomed.png" alt="Logo" className="w-10 h-10 rounded-lg transition-transform group-hover:scale-105" />
            <div className="flex text-2xl font-bold leading-none tracking-tight">
              <span className="text-blue-500">Med</span><span className="text-slate-700">Bay</span>
            </div>
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
            <Link href="/Characteristics" className="hover:text-blue-600 transition-colors">Características</Link>
            <Link href="/About" className="hover:text-blue-600 transition-colors">Nosotros</Link>
            <Link href="/products" className="hover:text-blue-600 transition-colors">Catálogo</Link>
            <Link href="/Contact" className="hover:text-blue-600 transition-colors">Contacto</Link>
          </nav>

          <div className="flex items-center gap-3">
             <Link href="/wishlist" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
               <Heart size={20} />
             </Link>
             <Link href="/cart" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors relative">
               <ShoppingCart size={20} />
               <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">2</span>
             </Link>
             <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
             <a href="/login" className="hidden sm:block text-sm font-semibold text-blue-600 hover:text-blue-700">Ingresar</a>
             <a href="/register" className="hidden sm:block bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Registro</a>
          </div>
        </div>
      </header>

      {/* ======= HERO ======= */}
      <section className="relative pt-20 pb-32 bg-slate-900">
         
         {/* CAPA 1: Fondo Decorativo (z-0) */}
         {/* Se queda al fondo de todo */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-0 opacity-40 bg-[url('/Images/Home1.png')] bg-cover bg-center mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/10"></div>
         </div>
         
         {/* CAPA 3: Contenido Hero + Buscador (z-50) */}
         {/* Al poner z-50 aquí, forzamos a que TODO lo que esté dentro (incluido el dropdown)
             esté por encima de la siguiente sección (los botones z-20) */}
         <div className="relative z-50 w-[90%] max-w-[1000px] mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-lg">
              Suministros médicos <br/> <span className="text-blue-400">inteligentes y a tiempo.</span>
            </h1>
            <p className="text-slate-200 text-lg md:text-xl mb-10 max-w-2xl mx-auto drop-shadow-md">
              Gestiona compras B2B con fechas de caducidad transparentes y múltiples lotes por producto.
            </p>

            {/* Componente de Buscador Aislado */}
            <div className="mt-8">
              <ClientSearch />
            </div>
         </div>
      </section>

      {/* ======= TARJETAS DE CATEGORÍA FLOTANTES ======= */}
      {/* CAPA 2: Botones (z-20) */}
      {/* z-20 es mayor que el fondo (0) para flotar, pero MENOR que el buscador (50) para no taparlo */}
      <section className="relative z-20 -mt-20 w-[90%] max-w-[1200px] mx-auto pointer-events-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto">
          
          <Link href="/products?status=available" className="group">
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex items-center gap-4 cursor-pointer">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <CheckCircle size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Lotes Vigentes</h3>
                <p className="text-sm text-slate-500">Garantía completa de fábrica</p>
              </div>
            </div>
          </Link>

          <Link href="/products?status=near_expiry" className="group">
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex items-center gap-4 cursor-pointer">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Próximos a Vencer</h3>
                <p className="text-sm text-slate-500">Descuentos por caducidad próxima</p>
              </div>
            </div>
          </Link>

           <Link href="/products?status=expired" className="group">
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex items-center gap-4 cursor-pointer">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <XCircle size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Outlet / Caducados</h3>
                <p className="text-sm text-slate-500">Insumos para prácticas o merma</p>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* ======= PROMO SECTION ======= */}
      <section className="py-20 w-[90%] max-w-[1200px] mx-auto">
        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-10 md:p-16 shadow-2xl text-white overflow-visible flex flex-col md:flex-row items-center">
           
           <div className="md:w-1/2 z-10">
             <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
               Destacado del mes
             </span>
             <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
               Equipamiento Médico <br/> de Alta Protección
             </h2>
             <p className="text-blue-100 text-lg mb-8 max-w-md">
               Encuentra mascarillas, guantes y batas quirúrgicas con certificación ISO. Precios especiales por volumen.
             </p>
             <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
               Ver Catálogo Completo
             </button>
           </div>

           <div className="hidden md:block absolute right-0 bottom-0 w-[45%] h-[140%] pointer-events-none">
             <img 
               src="/Images/Home2.png" 
               alt="Mascarilla 3D" 
               className="w-full h-full object-contain object-bottom drop-shadow-2xl"
               style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.4))" }} 
             />
           </div>
        </div>
      </section>

      {/* ======= LISTADO DE PRODUCTOS ======= */}
      <section className="py-10 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Últimos Productos Agregados</h2>
            <Link href="/products" className="text-blue-600 font-semibold hover:underline">Ver todos</Link>
          </div>

          <div className="flex flex-col gap-4">
            {products && products.length > 0 ? (
              // Usamos el componente CLIENT CARD que conecta con los hooks de lotes
              products.slice(0, 5).map((product) => (
                <ClientProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">Cargando catálogo...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-20">
        <div className="w-[90%] max-w-[1200px] mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white font-bold mb-4">MedBay</h4>
            <p className="text-sm">Tu socio estratégico en suministros médicos B2B.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/About" className="hover:text-white">Nosotros</Link></li>
              <li><Link href="/products" className="hover:text-white">Catálogo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/Contact" className="hover:text-white">Contacto</Link></li>
              <li><a href="#" className="hover:text-white">Devoluciones</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacidad</a></li>
              <li><a href="#" className="hover:text-white">Términos</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs pt-8 border-t border-slate-800">
          © 2025 MedBay Inc. Todos los derechos reservados.
        </div>
      </footer>

    </div>
  );
}