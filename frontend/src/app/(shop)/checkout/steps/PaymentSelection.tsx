//frontend/src/app/(shop)/checkout/steps/PaymentSelection.tsx
"use client";

import { useState } from "react";
import { 
  CreditCard, Banknote, Landmark, Percent, 
  User, FileText, Loader2, ShieldCheck, AlertCircle 
} from "lucide-react";

interface PaymentSelectionProps {
  selectedMethod: string | null;
  referralCode: string;
  onSelectMethod: (method: string) => void;
  onChangeReferral: (code: string) => void;
  onConfirmOrder: (notes: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

export const PaymentSelection = ({ 
  selectedMethod, 
  referralCode,
  onSelectMethod, 
  onChangeReferral,
  onConfirmOrder, 
  onBack,
  isProcessing 
}: PaymentSelectionProps) => {
  
  const [notes, setNotes] = useState("");

  const PAYMENT_OPTIONS = [
    {
      id: 'wire',
      title: 'Transferencia Internacional (Wire)',
      fee: '0%',
      description: 'Transferencia SWIFT directa a nuestra cuenta en USA.',
      icon: Landmark
    },
    {
      id: 'zelle',
      title: 'Zelle',
      fee: '0%',
      description: 'Pago instantáneo sin comisiones (Solo cuentas USA).',
      icon: ZapIcon // Definido abajo o usar otro
    },
    {
      id: 'mx_transfer',
      title: 'Transferencia MX (Factura)',
      fee: '+16%',
      description: 'Transferencia SPEI en pesos mexicanos. Incluye Factura Fiscal.',
      icon: Banknote,
      highlight: true
    },
    {
      id: 'card',
      title: 'Tarjeta Crédito / Débito',
      fee: '+4%',
      description: 'Procesamiento seguro vía Stripe. Aplica comisión bancaria.',
      icon: CreditCard
    },
    {
      id: 'paypal',
      title: 'PayPal',
      fee: '+4%',
      description: 'Protección al comprador. Aplica comisión de plataforma.',
      icon: WalletIcon // Definido abajo
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">Pago y Confirmación</h2>
        <p className="text-slate-500">Selecciona tu método de pago y finaliza la orden.</p>
      </div>

      {/* 1. SELECCIÓN DE MÉTODO */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Método de Pago</h3>
        <div className="grid gap-4">
          {PAYMENT_OPTIONS.map((option) => {
            const isSelected = selectedMethod === option.id;
            return (
              <div 
                key={option.id}
                onClick={() => onSelectMethod(option.id)}
                className={`
                  relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4
                  ${isSelected 
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20' 
                    : 'border-slate-100 bg-white hover:border-slate-300'}
                `}
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}
                `}>
                  <option.icon size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                      {option.title}
                    </h4>
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${option.fee === '0%' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      Comisión: {option.fee}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </div>

                {isSelected && (
                  <div className="absolute top-5 right-5 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CÓDIGO DE VENDEDOR */}
      <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-slate-400" size={20} />
          <h3 className="font-bold text-slate-700">¿Te atiende un vendedor?</h3>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ingresa el código de tu asesor (Opcional)"
            value={referralCode}
            onChange={(e) => onChangeReferral(e.target.value)}
            className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase tracking-widest font-bold placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
            REF CODE
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2 ml-1">Esto ayudará a asignar tu orden al agente correcto.</p>
      </div>

      {/* 3. NOTAS ADICIONALES */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Notas de la Orden</h3>
        <textarea 
          placeholder="Instrucciones especiales de entrega, referencias, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 h-24 resize-none transition-colors"
        ></textarea>
      </div>

      {/* AVISO LEGAL */}
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 mb-8">
        <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
        <p className="text-xs text-blue-800 leading-relaxed">
          Al generar esta orden, el inventario quedará <strong>reservado por 24 horas</strong>. 
          Un administrador validará la disponibilidad final y aprobará tu orden para proceder al pago.
        </p>
      </div>

      {/* NAVEGACIÓN */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
        <button 
          onClick={onBack}
          disabled={isProcessing}
          className="text-slate-500 font-bold hover:text-slate-800 transition-colors px-4 py-2"
        >
          ← Volver
        </button>

        <button 
          onClick={() => onConfirmOrder(notes)}
          disabled={!selectedMethod || isProcessing}
          className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center gap-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Procesando...
            </>
          ) : (
            <>
              Generar Orden de Compra
              <ShieldCheck size={20} />
            </>
          )}
        </button>
      </div>

    </div>
  );
};

// Iconos auxiliares simples
const ZapIcon = ({ size }: {size:number}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
const WalletIcon = ({ size }: {size:number}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-7"></path><path d="M14 7V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"></path><path d="M13 14h7"></path><path d="M13 18h7"></path></svg>
);