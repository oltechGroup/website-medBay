//frontend/src/app/About/page.tsx

import Link from "next/link";
import { 
  Target, 
  Eye, 
  ShieldCheck, 
  Award, 
  Users, 
  ChevronRight, 
  Sparkles, 
  HeartHandshake 
} from "lucide-react";

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* ======= HERO SECTION (Ajustado a la línea visual) ======= */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900">
         <div className="absolute inset-0 z-0">
            <img 
                src="public/images/3.jpg" 
                alt="Medical Mission" 
                className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
            {/* Gradiente idéntico al de Características */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-50"></div>
         </div>
         
         <div className="relative z-10 w-[90%] max-w-[1000px] mx-auto text-center px-4">
            {/* LA PLAQUITA TRASLÚCIDA */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold mb-6 animate-fade-in">
               <HeartHandshake size={14} /> COMPROMISO CON LA SALUD GLOBAL
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">
              Sobre <span className="text-blue-400">Nosotros</span>
            </h1>
            <p className="text-slate-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
              En MedBay trabajamos para conectar el sector médico con soluciones
              tecnológicas eficientes y seguras. Facilitamos el acceso global a dispositivos que salvan vidas.
            </p>
         </div>
      </section>

      {/* ======= MISIÓN Y VISIÓN (Estilo Tarjeta Características) ======= */}
      <section className="relative z-20 -mt-16 pb-24 w-[90%] max-w-[1200px] mx-auto px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tarjeta Misión */}
          <div className="group bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-blue-200 transition-all duration-500">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
              <Target size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Nuestra Misión</h2>
            <p className="text-slate-500 text-lg leading-relaxed font-medium">
              Facilitar la compra y venta de insumos médicos mediante una
              plataforma confiable que impulse la innovación en el sector salud, 
              eliminando las barreras logísticas y garantizando calidad.
            </p>
          </div>

          {/* Tarjeta Visión */}
          <div className="group bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-indigo-200 transition-all duration-500">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
              <Eye size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Nuestra Visión</h2>
            <p className="text-slate-500 text-lg leading-relaxed font-medium">
              Convertirnos en el marketplace líder en Latinoamérica para la
              distribución de productos médicos con cumplimiento normativo
              integrado, siendo el estándar de confianza para hospitales y clínicas.
            </p>
          </div>
        </div>
      </section>

      {/* ======= SECCIÓN DE VALORES (Consistente con Contacto) ======= */}
      <section className="py-24 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto px-4 md:px-0 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold mb-6">
             EXCELENCIA OPERATIVA
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-16 tracking-tight">Valores que nos definen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <ShieldCheck size={40} />, title: "Integridad Técnica", desc: "Cumplimos con cada normativa sanitaria nacional e internacional." },
              { icon: <Award size={40} />, title: "Calidad Global", desc: "Solo trabajamos con proveedores certificados y productos de alta gama." },
              { icon: <Users size={40} />, title: "Enfoque Humano", desc: "Entendemos que detrás de cada dispositivo hay un paciente esperando." }
            ].map((valor, idx) => (
              <div key={idx} className="flex flex-col items-center group">
                <div className="mb-6 p-6 bg-slate-50 rounded-[2rem] text-blue-600 transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:-translate-y-2 shadow-sm">
                  {valor.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-800">{valor.title}</h4>
                <p className="text-slate-500 font-medium max-w-xs leading-relaxed">{valor.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= SECCIÓN CTA PREMIUM (Consistente con los demás) ======= */}
      <section className="relative py-20 px-[5%]">
        <div className="max-w-[1200px] mx-auto relative min-h-[500px] rounded-[3rem] overflow-hidden bg-slate-950 flex items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/2.jpg" 
              alt="Surgery Team" 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-blue-900/40"></div>
          </div>

          <div className="relative z-10 p-10 md:p-20 w-full lg:w-3/5">
            <div className="inline-flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-6 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Sparkles size={16} /> Colaboración Global
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tight">
              ¿Listo para <span className="text-blue-500 italic">colaborar</span> con nosotros?
            </h2>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/register" className="group flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30">
                Crear cuenta profesional
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/Contact" className="flex items-center justify-center bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                Hablar con un asesor
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex absolute right-10 xl:right-20 top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
              <img 
                src="/icons/logomed.png" 
                alt="MedBay Icon" 
                className="w-48 xl:w-64 opacity-50 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-700 hover:scale-105" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}