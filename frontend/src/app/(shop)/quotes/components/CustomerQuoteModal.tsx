//frontend/src/app/(shop)/quotes/components/CustomerQuoteModal.tsx
"use client";

import React from 'react';
import { 
  X, Calendar, Package, DollarSign, 
  CheckCircle2, XCircle, AlertTriangle, 
  FileText, Clock, ShieldCheck, Tag
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CustomerQuote } from '@/hooks/useCustomerQuotes';

interface CustomerQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: CustomerQuote | null;
  onRespond: (id: string, action: 'accepted' | 'rejected') => Promise<void>;
  isResponding: boolean;
}

export default function CustomerQuoteModal({ 
  isOpen, 
  onClose, 
  quote, 
  onRespond, 
  isResponding 
}: CustomerQuoteModalProps) {

  if (!isOpen || !quote) return null;

  const proposal = quote.admin_proposal;
  const request = quote.product_request;

  // Si está abierta pero aún no tiene propuesta
  if (!proposal) return null;

  // --- HELPERS VISUALES ---
  const getLotTypeConfig = (type: string) => {
    switch (type) {
      case 'in_date':
        return {
          label: 'Vigente / In Date',
          description: 'Producto dentro de su vida útil normal.',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 size={18} className="text-emerald-600" />
        };
      case 'short_date':
        return {
          label: 'Corta Caducidad',
          description: 'Producto próximo a vencer. Precio reducido.',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Clock size={18} className="text-amber-600" />
        };
      case 'expired':
        return {
          label: 'Caducado / Expired',
          description: 'Solo para uso educativo, investigación o entrenamiento. NO USO CLÍNICO.',
          color: 'bg-red-50 text-red-800 border-red-200',
          icon: <AlertTriangle size={18} className="text-red-600" />
        };
      default:
        return {
          label: type,
          description: '',
          color: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: <Package size={18} />
        };
    }
  };

  const lotConfig = getLotTypeConfig(proposal.lot_type);
  const totalAmount = proposal.unit_price * proposal.quantity_found;

  return (
    // ⚡ AJUSTE Z-INDEX: 2000 para superar al Header
    <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      {/* ⚡ AJUSTE MÓVIL: h-[90vh] fijo + rounded-t-3xl para estilo 'bottom sheet' */}
      <div className="relative bg-white w-full max-w-3xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 border border-white/20">
        
        {/* HEADER (Sticky) */}
        <div className="bg-white px-6 py-5 md:px-8 md:py-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
               <FileText size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-none">Propuesta</h2>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Ref: {request.sku}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        {/* ⚡ AJUSTE: Flex-1 y overflow-y-auto aseguran el scroll interno */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6 md:space-y-8 bg-slate-50/50">
          
          {/* 1. RESUMEN DEL PRODUCTO */}
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-start gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                   <Package size={24} className="text-slate-400 md:w-8 md:h-8" />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Producto Solicitado</p>
                   <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug mb-2 truncate md:whitespace-normal">{request.product_name}</h3>
                   <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] md:text-xs">Cant: {request.quantity_asked}</span>
                      <span className="font-mono text-[10px] md:text-xs">SKU: {request.sku}</span>
                   </div>
                </div>
              </div>
          </div>

          {/* 2. LA OFERTA (Grid Responsivo) */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
               <ShieldCheck size={16} className="text-slate-400" />
               <h3 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest">Detalles de la Oferta</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                
                {/* TARJETA DE CONDICIÓN */}
                <div className={`p-5 md:p-6 rounded-3xl border-2 ${lotConfig.color} bg-white relative overflow-hidden group`}>
                   <div className="flex justify-between items-start mb-3 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Condición</span>
                      <div className="p-1 bg-white rounded-full shadow-sm">{lotConfig.icon}</div>
                   </div>
                   <p className="text-lg md:text-xl font-black mb-1 relative z-10">{lotConfig.label}</p>
                   <p className="text-[10px] md:text-xs font-medium opacity-80 leading-relaxed relative z-10">{lotConfig.description}</p>
                   <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
                      {lotConfig.icon}
                   </div>
                </div>

                {/* TARJETA DE PRECIO */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Unitario</span>
                      <Tag size={16} className="text-blue-500" />
                   </div>
                   <div>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(proposal.unit_price)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Moneda: USD</p>
                   </div>
                </div>

                {/* TARJETA DE CANTIDAD */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidad</span>
                      <Package size={16} className="text-slate-400"/>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <p className="text-xl md:text-2xl font-black text-slate-800">{proposal.quantity_found}</p>
                      <span className="text-xs md:text-sm font-bold text-slate-400">unidades</span>
                   </div>
                   {proposal.quantity_found < request.quantity_asked && (
                     <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                       <AlertTriangle size={10} />
                       <span className="text-[10px] font-bold">Parcial ({request.quantity_asked} solicitadas)</span>
                     </div>
                   )}
                </div>

                {/* TARJETA DE CADUCIDAD */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</span>
                      <Calendar size={16} className="text-slate-400"/>
                   </div>
                   <p className="text-lg md:text-xl font-black text-slate-800">
                     {formatDate(proposal.expiry_date)}
                   </p>
                   <p className="text-[10px] text-slate-400 font-medium mt-1">Fecha exacta certificada</p>
                </div>
             </div>

             {/* NOTAS DEL VENDEDOR */}
             {proposal.admin_notes && (
                <div className="bg-blue-50 p-4 md:p-5 rounded-2xl border border-blue-100 flex gap-3 items-start mt-4">
                   <FileText className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                   <div className="text-xs md:text-sm text-blue-900">
                      <span className="font-bold block mb-1">Nota del Vendedor:</span>
                      <p className="leading-relaxed opacity-80">"{proposal.admin_notes}"</p>
                   </div>
                </div>
             )}
          </div>

          {/* 3. RESUMEN ECONÓMICO */}
          <div className="border-t border-slate-200 pt-6 flex justify-between items-end">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p>
               <p className="text-[10px] text-slate-400">Impuestos no incluidos</p>
             </div>
             <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(totalAmount)}
             </span>
          </div>

        </div>

        {/* FOOTER (Sticky Bottom) */}
        <div className="p-5 md:p-6 bg-white border-t border-slate-100 flex gap-3 md:gap-4 sticky bottom-0 z-10 flex-shrink-0">
           <button 
             onClick={() => onRespond(quote.id, 'rejected')}
             disabled={isResponding}
             className="flex-1 py-3.5 md:py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 text-xs md:text-sm uppercase tracking-wide"
           >
             Rechazar
           </button>
           
           <button 
             onClick={() => onRespond(quote.id, 'accepted')}
             disabled={isResponding}
             className="flex-[2] py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-wide hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 group"
           >
             {isResponding ? 'Procesando...' : (
               <>
                 <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform md:w-5 md:h-5" /> Aceptar
               </>
             )}
           </button>
        </div>

      </div>
    </div>
  );
}