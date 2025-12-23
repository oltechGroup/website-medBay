//frontend/src/components/features/products/client/catalog/CatalogNavigation.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, ChevronRight } from "lucide-react";

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
      label: 'Vigentes', 
      desc: 'Garantía de fábrica',
      icon: CheckCircle, 
      color: 'bg-emerald-600', 
      lightColor: 'bg-emerald-50 text-emerald-700' 
    },
    { 
      id: 'near_expiry', 
      label: 'Próximos a Vencer', 
      desc: 'Precios reducidos',
      icon: AlertTriangle, 
      color: 'bg-amber-500', 
      lightColor: 'bg-amber-50 text-amber-700' 
    },
    { 
      id: 'expired', 
      label: 'Outlet / Caducados', 
      desc: 'Uso no clínico',
      icon: XCircle, 
      color: 'bg-red-600', 
      lightColor: 'bg-red-50 text-red-700' 
    },
  ];

  if (currentStatus === 'all') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleNavigate(section.id)}
            className="group relative bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 text-left flex items-center gap-5 overflow-hidden"
          >
            {/* Círculo de fondo sutil al hover */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-5 transition-opacity ${section.color}`}></div>
            
            <div className={`p-4 rounded-2xl text-white shadow-lg shadow-current/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${section.color}`}>
              <section.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                {section.label}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{section.desc}</p>
            </div>
            <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm">
      <button
        onClick={() => handleNavigate('all')}
        className="group flex items-center gap-3 text-slate-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all pl-2"
      >
        <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
          <ArrowLeft size={16} />
        </div>
        Volver al Catálogo General
      </button>

      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
        {sections.map((section) => {
          const isActive = currentStatus === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleNavigate(section.id)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${
                isActive 
                  ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <section.icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-300'} />
              <span>{section.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};