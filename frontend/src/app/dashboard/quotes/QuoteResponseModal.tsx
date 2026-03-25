// frontend/src/app/dashboard/quotes/QuoteResponseModal.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  X, Package, User, Calendar, DollarSign, 
  FileText, CheckCircle2, AlertTriangle, Send, Tag, Info,
  Phone, Building2, Truck, Trash2, Clock, Ban, Stethoscope,
  Layers, ShieldCheck, Loader2, ChevronDown // 🚀 CORRECCIÓN: Agregados ShieldCheck, Loader2 y ChevronDown
} from "lucide-react";
import { useAdminQuotes, Quote } from "@/hooks/useAdminQuotes";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface QuoteResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
}

export default function QuoteResponseModal({ isOpen, onClose, quote }: QuoteResponseModalProps) {
  const { sendProposal, isSending, deleteQuote, isDeleting } = useAdminQuotes();

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    quantity_found: 0,
    unit_price: "",
    expiry_date: "",
    lot_type: "in_date", // 'in_date' | 'short_date' | 'expired' | 'equipment'
    admin_notes: ""
  });

  const [noExpiry, setNoExpiry] = useState(false);

  // --- CARGA DE DATOS INICIALES ---
  useEffect(() => {
    if (quote) {
      const requestNotes = quote.product_request.notes || "";
      const isEquipmentRequested = requestNotes.includes("New / Durable") || 
                                   requestNotes.includes("Equipment") || 
                                   quote.product_request.quote_context?.status === 'equipment';
      
      let initialLotType = "in_date";
      if (isEquipmentRequested) initialLotType = "equipment";
      else if (requestNotes.includes("Short-Dated")) initialLotType = "short_date";
      else if (requestNotes.includes("Expired")) initialLotType = "expired";

      setFormData({
        quantity_found: quote.product_request.quantity_asked, 
        unit_price: "",
        expiry_date: "",
        lot_type: initialLotType,
        admin_notes: ""
      });
      
      setNoExpiry(isEquipmentRequested);
    }
  }, [quote, isOpen]);

  // --- CONTROL DE EQUIPO (Sincronización de no caducidad) ---
  useEffect(() => {
    if (formData.lot_type === 'equipment') {
       setNoExpiry(true);
       setFormData(prev => ({ ...prev, expiry_date: "" }));
    }
  }, [formData.lot_type]);

  if (!isOpen || !quote) return null;

  // --- LÓGICA DE EXTRACCIÓN DE INFORMACIÓN ---
  const requestedUom = quote.product_request.quote_context?.requested_uom || "pcs";

  const extractUserNote = (fullNote?: string) => {
    if (!fullNote) return null;
    const separator = "Client Note:"; 
    if (fullNote.includes(separator)) {
        const parts = fullNote.split(separator);
        return parts[parts.length - 1].trim(); 
    }
    if (fullNote.startsWith("[")) {
        return null; 
    }
    return fullNote;
  };

  const userRealNote = extractUserNote(quote.product_request.notes);
  const fullContextNotes = quote.product_request.notes || "";
  const isEquipment = formData.lot_type === 'equipment' || fullContextNotes.includes("New / Durable");

  // --- MANEJADORES DE ACCIONES ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.unit_price) {
      alert("Please enter the unit price.");
      return;
    }
    if (!noExpiry && !formData.expiry_date) {
      alert("Please enter the expiration date or mark as Not Applicable.");
      return;
    }

    try {
      await sendProposal({
        id: quote.id,
        data: {
          ...formData,
          unit_price: parseFloat(formData.unit_price),
          expiry_date: (noExpiry ? null : formData.expiry_date) as any, 
          lot_type: formData.lot_type as any
        }
      });
      onClose(); 
    } catch (error: any) {
      console.error("Error sending proposal:", error);
      alert(error.response?.data?.error || "Failed to send proposal.");
    }
  };

  const handleDelete = async () => {
    if (confirm("CRITICAL: Are you sure you want to delete this quote request? This cannot be undone.")) {
        try {
            await deleteQuote(quote.id);
            onClose();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Administrative Error: Could not delete the record.");
        }
    }
  };

  const clientName = quote.user_name || quote.guest_info?.name || "Anonymous Customer";
  const clientEmail = quote.user_email || quote.guest_info?.email || "No email";
  const clientPhone = quote.user_phone || quote.guest_info?.phone || "No phone provided";
  
  const isAccepted = quote.status === 'accepted';
  const isProposalSent = quote.status === 'proposal_sent';
  const isRejected = quote.status === 'rejected';
  const showReadOnlyState = isAccepted || isProposalSent;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 h-[90vh] md:h-auto max-h-[95vh] border border-white/20">
        
        {/* === LEFT COLUMN: REQUEST SUMMARY === */}
        <div className="w-full md:w-[40%] bg-slate-50 p-6 md:p-10 border-r border-slate-100 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={16}/> Customer Request
            </h3>
            <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-tighter shadow-sm">
              ID: {quote.id.slice(0,8)}
            </span>
          </div>

          <div className="flex-1 space-y-8">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Package size={60} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Target Asset</p>
              <h4 className="text-xl font-black text-slate-900 leading-tight mb-2">{quote.product_request.product_name}</h4>
              <p className="text-xs font-mono text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-200">
                GLOBAL SKU: {quote.product_request.sku}
              </p>
            </div>

            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="flex items-center gap-2 mb-5 relative z-10">
                    <ShieldCheck size={18} className="text-blue-200"/>
                    <span className="text-xs font-black uppercase tracking-widest">Client Preferences</span>
                </div>
                
                <div className="space-y-4 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Layers size={14} className="text-blue-200" />
                           <span className="text-[10px] font-bold uppercase text-blue-100">Packaging:</span>
                        </div>
                        <span className="text-sm font-black uppercase tracking-tighter">{requestedUom}</span>
                    </div>

                    {quote.product_request.quote_context?.lotNumber && (
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-bold text-blue-200 uppercase mb-1">Source Lot Reference</p>
                            <span className="font-mono font-bold text-white text-xs">{quote.product_request.quote_context.lotNumber}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                            <span className="text-[9px] font-bold text-blue-200 uppercase block mb-1">Ref Price</span>
                            <span className="font-black text-white text-sm">{formatCurrency(quote.product_request.quote_context?.referencePrice || 0)}</span>
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-right">
                            <span className="text-[9px] font-bold text-blue-200 uppercase block mb-1">Sys Stock</span>
                            <span className="font-black text-white text-sm">{quote.product_request.quote_context?.stockAvailable || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-5 border-t border-slate-200 pt-6">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-blue-600">
                <Package size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Required Volume</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{quote.product_request.quantity_asked}</p>
                  <span className="text-sm font-black text-blue-600 uppercase tracking-tighter">{requestedUom}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 font-black text-slate-800 text-sm uppercase tracking-tight border-b border-slate-50 pb-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User size={16}/>
                </div>
                {clientName}
              </div>
              <div className="space-y-2 text-xs font-bold text-slate-500">
                  <p className="flex items-center gap-3"><span className="text-blue-500 font-black">@</span> {clientEmail}</p>
                  <p className="flex items-center gap-3"><Phone size={14} className="text-blue-500"/> {clientPhone}</p>
              </div>
            </div>

            {userRealNote && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm shadow-amber-100/50">
                <p className="text-[10px] font-black text-amber-700 mb-2 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14}/> Buyer Message:
                </p>
                <p className="text-sm text-amber-900 italic font-medium leading-relaxed whitespace-pre-wrap">"{userRealNote}"</p>
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN: PROPOSAL FORM === */}
        <div className="w-full md:w-[60%] p-6 md:p-12 bg-white flex flex-col overflow-y-auto custom-scrollbar relative">
          
          <div className="flex justify-between items-center mb-10">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Draft Proposal</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {quote.status.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center gap-3">
                {!isAccepted && (
                    <button onClick={handleDelete} disabled={isDeleting} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-2xl border-2 border-transparent hover:border-red-100 transition-all">
                        <Trash2 size={22}/>
                    </button>
                )}
                <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl border-2 border-slate-100 text-slate-400 transition-all">
                    <X size={24} />
                </button>
            </div>
          </div>

          {isRejected && (
             <div className="mb-8 bg-red-50 border-2 border-red-100 p-5 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm"><Ban size={24}/></div>
                <div>
                    <p className="text-sm font-black text-red-700 uppercase tracking-tight">Proposal Rejected</p>
                    <p className="text-xs text-red-600 font-medium">Please review the client's notes before resending.</p>
                </div>
             </div>
          )}

          {showReadOnlyState ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                {isAccepted ? (
                    <>
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-100">
                            <CheckCircle2 size={48}/>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase">Accepted!</h3>
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 w-full max-w-sm text-left shadow-lg mt-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm font-bold text-slate-500">Unit Price:</span>
                                    <span className="font-black text-slate-900">{formatCurrency(quote.admin_proposal?.unit_price || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-bold text-slate-500">Quantity:</span>
                                    <span className="font-black text-slate-900">{quote.admin_proposal?.quantity_found} {requestedUom}</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-100 animate-pulse">
                            <Clock size={48}/>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase">In Review</h3>
                        <p className="text-slate-500 max-w-sm mb-10 font-medium">Proposal dispatched on {formatDate(quote.admin_proposal?.proposal_date)}.</p>
                        <div className="w-full max-w-sm bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-md text-left">
                            <p className="text-lg font-black text-slate-800">{formatCurrency(quote.admin_proposal?.unit_price || 0)} <span className="text-xs text-slate-400 font-bold uppercase">/ {requestedUom}</span></p>
                        </div>
                    </>
                )}
             </div>
          ) : (
             <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex justify-between">
                      Found Qty <span className="text-blue-600">{requestedUom}</span>
                    </label>
                    <div className="relative group">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input type="number" min="1" required value={formData.quantity_found} onChange={(e) => setFormData({...formData, quantity_found: parseInt(e.target.value) || 0})} className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 font-black text-slate-800 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex justify-between">
                      Price per <span className="text-blue-600 font-black">{requestedUom}</span>
                    </label>
                    <div className="relative group">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input type="number" min="0.01" step="0.01" required placeholder="0.00" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 font-black text-slate-800 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Condition</label>
                    <div className="relative">
                      <select value={formData.lot_type} onChange={(e) => setFormData({...formData, lot_type: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 font-bold text-xs uppercase text-slate-700 bg-slate-50 cursor-pointer appearance-none">
                        <option value="in_date">🟢 Valid (In Date)</option>
                        <option value="short_date">🟡 Short-Dated</option>
                        <option value="expired">🔴 Expired</option>
                        <option value="equipment">🩺 Equipment (Durable)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isEquipment ? 'text-slate-300' : 'text-slate-600'}`}>Expiration Date</label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" checked={noExpiry} disabled={isEquipment} onChange={(e) => setNoExpiry(e.target.checked)} className="w-4 h-4 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30 transition-all" />
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${isEquipment ? 'text-slate-300' : 'text-slate-500'}`}>N/A</span>
                        </label>
                    </div>
                    <div className="relative">
                      <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 size={20} ${noExpiry ? 'text-slate-200' : 'text-slate-400'}`} />
                      <input type="date" required={!noExpiry} disabled={noExpiry} value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} className={`w-full pl-12 pr-6 py-4 rounded-2xl border-2 outline-none font-black text-xs transition-all ${noExpiry ? 'bg-slate-100 text-slate-300 border-slate-100' : 'bg-slate-50 text-slate-700 border-slate-100 focus:border-blue-500'}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Administrative Notes</label>
                  <textarea rows={4} placeholder="Internal or client-facing notes..." value={formData.admin_notes} onChange={(e) => setFormData({...formData, admin_notes: e.target.value})} className="w-full p-6 rounded-[2rem] border-2 border-slate-100 outline-none focus:border-blue-500 text-sm font-medium resize-none bg-slate-50 focus:bg-white text-slate-800 transition-all"></textarea>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center border border-white/10 shadow-2xl mt-auto relative overflow-hidden group">
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Gross Value</span>
                  </div>
                  <span className="text-4xl font-black text-white tracking-tighter relative z-10">
                    {formData.unit_price ? formatCurrency(parseFloat(formData.unit_price) * formData.quantity_found) : '$0.00'}
                  </span>
                </div>

                <button type="submit" disabled={isSending} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                  {isSending ? (
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="animate-spin" size={18}/> Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                        <Send size={18}/> Send Proposal
                    </div>
                  )}
                </button>
             </form>
          )}
        </div>
      </div>
    </div>
  );
}