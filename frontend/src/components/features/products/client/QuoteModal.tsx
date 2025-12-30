//frontend/src/components/features/products/client/QuoteModal.tsx

"use client";

import { useState } from "react";
import { X, FileText, CheckCircle2, AlertCircle, Calendar, Package, ArrowRight, Loader2 } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/formatters";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

type QuoteType = "En Fecha (Estándar)" | "Fecha Corta (Descuento)" | "Caducado (Prácticas/Merma)";

export default function QuoteModal({ isOpen, onClose, product }: QuoteModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado del Formulario
  const [quantity, setQuantity] = useState<number>(1);
  const [type, setType] = useState<QuoteType>("En Fecha (Estándar)");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Reutilizamos tu endpoint de contacto existente
      await api.post('/contact', {
        nombre: user?.full_name || "Usuario Registrado",
        email: user?.email,
        asunto: `Cotización: ${product.description.substring(0, 30)}...`,
        mensaje: notes || "Solicitud generada desde el catálogo.",
        tipo: 'Solicitud de Cotización', // Esto define cómo se ve en el Dashboard
        
        // Datos Extra para el Admin (se guardan en el JSONB)
        product_id: product.id,
        product_sku: product.global_sku,
        product_name: product.description,
        requested_quantity: quantity,
        requested_type: type,
        manufacturer: product.manufacturer_name
      });

      setStep(3); // Ir a éxito
    } catch (err) {
      console.error(err);
      setError("Hubo un error al enviar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
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
            <h3 className="font-bold">Solicitar Cotización</h3>
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
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase">{product.manufacturer_name}</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{product.description}</p>
                  <p className="text-xs text-slate-500 font-mono">SKU: {product.global_sku}</p>
                </div>
              </div>

              {/* Formulario */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Producto Requerido</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as QuoteType)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
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
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Comentarios Adicionales (Opcional)</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Necesito que tengan al menos 6 meses de vigencia..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                />
              </div>

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
                  Enviaremos esta petición al equipo de ventas para buscar stock con nuestros proveedores.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 text-sm border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Producto:</span>
                  <span className="font-bold text-slate-800 text-right w-1/2 truncate">{product.description}</span>
                </div>
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
                Hemos recibido tu cotización. Te responderemos en un plazo máximo de <strong>48 horas hábiles</strong>.
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