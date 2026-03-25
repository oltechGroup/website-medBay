// frontend/src/components/features/products/client/QuoteModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Package, Tag, Calendar, Stethoscope, ChevronDown } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getImageUrl, formatCurrency, formatDate } from "@/lib/formatters";

export interface QuoteContext {
  lotId?: string;
  lotNumber?: string;
  referencePrice?: number;
  expiryDate?: string;
  stockAvailable?: number;
  status?: string;
}

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  initialContext?: QuoteContext;
}

type QuoteType = "Current (Standard)" | "Short-Dated (Discounted)" | "Expired (Practice/Waste)" | "New / Durable";
// 🚀 NUEVO TIPO PARA UNIDAD
type UOMType = "Piece(s)" | "Box(es)";

export default function QuoteModal({ isOpen, onClose, product, initialContext }: QuoteModalProps) {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [quantity, setQuantity] = useState<number>(1);
  const [type, setType] = useState<QuoteType>("Current (Standard)");
  const [uom, setUom] = useState<UOMType>("Piece(s)"); // 🚀 NUEVO ESTADO
  const [notes, setNotes] = useState("");

  const isEquipment = initialContext?.status === 'equipment' || type === "New / Durable";

  // 🧠 SMART LOGIC: Pre-fill
  useEffect(() => {
    if (isOpen) {
      if (initialContext) {
        if (initialContext.status === 'equipment') {
          setType("New / Durable");
          setUom("Piece(s)"); // Equipo siempre es pieza
        } 
        else if (initialContext.expiryDate) {
          const expiry = new Date(initialContext.expiryDate);
          const now = new Date();
          const monthsDiff = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());

          if (expiry < now) {
            setType("Expired (Practice/Waste)");
          } else if (monthsDiff <= 6) {
            setType("Short-Dated (Discounted)");
          } else {
            setType("Current (Standard)");
          }
        }
      } else {
        setQuantity(1);
        setType("Current (Standard)");
        setUom("Piece(s)");
        setNotes("");
      }
    }
  }, [isOpen, initialContext]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 🚀 INCLUIMOS LA UNIDAD EN LA NOTA TÉCNICA
      let contextNote = `[Preference: ${type}] [Unit: ${uom}]`;
      
      if (initialContext) {
        contextNote += `\n--- SOURCE CONTEXT ---`;
        if (initialContext.lotNumber) contextNote += `\nSpecific Lot: ${initialContext.lotNumber}`;
        if (initialContext.referencePrice) contextNote += `\nPrice Seen: ${formatCurrency(initialContext.referencePrice)}`;
      }
      
      const finalNotes = `${contextNote}\n\nClient Note: ${notes}`;

      const payloadContext = {
        ...initialContext,
        productId: product.id,
        requested_uom: uom // Enviamos la unidad estructurada también
      };

      const payload = {
        product_name: product.description,
        sku: product.global_sku || 'N/A',
        quantity_asked: quantity,
        notes: finalNotes,
        quote_context: payloadContext, 
        guest_info: !isAuthenticated ? {
            name: "Web Guest",
            email: "guest@pending.com", 
            phone: ""
        } : undefined
      };

      await api.post('/quotes', payload);
      setStep(3);
    } catch (err: any) {
      setError("There was an error sending the request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderContextBadge = () => {
    if (!initialContext) return null;
    return (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    {isEquipment ? <Stethoscope size={12}/> : <CheckCircle2 size={12}/>} 
                    {isEquipment ? 'Quoting Equipment' : 'Quoting Specific Lot'}
                </span>
                {initialContext.lotNumber && (
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-blue-100">
                        {initialContext.lotNumber}
                    </span>
                )}
            </div>
            
            <div className="flex gap-3 text-xs text-slate-700 font-medium">
                {initialContext.referencePrice && (
                    <span className="flex items-center gap-1">
                        <Tag size={12} className="text-blue-500"/> 
                        Ref: {formatCurrency(initialContext.referencePrice)}
                    </span>
                )}
                {initialContext.expiryDate && !isEquipment && (
                    <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-blue-500"/> 
                        Expires: {formatDate(initialContext.expiryDate)}
                    </span>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800">
            <FileText className="text-blue-600" size={20} />
            <h3 className="font-bold">
                {initialContext ? (isEquipment ? "Equipment Quote" : "Lot Quote") : "Request Quote"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              
              {/* Product Summary */}
              <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-lg p-1 border border-slate-200 flex-shrink-0">
                  <img src={getImageUrl(product.primary_image)} className="w-full h-full object-contain mix-blend-multiply" alt={product.description} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase">{product.manufacturer_name}</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{product.description}</p>
                  <p className="text-xs text-slate-500 font-mono">SKU: {product.global_sku}</p>
                </div>
              </div>

              {renderContextBadge()}

              {/* Required Product Type */}
              {!isEquipment && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Product Status</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as QuoteType)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                  >
                    <option value="Current (Standard)">Current (Standard)</option>
                    <option value="Short-Dated (Discounted)">Short-Dated (Discounted)</option>
                    <option value="Expired (Practice/Waste)">Expired (Practice/Waste)</option>
                  </select>
                </div>
              )}

              {/* 🚀 QUANTITY & UOM ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presentation</label>
                  {isEquipment ? (
                    <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2">
                       <Package size={14}/> Piece(s)
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        value={uom}
                        onChange={(e) => setUom(e.target.value as UOMType)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-blue-600 appearance-none"
                      >
                        <option value="Piece(s)">Piece(s)</option>
                        <option value="Box(es)">Box(es)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Additional Comments (Optional)</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isEquipment ? "e.g.: Do you offer international warranty?" : "e.g.: I need specific lot certificates..."}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm resize-none text-slate-900"
                />
              </div>

              {!isAuthenticated && (
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg flex gap-2 items-center">
                  <AlertCircle size={14} />
                  <span>Log in to track this quote in your dashboard.</span>
                </div>
              )}

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Review Request <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <AlertCircle size={32} />
              </div>
              
              <h4 className="text-xl font-bold text-slate-800">Confirm Quote Request</h4>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 text-sm border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-bold text-slate-800 text-right w-1/2 truncate">{product.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order:</span>
                  <span className="font-bold text-slate-800">{quantity} {uom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preference:</span>
                  <span className="font-bold text-blue-600">{type}</span>
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 className="animate-spin" size={20}/> : "Send Request"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-2">Request Sent!</h4>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Our sales team will contact you within 24-48 business hours with a formal proposal.</p>
              <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Return to Catalog</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}