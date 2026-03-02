//frontend/src/components/features/products/client/catalog/CatalogNavigation.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, ChevronRight, Stethoscope } from "lucide-react"; // ✅ IMPORTADO STETHOSCOPE

export const CatalogNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";

  const handleNavigate = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const sections = [
    { 
      id: 'available', 
      label: 'Current', 
      desc: 'Factory warranty',
      icon: CheckCircle, 
      color: 'bg-emerald-600', 
      lightColor: 'bg-emerald-50 text-emerald-700' 
    },
    { 
      id: 'near_expiry', 
      label: 'Near Expiry', 
      desc: 'Reduced prices',
      icon: AlertTriangle, 
      color: 'bg-amber-500', 
      lightColor: 'bg-amber-50 text-amber-700' 
    },
    { 
      id: 'expired', 
      label: 'Outlet / Expired', 
      desc: 'Non-clinical use',
      icon: XCircle, 
      color: 'bg-red-600', 
      lightColor: 'bg-red-50 text-red-700' 
    },
    { 
      id: 'equipment', // ✅ NUEVA SECCIÓN
      label: 'Equipment', 
      desc: 'Durable devices',
      icon: Stethoscope, 
      color: 'bg-blue-600', 
      lightColor: 'bg-blue-50 text-blue-700' 
    },
  ];

  if (currentStatus === 'all') {
    return (
      // ✅ AJUSTADO A 4 COLUMNAS (lg:grid-cols-4)
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleNavigate(section.id)}
            className="group relative bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 p-5 md:p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 text-left flex items-center gap-4 md:gap-5 overflow-hidden active:scale-[0.98]"
          >
            {/* Subtle background circle on hover */}
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 md:w-24 md:h-24 rounded-full opacity-0 group-hover:opacity-5 transition-opacity ${section.color}`}></div>
            
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl text-white shadow-lg shadow-current/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${section.color}`}>
              <section.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors truncate">
                {section.label}
              </h3>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{section.desc}</p>
            </div>
            <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all md:w-[18px] md:h-[18px]" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-6 md:mb-10 bg-white p-2 md:p-3 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm">
      
      {/* Back Button - Full width on mobile */}
      <button
        onClick={() => handleNavigate('all')}
        className="w-full md:w-auto group flex items-center justify-center md:justify-start gap-3 text-slate-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all px-2 py-2 md:pl-2"
      >
        <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
          <ArrowLeft size={16} />
        </div>
        Back to Catalog
      </button>

      {/* Tabs - Horizontal scroll on very small mobiles or wrap */}
      <div className="flex w-full md:w-auto gap-1 md:gap-2 bg-slate-100 p-1 md:p-1.5 rounded-xl md:rounded-2xl overflow-x-auto no-scrollbar">
        {sections.map((section) => {
          const isActive = currentStatus === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleNavigate(section.id)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-tighter transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <section.icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-300'} />
              {/* On mobile only show the first word to save space */}
              <span className="hidden sm:inline">{section.label}</span>
              <span className="sm:hidden">{section.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};