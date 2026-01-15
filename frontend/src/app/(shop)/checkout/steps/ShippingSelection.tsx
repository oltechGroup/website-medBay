//frontend/src/app/(shop)/checkout/steps/ShippingSelection.tsx
"use client";

import { Truck, Zap, Calendar, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface ShippingSelectionProps {
  selectedMethod: 'standard' | 'express' | null;
  onSelect: (method: 'standard' | 'express') => void;
  onNext: () => void;
  onBack: () => void;
}

export const ShippingSelection = ({ selectedMethod, onSelect, onNext, onBack }: ShippingSelectionProps) => {
  
  // Helper para calcular fecha de entrega estimada
  const getDeliveryDate = (daysToAdd: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return new Intl.DateTimeFormat("es-MX", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  const OPTIONS = [
    {
      id: 'standard',
      title: 'Envío Estándar',
      days: 6,
      price: 50,
      icon: Truck,
      description: 'Logística terrestre consolidada. Ideal para reabastecimiento programado.'
    },
    {
      id: 'express',
      title: 'Envío Express Aéreo',
      days: 3,
      price: 100,
      icon: Zap,
      description: 'Prioridad alta con manejo refrigerado si se requiere. Entrega garantizada.'
    }
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-black text-slate-800">Método de Envío</h2>
        <p className="text-slate-500 text-sm md:text-base">Selecciona la velocidad de entrega para tu orden.</p>
      </div>

      <div className="grid gap-4 md:gap-6">
        {OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.id;

          return (
            <div 
              key={option.id}
              onClick={() => onSelect(option.id)}
              // Ajuste: flex-col en móvil para apilar elementos
              className={`
                relative p-5 md:p-6 rounded-2xl md:rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 group
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20' 
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'}
              `}
            >
              {/* Header móvil (Icono + Precio) */}
              <div className="flex justify-between items-center w-full sm:w-auto">
                 <div className={`
                   w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors
                   ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                 `}>
                   <option.icon size={24} className="md:w-8 md:h-8" />
                 </div>
                 {/* Precio visible en móvil aquí */}
                 <div className="text-right sm:hidden">
                    <span className="block text-xl font-black text-slate-900">{formatCurrency(option.price)}</span>
                 </div>
              </div>

              {/* Info Central */}
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 md:gap-3">
                    <h3 className={`text-base md:text-lg font-black ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                      {option.title}
                    </h3>
                    {isSelected && <CheckCircle2 size={18} className="text-blue-600 md:w-5 md:h-5" />}
                  </div>
                </div>
                
                <p className="text-xs md:text-sm text-slate-500 mb-3 leading-relaxed max-w-md">
                  {option.description}
                </p>

                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg w-fit shadow-sm">
                  <Calendar size={12} className="text-blue-500 md:w-[14px] md:h-[14px]" />
                  Llega el: <span className="capitalize">{getDeliveryDate(option.days)}</span>
                </div>
              </div>

              {/* Precio Desktop (Visible solo en sm+) */}
              <div className="text-right pl-4 border-l border-slate-100 hidden sm:block">
                <span className="block text-2xl font-black text-slate-900">{formatCurrency(option.price)}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarifa Plana</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navegación */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-8 md:mt-10 pt-6 border-t border-slate-100">
        <button 
          onClick={onBack}
          className="text-slate-500 font-bold hover:text-slate-800 transition-colors px-4 py-3 w-full sm:w-auto text-sm"
        >
          ← Volver a Dirección
        </button>

        <button 
          onClick={onNext}
          disabled={!selectedMethod}
          className="bg-slate-900 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto text-sm md:text-base"
        >
          Continuar al Pago
        </button>
      </div>

    </div>
  );
};