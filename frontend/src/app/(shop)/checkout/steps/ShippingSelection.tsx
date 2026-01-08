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
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">Método de Envío</h2>
        <p className="text-slate-500">Selecciona la velocidad de entrega para tu orden.</p>
      </div>

      <div className="grid gap-6">
        {OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.id;

          return (
            <div 
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`
                relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-6 group
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20' 
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'}
              `}
            >
              {/* Icono */}
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors
                ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
              `}>
                <option.icon size={32} />
              </div>

              {/* Info Central */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`text-lg font-black ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                    {option.title}
                  </h3>
                  {isSelected && <CheckCircle2 size={20} className="text-blue-600" />}
                </div>
                
                <p className="text-sm text-slate-500 mb-3 leading-relaxed max-w-md">
                  {option.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg w-fit shadow-sm">
                  <Calendar size={14} className="text-blue-500" />
                  Llega el: <span className="capitalize">{getDeliveryDate(option.days)}</span>
                </div>
              </div>

              {/* Precio */}
              <div className="text-right pl-4 border-l border-slate-100 hidden sm:block">
                <span className="block text-2xl font-black text-slate-900">{formatCurrency(option.price)}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarifa Plana</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navegación */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
        <button 
          onClick={onBack}
          className="text-slate-500 font-bold hover:text-slate-800 transition-colors px-4 py-2"
        >
          ← Volver a Dirección
        </button>

        <button 
          onClick={onNext}
          disabled={!selectedMethod}
          className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center gap-2"
        >
          Continuar al Pago
        </button>
      </div>

    </div>
  );
};