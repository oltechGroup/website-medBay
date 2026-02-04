// frontend/src/components/features/products/client/QuoteModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Package, Tag, Calendar } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getImageUrl, formatCurrency, formatDate } from "@/lib/formatters";

// ✅ NUEVO: Definimos la estructura del contexto inteligente
export interface QuoteContext {
  lotId?: string;
  lotNumber?: string;
  referencePrice?: number;
  expiryDate?: string;
  stockAvailable?: number;
}

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  initialContext?: QuoteContext; // ✅ Recibimos el contexto opcional
}

type QuoteType = "En Fecha (Estándar)" | "Fecha Corta (Descuento)" | "Caducado (Prácticas/Merma)";

export default function QuoteModal({ isOpen, onClose, product, initialContext }: QuoteModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado del Formulario
  const [quantity, setQuantity] = useState<number>(1);
  const [type, setType] = useState<QuoteType>("En Fecha (Estándar)");
  const [notes, setNotes] = useState("");

  // 🧠 LÓGICA INTELIGENTE: Pre-llenado basado en contexto
  useEffect(() => {
    if (isOpen && initialContext) {
      // 1. Si hay stock disponible en ese lote, sugerimos esa cantidad (máximo 10 para no asustar, o 1)
      // Opcional: setQuantity(1); 

      // 2. Si hay fecha de caducidad, determinamos el TIPO automáticamente
      if (initialContext.expiryDate) {
        const expiry = new Date(initialContext.expiryDate);
        const now = new Date();
        const monthsDiff = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());

        if (expiry < now) {
          setType("Caducado (Prácticas/Merma)");
        } else if (monthsDiff <= 6) {
          setType("Fecha Corta (Descuento)");
        } else {
          setType("En Fecha (Estándar)");
        }
      }
    } else if (isOpen) {
        // Reset si se abre limpio
        setQuantity(1);
        setType("En Fecha (Estándar)");
        setNotes("");
    }
  }, [isOpen, initialContext]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Construimos una nota técnica para el admin
      let contextNote = `[Preferencia: ${type}]`;
      
      if (initialContext) {
        contextNote += `\n--- CONTEXTO DE ORIGEN ---`;
        if (initialContext.lotNumber) contextNote += `\nLote Específico: ${initialContext.lotNumber}`;
        if (initialContext.referencePrice) contextNote += `\nPrecio Visto: ${formatCurrency(initialContext.referencePrice)}`;
        if (initialContext.stockAvailable !== undefined) contextNote += `\nStock en sistema: ${initialContext.stockAvailable}`;
      }
      
      const finalNotes = `${contextNote}\n\nNota del Cliente: ${notes}`;

      const payload = {
        product_name: product.description,
        sku: product.global_sku || 'S/N',
        quantity_asked: quantity,
        notes: finalNotes,
        // Enviamos el contexto estructurado por si el backend evoluciona para guardarlo en columnas separadas
        quote_context: initialContext, 
        guest_info: !isAuthenticated ? {
            name: "Invitado Web",
            email: "invitado@pendiente.com", 
            phone: ""
        } : undefined
      };

      await api.post('/quotes', payload);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("Por favor inicia sesión para cotizar.");
      } else {
        setError("Hubo un error al enviar la solicitud. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper para renderizar el badge de contexto
  const renderContextBadge = () => {
    if (!initialContext) return null;
    return (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={12}/> Cotizando Lote Específico
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
                {initialContext.expiryDate && (
                    <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-blue-500"/> 
                        Vence: {formatDate(initialContext.expiryDate)}
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
                {initialContext ? "Cotización de Lote" : "Solicitar Cotización"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          
          {/* PASO 1: CONFIGURACIÓN */}
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              
              {/* Resumen Producto */}
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

              {/* ✅ ZONA INTELIGENTE: Contexto del Lote */}
              {renderContextBadge()}

              {/* Formulario */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Producto Requerido</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as QuoteType)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                >
                  <option value="En Fecha (Estándar)">En Fecha (Estándar)</option>
                  <option value="Fecha Corta (Descuento)">Fecha Corta (Descuento)</option>
                  <option value="Caducado (Prácticas/Merma)">Caducado (Prácticas/Merma)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad Unidades</label>
                <input 
                  type="number" 
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Comentarios Adicionales (Opcional)</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Necesito que tengan al menos 6 meses de vigencia..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm resize-none text-slate-900"
                />
              </div>

              {/* Advertencia si no está logueado */}
              {!isAuthenticated && (
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg flex gap-2 items-center">
                  <AlertCircle size={14} />
                  <span>Para dar seguimiento a tu cotización, te recomendamos iniciar sesión o registrarte.</span>
                </div>
              )}

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Continuar <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* PASO 2: CONFIRMACIÓN */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <AlertCircle size={32} />
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-slate-800">Confirma tu solicitud</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Enviaremos esta petición al equipo de ventas para confirmar disponibilidad.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 text-sm border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Producto:</span>
                  <span className="font-bold text-slate-800 text-right w-1/2 truncate">{product.description}</span>
                </div>
                
                {/* Resumen de Contexto en Confirmación */}
                {initialContext && initialContext.referencePrice && (
                    <div className="flex justify-between text-blue-600 bg-blue-50/50 p-1 rounded">
                        <span className="text-blue-500 font-medium">Ref. Precio:</span>
                        <span className="font-bold">{formatCurrency(initialContext.referencePrice)}</span>
                    </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500">Cantidad:</span>
                  <span className="font-bold text-slate-800">{quantity} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo:</span>
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
                  Atrás
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : "Confirmar Envío"}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: ÉXITO */}
          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-2">¡Solicitud Enviada!</h4>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                Hemos recibido tu cotización. Podrás ver el estado en tu panel de "Mis Cotizaciones".
              </p>
              <button 
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Entendido, gracias
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}