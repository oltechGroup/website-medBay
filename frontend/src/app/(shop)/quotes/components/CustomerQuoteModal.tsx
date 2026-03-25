// frontend/src/app/(shop)/quotes/components/CustomerQuoteModal.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Calendar, Package, DollarSign, 
  CheckCircle2, XCircle, AlertTriangle, 
  FileText, Clock, ShieldCheck, Tag, Ban, Stethoscope,
  Layers // 🚀 Icono para UOM
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CustomerQuote } from '@/hooks/useCustomerQuotes';

interface CustomerQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: CustomerQuote | null;
  onRespond: (id: string, action: 'accepted' | 'rejected') => Promise<{ orderId?: string } | void>;
  isResponding: boolean;
}

export default function CustomerQuoteModal({ 
  isOpen, 
  onClose, 
  quote, 
  onRespond, 
  isResponding 
}: CustomerQuoteModalProps) {
  
  const router = useRouter();

  if (!isOpen || !quote) return null;

  const proposal = quote.admin_proposal;
  const request = quote.product_request;

  if (!proposal) return null;

  // 🚀 Extraemos la unidad de medida del contexto
  const requestedUom = quote.quote_context?.requested_uom || "units";

  // --- VISUAL HELPERS ---
  const getLotTypeConfig = (type: string) => {
    switch (type) {
      case 'in_date':
        return {
          label: 'Current / In Date',
          description: 'Product within its normal shelf life.',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 size={18} className="text-emerald-600" />
        };
      case 'short_date':
        return {
          label: 'Short-Dated',
          description: 'Product nearing expiration. Reduced price.',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Clock size={18} className="text-amber-600" />
        };
      case 'expired':
        return {
          label: 'Expired',
          description: 'For educational, research or training use only. NOT FOR CLINICAL USE.',
          color: 'bg-red-50 text-red-800 border-red-200',
          icon: <AlertTriangle size={18} className="text-red-600" />
        };
      case 'equipment': 
        return {
          label: 'New / Durable',
          description: 'Medical equipment or precision instrument.',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <Stethoscope size={18} className="text-blue-600" />
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
  const isEquipment = proposal.lot_type === 'equipment';

  const isAccepted = quote.status === 'accepted';
  const isRejected = quote.status === 'rejected';
  const isActionable = quote.status === 'proposal_sent';

  const handleAction = async (action: 'accepted' | 'rejected') => {
    try {
      const result = await onRespond(quote.id, action);
      if (action === 'accepted' && result?.orderId) {
        onClose();
        router.push(`/orders?newOrder=${result.orderId}`);
      }
    } catch (error) {
       console.error("Error processing action", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-3xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 border border-white/20">
        
        {/* HEADER */}
        <div className="bg-white px-6 py-5 md:px-8 md:py-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
               <FileText size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-none">Proposal</h2>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Ref: {request.sku}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6 md:space-y-8 bg-slate-50/50">
          
          {/* 1. PRODUCT SUMMARY (Actualizado con UOM solicitada) */}
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-start gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                   <Package size={24} className="text-slate-400 md:w-8 md:h-8" />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Requested Product</p>
                   <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug mb-2 truncate md:whitespace-normal">{request.product_name}</h3>
                   <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                      {/* 🚀 Visualización clara de cantidad + unidad */}
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold text-slate-700">
                        Qty: {request.quantity_asked} 
                        <span className="text-blue-600 uppercase font-black tracking-tighter">{requestedUom}</span>
                      </span>
                      <span className="font-mono text-[10px] md:text-xs">SKU: {request.sku}</span>
                   </div>
                </div>
              </div>
          </div>

          {/* 2. THE OFFER */}
          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-slate-400" />
                <h3 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest">Offer Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div className={`p-5 md:p-6 rounded-3xl border-2 ${lotConfig.color} bg-white relative overflow-hidden group`}>
                   <div className="flex justify-between items-start mb-3 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Condition</span>
                      <div className="p-1 bg-white rounded-full shadow-sm">{lotConfig.icon}</div>
                   </div>
                   <p className="text-lg md:text-xl font-black mb-1 relative z-10">{lotConfig.label}</p>
                   <p className="text-[10px] md:text-xs font-medium opacity-80 leading-relaxed relative z-10">{lotConfig.description}</p>
                   <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
                      {lotConfig.icon}
                   </div>
                </div>

                {/* PRICE CARD (Actualizado para mostrar 'per unit') */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price</span>
                      <Tag size={16} className="text-blue-500" />
                   </div>
                   <div>
                     <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                       {formatCurrency(proposal.unit_price)}
                     </p>
                     <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Price per {requestedUom}</p>
                   </div>
                </div>

                {/* QUANTITY CARD (Actualizado con UOM) */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Availability</span>
                      <Package size={16} className="text-slate-400"/>
                   </div>
                   <div className="flex items-baseline gap-1.5">
                      <p className="text-xl md:text-2xl font-black text-slate-800">{proposal.quantity_found}</p>
                      {/* 🚀 Muestra la unidad aquí también */}
                      <span className="text-xs md:text-sm font-black text-blue-600 uppercase">{requestedUom}</span>
                   </div>
                   {proposal.quantity_found < request.quantity_asked && (
                     <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                       <AlertTriangle size={10} />
                       <span className="text-[10px] font-bold">Partial ({request.quantity_asked} requested)</span>
                     </div>
                   )}
                </div>

                {!isEquipment && (
                  <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration</span>
                        <Calendar size={16} className="text-slate-400"/>
                     </div>
                     <p className="text-lg md:text-xl font-black text-slate-800">
                       {proposal.expiry_date ? formatDate(proposal.expiry_date) : 'N/A'}
                     </p>
                     <p className="text-[10px] text-slate-400 font-medium mt-1">Certified exact date</p>
                  </div>
                )}
              </div>

              {proposal.admin_notes && (
                <div className="bg-blue-50 p-4 md:p-5 rounded-2xl border border-blue-100 flex gap-3 items-start mt-4">
                   <FileText className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                   <div className="text-xs md:text-sm text-blue-900">
                      <span className="font-bold block mb-1">Seller's Note:</span>
                      <p className="leading-relaxed opacity-80">"{proposal.admin_notes}"</p>
                   </div>
                </div>
              )}
          </div>

          <div className="border-t border-slate-200 pt-6 flex justify-between items-end">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
               <p className="text-[10px] text-slate-400">Taxes not included</p>
             </div>
             <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
               {formatCurrency(totalAmount)}
             </span>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-5 md:p-6 bg-white border-t border-slate-100 sticky bottom-0 z-10 flex-shrink-0">
           {isActionable ? (
               <div className="flex gap-3 md:gap-4">
                   <button 
                     onClick={() => handleAction('rejected')} 
                     disabled={isResponding}
                     className="flex-1 py-3.5 md:py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 text-xs md:text-sm uppercase tracking-wide"
                   >
                     Reject
                   </button>
                   
                   <button 
                     onClick={() => handleAction('accepted')} 
                     disabled={isResponding}
                     className="flex-[2] py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-wide hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 group"
                   >
                     {isResponding ? 'Processing...' : (
                       <>
                         <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform md:w-5 md:h-5" /> Accept Proposal
                       </>
                     )}
                   </button>
               </div>
           ) : isAccepted ? (
               <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-800 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold animate-in zoom-in">
                   <CheckCircle2 size={20}/> Quote Accepted!
               </div>
           ) : isRejected ? (
               <div className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold animate-in zoom-in">
                   <Ban size={20}/> Quote Rejected
               </div>
           ) : null}
        </div>

      </div>
    </div>
  );
}