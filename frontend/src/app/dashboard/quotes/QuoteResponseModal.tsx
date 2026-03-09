// frontend/src/app/dashboard/quotes/QuoteResponseModal.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  X, Package, User, Calendar, DollarSign, 
  FileText, CheckCircle2, AlertTriangle, Send, Tag, Info,
  Phone, Building2, Truck, Trash2, Clock, Ban, Stethoscope
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

  // Form State
  const [formData, setFormData] = useState({
    quantity_found: 0,
    unit_price: "",
    expiry_date: "",
    lot_type: "in_date", // 'in_date' | 'short_date' | 'expired' | 'equipment'
    admin_notes: ""
  });

  const [noExpiry, setNoExpiry] = useState(false);

  // Load initial data when modal opens
  useEffect(() => {
    if (quote) {
      const requestNotes = quote.product_request.notes || "";
      const isEquipmentRequested = requestNotes.includes("New / Durable") || requestNotes.includes("Equipment");
      
      // Intentar adivinar la preferencia del cliente para pre-llenar
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
      
      // ✅ LOGICA INTELIGENTE: Si es equipo, no lleva caducidad
      setNoExpiry(isEquipmentRequested);
    }
  }, [quote, isOpen]);

  // Si el admin cambia el dropdown a equipment manualmente, también marcamos noExpiry
  useEffect(() => {
    if (formData.lot_type === 'equipment') {
       setNoExpiry(true);
       setFormData(prev => ({ ...prev, expiry_date: "" }));
    }
  }, [formData.lot_type]);

  if (!isOpen || !quote) return null;

  // --- NOTE CLEANING FUNCTION ---
  const extractUserNote = (fullNote?: string) => {
    if (!fullNote) return null;
    const separator = "Client Note:"; // Matching exact frontend generated structure
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
  const context = (quote.product_request as any).quote_context;
  const isEquipment = formData.lot_type === 'equipment' || fullContextNotes.includes("New / Durable");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.unit_price) {
      alert("Please enter the unit price.");
      return;
    }
    if (!noExpiry && !formData.expiry_date) {
      alert("Please enter the expiration date or check 'Not applicable'.");
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
      alert(error.response?.data?.error || "There was an error sending the proposal.");
    }
  };

  // Function to delete quote
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this quote? This action cannot be undone.")) {
        try {
            await deleteQuote(quote.id);
            onClose();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Could not delete the quote.");
        }
    }
  };

  // Helper to show client info
  const clientName = quote.user_name || quote.guest_info?.name || "Guest Customer";
  const clientEmail = quote.user_email || quote.guest_info?.email || "No email";
  const clientPhone = (quote as any).user_phone || quote.guest_info?.phone || "No phone registered";
  
  // --- STATE LOGIC (LOCK) ---
  const isAccepted = quote.status === 'accepted';
  const isProposalSent = quote.status === 'proposal_sent';
  const isRejected = quote.status === 'rejected';

  // If accepted or sent, show read-only/status view
  const showReadOnlyState = isAccepted || isProposalSent;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 h-[90vh] md:h-auto max-h-[95vh]">
        
        {/* === LEFT COLUMN: REQUEST SUMMARY === */}
        <div className="w-full md:w-2/5 bg-slate-50 p-6 md:p-8 border-r border-slate-100 flex flex-col overflow-y-auto custom-scrollbar">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText size={16}/> Original Request
          </h3>

          <div className="flex-1 space-y-6">
            {/* Product */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Requested Product</p>
              <p className="text-lg font-black text-slate-800 leading-tight">
                {quote.product_request.product_name}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-1 bg-white inline-block px-2 py-1 rounded border border-slate-200">
                SKU: {quote.product_request.sku}
              </p>
            </div>

            {/* Smart Context */}
            {(context || fullContextNotes.includes("Preference:")) && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-blue-700">
                        <Info size={16}/>
                        <span className="text-xs font-black uppercase tracking-wide">Request Origin</span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                        {/* Preference from the client Modal */}
                        {fullContextNotes.includes("Preference:") && (
                           <div className="text-xs font-bold text-blue-800 bg-white p-2 rounded border border-blue-100">
                              Target: {fullContextNotes.split('\n')[0].replace('[', '').replace(']', '')}
                           </div>
                        )}

                        {context?.lotNumber && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <Package size={12}/> <span className="text-[10px] font-bold uppercase">Viewed Lot</span>
                                </div>
                                <span className="font-mono font-bold text-slate-800 text-sm">{context.lotNumber}</span>
                            </div>
                        )}

                        {context?.supplierName && (
                             <div className="bg-white p-2 rounded border border-blue-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <Truck size={12}/> <span className="text-[10px] font-bold uppercase">Supplier</span>
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{context.supplierName}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            {context?.referencePrice && (
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500">Ref Price:</span>
                                    <span className="font-bold text-slate-700">{formatCurrency(context.referencePrice)}</span>
                                </div>
                            )}
                            {context?.stockAvailable !== undefined && (
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] text-slate-500">System Stock:</span>
                                    <span className="font-bold text-slate-700">{context.stockAvailable} pcs</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Package size={24} className="text-blue-500"/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Requested Quantity</p>
                <p className="text-2xl font-black text-slate-800">{quote.product_request.quantity_asked}</p>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-slate-400"/>
                <span className="font-bold text-slate-700 text-sm">{clientName}</span>
              </div>
              <div className="space-y-1">
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="opacity-70">@</span> {clientEmail}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Phone size={12} className="opacity-70"/> {clientPhone}
                  </p>
              </div>
            </div>

            {/* Customer Notes */}
            {userRealNote && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                  <AlertTriangle size={12}/> Customer Note:
                </p>
                <p className="text-sm text-amber-900 italic whitespace-pre-wrap">"{userRealNote}"</p>
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN: PROPOSAL FORM === */}
        <div className="w-full md:w-3/5 p-6 md:p-8 bg-white flex flex-col overflow-y-auto custom-scrollbar relative">
          
          {/* RIGHT HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800">Generate Proposal</h2>
            <div className="flex items-center gap-2">
                {/* Delete Button (Only visible if not accepted) */}
                {!isAccepted && (
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                        title="Delete Quote"
                    >
                        <Trash2 size={20}/>
                    </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <X size={24} />
                </button>
            </div>
          </div>

          {/* REJECTION MESSAGE (If applicable) */}
          {isRejected && (
             <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-red-100 text-red-600 rounded-full">
                    <Ban size={20}/>
                </div>
                <div>
                    <p className="text-sm font-bold text-red-700">Proposal Rejected</p>
                    <p className="text-xs text-red-600">The customer rejected your previous offer. You can send a new proposal.</p>
                </div>
             </div>
          )}

          {/* MAIN CONTENT: FORM OR STATUS MESSAGE */}
          {showReadOnlyState ? (
             // --- STATUS VIEW (LOCKED) ---
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
                {isAccepted ? (
                    <>
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <CheckCircle2 size={40}/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Quote Accepted!</h3>
                        <p className="text-slate-500 max-w-xs mb-8">The customer has confirmed the purchase. An order was generated successfully.</p>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-200 w-full max-w-xs text-left shadow-sm">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-2">Agreed Details</p>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm text-slate-600">Price:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(quote.admin_proposal?.unit_price || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Quantity:</span>
                                <span className="font-bold text-slate-900">{quote.admin_proposal?.quantity_found}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm animate-pulse">
                            <Clock size={40}/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Waiting for Response</h3>
                        <p className="text-slate-500 max-w-xs mb-8">You have already sent a proposal. You must wait for the customer to review it.</p>
                        
                        <div className="w-full max-w-xs bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-bold text-slate-700">Proposal Sent</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Sent on: {formatDate(quote.admin_proposal?.proposal_date)}
                            </p>
                        </div>
                    </>
                )}
             </div>
          ) : (
             // --- FORM VIEW (ACTIVE) ---
             <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
            
                <div className="grid grid-cols-2 gap-5">
                  {/* Found Quantity */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Found Quantity</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number"
                        min="1"
                        required
                        value={formData.quantity_found}
                        onChange={(e) => setFormData({...formData, quantity_found: parseInt(e.target.value) || 0})}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-800 transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Unit Price (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-800 transition-all bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Lot Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Lot Condition</label>
                    <select 
                      value={formData.lot_type}
                      onChange={(e) => setFormData({...formData, lot_type: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium text-slate-700 bg-white cursor-pointer"
                    >
                      <option value="in_date">🟢 Valid (In Date)</option>
                      <option value="short_date">🟡 Short Expiration</option>
                      <option value="expired">🔴 Expired (Educational)</option>
                      <option value="equipment">🩺 New / Durable (Equipment)</option>
                    </select>
                  </div>

                  {/* Expiration Date */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className={`text-xs font-bold uppercase ${isEquipment ? 'text-slate-400' : 'text-slate-600'}`}>Expiration</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={noExpiry}
                                disabled={isEquipment} // Bloquear checkbox si es equipo
                                onChange={(e) => setNoExpiry(e.target.checked)}
                                className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className={`text-[10px] font-medium ${isEquipment ? 'text-slate-400' : 'text-slate-500'}`}>
                                Not applicable
                            </span>
                        </label>
                    </div>
                    
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 size={18} ${noExpiry ? 'text-slate-300' : 'text-slate-400'}`} />
                      <input 
                        type="date"
                        required={!noExpiry}
                        disabled={noExpiry}
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none font-medium transition-all
                            ${noExpiry 
                                ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed' 
                                : 'bg-white text-slate-700 border-slate-200 focus:border-blue-500'}
                        `}
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Additional Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g.: The packaging has a slight aesthetic detail..."
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                    className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm resize-none bg-white text-slate-800 placeholder-slate-400"
                  ></textarea>
                </div>

                {/* Estimated Total */}
                <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100 mt-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase">Proposal Total</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formData.unit_price 
                      ? formatCurrency(parseFloat(formData.unit_price) * formData.quantity_found) 
                      : '$0.00'}
                  </span>
                </div>

                {/* Action Button */}
                <button 
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    "Sending..."
                  ) : (
                    <>Send Proposal <Send size={18}/></>
                  )}
                </button>

             </form>
          )}
        </div>

      </div>
    </div>
  );
}