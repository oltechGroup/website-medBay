// frontend/src/app/(shop)/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, getImageUrl } from "@/lib/formatters";
import { api } from "@/lib/api"; 
import { 
  ShieldCheck, MapPin, ShoppingCart, 
  Loader2, Send, FileText, User
} from "lucide-react";

// Solo necesitamos el componente de Dirección
import { AddressSelection } from "./steps/AddressSelection";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, summary, isLoading } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado simplificado (Solo necesitamos esto para iniciar la negociación)
  const [addressId, setAddressId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [notes, setNotes] = useState("");

  // Redirigir si no hay carrito
  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [isLoading, cartItems, router]);

  // --- ENVÍO DE SOLICITUD DE COTIZACIÓN ---
  const handleRequestQuote = async () => {
    if (!addressId) {
      alert("Por favor selecciona una dirección de entrega.");
      return;
    }

    setIsProcessing(true);

    try {
      // Payload simplificado para B2B
      // NO enviamos envío ni pago, solo items y dirección
      const payload = {
        items: cartItems.map(item => ({
          product_lot_id: item.product_lot_id,
          product_supplier_id: item.product_supplier_id,
          quantity: item.cart_quantity,
          unit_price: parseFloat(item.unit_price),
          lot_status: item.lot_status 
        })),
        shipping_address_id: addressId,
        referral_code: referralCode,
        notes: notes
      };

      const response = await api.post('/orders', payload);

      if (response.data.success) {
        // Redirigimos a "Mis Pedidos" con un flag de éxito
        router.push('/orders?newOrder=true'); 
      } else {
        throw new Error("No se pudo generar la solicitud.");
      }

    } catch (error: any) {
      console.error("Error al crear solicitud:", error);
      alert(error.response?.data?.error || "Error al procesar la solicitud.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
           <Loader2 className="animate-spin text-blue-600" size={40} />
           <p className="text-slate-400 font-medium text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pt-[72px]">
      
      {/* HEADER SIMPLE */}
      <header className="bg-white border-b border-slate-200 sticky top-[72px] z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">Solicitud de Pedido</h1>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Paso 1: Confirmación de Items y Dirección</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        
        {/* === COLUMNA IZQUIERDA (DIRECCIÓN Y DATOS) === */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. SELECCIÓN DE DIRECCIÓN */}
          <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">
             <AddressSelection 
               selectedAddressId={addressId}
               onSelect={(id) => setAddressId(id)}
               onNext={() => {}} // No necesitamos next aquí
             />
          </div>

          {/* 2. DATOS ADICIONALES (Vendedor / Notas) */}
          <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
             <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
               <FileText className="text-blue-600" size={20}/>
               <h3 className="font-bold text-slate-800">Detalles Adicionales</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Código Vendedor */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2">
                    <User size={14}/> Código de Vendedor (Opcional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: SALES-01"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm font-bold uppercase tracking-wide"
                  />
                </div>

                {/* Nota Informativa */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 leading-relaxed">
                   <strong>Nota Importante:</strong> Al enviar esta solicitud, nuestro equipo calculará los impuestos y te ofrecerá las mejores opciones de envío disponibles para tu ubicación. Recibirás una notificación para aprobar el total final.
                </div>
             </div>

             {/* Notas Texto */}
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Notas para el equipo de logística</label>
                <textarea 
                  placeholder="Instrucciones especiales, horarios de entrega, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 h-24 resize-none text-sm transition-colors"
                ></textarea>
             </div>
          </div>

        </div>

        {/* === COLUMNA DERECHA (RESUMEN) === */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 lg:sticky lg:top-[160px]">
            <h2 className="text-base md:text-lg font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-600"/> Resumen de Solicitud
            </h2>

            {/* Lista compacta de items */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-4 mb-6 pr-2">
              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="flex gap-3 items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-lg border border-slate-100 p-1 flex-shrink-0">
                    <img 
                      src={getImageUrl(item.product_image)} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                      alt={item.product_name}
                      onError={(e) => e.currentTarget.src = getImageUrl(null)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.product_name}</p>
                    <p className="text-[10px] text-slate-500">Cant: {item.cart_quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    {formatCurrency(parseFloat(item.unit_price) * item.cart_quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-slate-100 mb-6"></div>

            {/* Desglose de Costos (Parcial) */}
            <div className="space-y-3 mb-6 text-xs md:text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Productos</span>
                <span className="font-bold text-slate-800">{formatCurrency(summary.subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-slate-400 italic">
                <span>Envío e Impuestos</span>
                <span>Se calculan después</span>
              </div>
            </div>

            {/* Total Parcial */}
            <div className="flex justify-between items-end pt-6 border-t border-dashed border-slate-200 mb-6">
              <span className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">Estimado Actual</span>
              <span className="text-2xl md:text-3xl font-black text-slate-900 leading-none">
                {formatCurrency(summary.subtotal)}
              </span>
            </div>
            
            {/* Botón de Acción */}
            <button 
              onClick={handleRequestQuote}
              disabled={isProcessing}
              className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Procesando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Solicitar Cotización
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-slate-400 mt-4">
              Al solicitar, aceptas iniciar el proceso de negociación B2B. No se realizará ningún cobro en este paso.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}