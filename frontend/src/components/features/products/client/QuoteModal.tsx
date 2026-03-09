// frontend/src/components/features/products/client/QuoteModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Package, Tag, Calendar, Stethoscope } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getImageUrl, formatCurrency, formatDate } from "@/lib/formatters";

// ✅ NEW: Define the structure for smart context
export interface QuoteContext {
  lotId?: string;
  lotNumber?: string;
  referencePrice?: number;
  expiryDate?: string;
  stockAvailable?: number;
  status?: string; // Para saber si es equipment
}

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  initialContext?: QuoteContext; // ✅ Receive optional context
}

type QuoteType = "Current (Standard)" | "Short-Dated (Discounted)" | "Expired (Practice/Waste)" | "New / Durable";

export default function QuoteModal({ isOpen, onClose, product, initialContext }: QuoteModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [quantity, setQuantity] = useState<number>(1);
  const [type, setType] = useState<QuoteType>("Current (Standard)");
  const [notes, setNotes] = useState("");

  const isEquipment = initialContext?.status === 'equipment';

  // 🧠 SMART LOGIC: Pre-fill based on context
  useEffect(() => {
    if (isOpen) {
      if (initialContext) {
        // 1. Si es equipo médico, forzamos el tipo y no lo dejamos cambiar
        if (initialContext.status === 'equipment') {
          setType("New / Durable");
        } 
        // 2. If there is an expiration date, determine the TYPE automatically
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
        } else {
          setType("Current (Standard)");
        }
      } else {
        // Reset if opened clean
        setQuantity(1);
        setType("Current (Standard)");
        setNotes("");
      }
    }
  }, [isOpen, initialContext]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Build technical note for admin
      let contextNote = `[Preference: ${type}]`;
      
      if (initialContext) {
        contextNote += `\n--- SOURCE CONTEXT ---`;
        if (initialContext.lotNumber) contextNote += `\nSpecific Lot: ${initialContext.lotNumber}`;
        if (initialContext.referencePrice) contextNote += `\nPrice Seen: ${formatCurrency(initialContext.referencePrice)}`;
        if (initialContext.stockAvailable !== undefined) contextNote += `\nSystem Stock: ${initialContext.stockAvailable}`;
      }
      
      const finalNotes = `${contextNote}\n\nClient Note: ${notes}`;

      // ✅ AGREGAMOS EL productId AL CONTEXTO ANTES DE ENVIARLO
      const payloadContext = {
        ...initialContext,
        productId: product.id 
      };

      const payload = {
        product_name: product.description,
        sku: product.global_sku || 'N/A',
        quantity_asked: quantity,
        notes: finalNotes,
        // Send structured context in case backend evolves to store it in separate columns
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
      console.error(err);
      if (err.response?.status === 401) {
        setError("Please log in to request a quote.");
      } else {
        setError("There was an error sending the request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to render context badge
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

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

        {/* Body */}
        <div className="p-6">
          
          {/* STEP 1: CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              
              {/* Product Summary */}
              <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-lg p-1 border border-slate-200 flex-shrink-0">
                  <img 
                    src={getImageUrl(product.primary_image)} 
                    className="w-full h-full object-contain mix-blend-multiply" 
                    alt={product.description}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase">{product.manufacturer_name}</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{product.description}</p>
                  <p className="text-xs text-slate-500 font-mono">SKU: {product.global_sku}</p>
                </div>
              </div>

              {/* ✅ SMART ZONE: Lot Context */}
              {renderContextBadge()}

              {/* Form */}
              {/* Si NO es equipo, mostramos las opciones de caducidad */}
              {!isEquipment && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Product Type</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity Units</label>
                <input 
                  type="number" 
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Additional Comments (Optional)</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isEquipment ? "e.g.: Do you offer installation services?" : "e.g.: I need them to have at least 6 months validity..."}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm resize-none text-slate-900"
                />
              </div>

              {/* Warning if not logged in */}
              {!isAuthenticated && (
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg flex gap-2 items-center">
                  <AlertCircle size={14} />
                  <span>To track your quote, we recommend logging in or registering.</span>
                </div>
              )}

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: CONFIRMATION */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <AlertCircle size={32} />
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-slate-800">Confirm your request</h4>
                <p className="text-sm text-slate-500 mt-1">
                  We will send this request to the sales team to confirm availability.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 text-sm border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-bold text-slate-800 text-right w-1/2 truncate">{product.description}</span>
                </div>
                
                {/* Context Summary in Confirmation */}
                {initialContext && initialContext.referencePrice && (
                    <div className="flex justify-between text-blue-600 bg-blue-50/50 p-1 rounded">
                        <span className="text-blue-500 font-medium">Ref. Price:</span>
                        <span className="font-bold">{formatCurrency(initialContext.referencePrice)}</span>
                    </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-bold text-slate-800">{quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-bold text-blue-600">{type}</span>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : "Confirm Submission"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-2">Request Sent!</h4>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                We have received your quote request. You can check the status in your "My Quotes" dashboard.
              </p>
              <button 
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Got it, thanks
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}