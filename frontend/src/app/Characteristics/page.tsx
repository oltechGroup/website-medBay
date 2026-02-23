//frontend/src/app/Characteristics/page.tsx

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { 
  Database, 
  ShieldCheck, 
  LayoutDashboard, 
  FileSpreadsheet, 
  ArrowRight,
  Stethoscope,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function Features() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* ======= HERO SECTION ======= */}
      {/* Adjustment: pt-32 to compensate for fixed Header */}
      <section className="relative pt-32 pb-24 md:pb-32 overflow-hidden bg-slate-900">
         <div className="absolute inset-0 z-0">
            <img 
                src="/Images/4.png" 
                alt="Medical Background" 
                className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-50"></div>
         </div>
         
         <div className="relative z-10 w-[90%] max-w-[1000px] mx-auto text-center px-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold mb-6 animate-fade-in backdrop-blur-md">
               <Stethoscope size={14} /> CUTTING-EDGE B2B TECHNOLOGY
            </div>
            {/* Adjustment: Smaller text on mobile (text-4xl) to avoid cuts */}
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 md:mb-8 tracking-tight leading-tight">
               <span className="text-blue-400">MedBay</span> Features
            </h1>
            <p className="text-slate-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
               Our platform is designed to facilitate the management of medical supplies, 
               optimizing every stage of the commercial process.
            </p>
         </div>
      </section>

      {/* ======= FEATURES GRID ======= */}
      {/* Adjustment: Less negative margin on mobile to prevent crowding */}
      <section className="relative z-20 -mt-12 md:-mt-16 pb-24 w-[90%] max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-0 md:px-0">
          
          <div className="group bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-blue-200 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              <Database size={28} className="md:w-8 md:h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 tracking-tight">Product Management</h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed">
              Easily control your medical supply catalog with options for 
              editing, bulk updates, and quick view. We integrate 
              advanced filters by SKU and manufacturer.
            </p>
          </div>

          <div className="group bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-blue-200 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
              <FileSpreadsheet size={28} className="md:w-8 md:h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 tracking-tight">Smart Import</h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed">
              Import your products from Excel files or external databases 
              with automatic validation and error detection. 
              Ideal for massive dropshipping-type inventories.
            </p>
          </div>

          <div className="group bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-blue-200 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
              <LayoutDashboard size={28} className="md:w-8 md:h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 tracking-tight">Admin Dashboard</h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed">
              Oversee suppliers, buyers, and orders in a clear and 
              functional dashboard. Access sales metrics and shipping statuses in real-time.
            </p>
          </div>

          <div className="group bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-blue-200 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-all duration-500">
              <ShieldCheck size={28} className="md:w-8 md:h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 tracking-tight">Security and Compliance</h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed">
              We comply with international regulations and security standards to ensure 
              the protection of medical and business data under SSL encryption.
            </p>
          </div>
        </div>
      </section>

      {/* ======= IMPROVED CTA SECTION ======= */}
      <section className="relative py-12 md:py-20 px-[5%]">
        <div className="max-w-[1200px] mx-auto relative min-h-[auto] md:min-h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-slate-950 flex items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5">
          
          <div className="absolute inset-0 z-0">
            <img 
              src="/Images/2.jpg" 
              alt="Surgery Background" 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-blue-900/40"></div>
          </div>

          {/* Adjustment: Responsive padding (p-8 on mobile) */}
          <div className="relative z-10 p-8 md:p-20 w-full lg:w-3/5 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-6 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Sparkles size={16} /> Future of medical logistics
            </div>
            {/* Adjustment: Responsive text */}
            <h2 className="text-3xl md:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tight">
              Ready to modernize your <span className="text-blue-500">supply chain?</span>
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
              <Link 
                href="/register" 
                className="group flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 w-full sm:w-auto"
              >
                Get started now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/Contact" 
                className="flex items-center justify-center bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all w-full sm:w-auto"
              >
                Talk to an advisor
              </Link>
            </div>
          </div>

          {/* Small Logo (Hidden on mobile) */}
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