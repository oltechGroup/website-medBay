//frontend/src/app/(shop)/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, getImageUrl } from "@/lib/formatters";
import { api } from "@/lib/api"; // ✅ Importamos la API para enviar la orden
import { 
  Check, ShieldCheck, MapPin, 
  Truck, CreditCard, ShoppingCart, Loader2 
} from "lucide-react";

// Componentes de los Pasos
import { AddressSelection } from "./steps/AddressSelection";
import { ShippingSelection } from "./steps/ShippingSelection";
import { PaymentSelection } from "./steps/PaymentSelection"; // ✅ Paso 3 Integrado

// --- TIPOS ---
export type CheckoutState = {
  addressId: string | null;
  shippingMethod: 'standard' | 'express' | null;
  paymentMethod: string | null;
  referralCode: string;
};

// --- PASOS DEL WIZARD ---
const STEPS = [
  { id: 1, title: "Envío", icon: MapPin },
  { id: 2, title: "Logística", icon: Truck },
  { id: 3, title: "Pago", icon: CreditCard },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, summary, isLoading } = useCart(); // Si tu hook tiene refetch, úsalo aquí
  
  // Estado del Wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado de la Orden
  const [orderData, setOrderData] = useState<CheckoutState>({
    addressId: null,
    shippingMethod: null,
    paymentMethod: null,
    referralCode: "",
  });

  // --- CÁLCULOS EN TIEMPO REAL ---
  const calculateTotals = () => {
    const subtotal = summary.subtotal;
    
    // 1. Costo Envío
    let shippingCost = 0;
    if (orderData.shippingMethod === 'express') shippingCost = 100;
    if (orderData.shippingMethod === 'standard') shippingCost = 50;

    // 2. Base para comisión
    const baseAmount = subtotal + shippingCost;
    
    // 3. Fee de Pago
    let paymentFee = 0;
    if (orderData.paymentMethod === 'paypal' || orderData.paymentMethod === 'card') {
      paymentFee = baseAmount * 0.04; // 4%
    } else if (orderData.paymentMethod === 'mx_transfer') {
      paymentFee = baseAmount * 0.16; // 16%
    }

    return {
      subtotal,
      shippingCost,
      paymentFee,
      total: baseAmount + paymentFee
    };
  };

  const totals = calculateTotals();

  // --- ENVÍO DE LA ORDEN AL BACKEND ---
  const handleConfirmOrder = async (notes: string) => {
    if (!orderData.addressId || !orderData.shippingMethod || !orderData.paymentMethod) {
      alert("Por favor completa todos los pasos.");
      return;
    }

    setIsProcessing(true);

    try {
      // Construimos el Payload para el endpoint POST /api/orders
      const payload = {
        items: cartItems.map(item => ({
          product_lot_id: item.product_lot_id,
          product_supplier_id: item.product_supplier_id, // Asegúrate que venga en cartItems
          quantity: item.cart_quantity,
          unit_price: parseFloat(item.unit_price),
          lot_status: item.lot_status // Para guardar referencia si era caducado
        })),
        shipping_address_id: orderData.addressId,
        shipping_method: orderData.shippingMethod,
        payment_method: orderData.paymentMethod,
        referral_code: orderData.referralCode,
        notes: notes
      };

      const response = await api.post('/orders', payload);

      if (response.data.success) {
        // Redirigir al Dashboard o Página de Éxito
        // Como el backend ya limpió el carrito, al redirigir se actualizará el estado
        router.push('/dashboard?orderSuccess=true');
      } else {
        throw new Error("La orden no se pudo procesar.");
      }

    } catch (error: any) {
      console.error("Error al crear orden:", error);
      alert(error.response?.data?.error || "Ocurrió un error al procesar tu orden.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirigir si no hay carrito (Protección)
  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [isLoading, cartItems, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* HEADER SIMPLE */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">Checkout Seguro</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">MedBay Transaction</p>
            </div>
          </div>
          
          {/* STEPPER VISUAL */}
          <div className="hidden md:flex items-center gap-4">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all
                    ${isActive ? 'bg-slate-900 text-white shadow-md' : isCompleted ? 'bg-green-50 text-green-700' : 'bg-white text-slate-400 border border-slate-100'}
                  `}>
                    {isCompleted ? <Check size={14} /> : <step.icon size={14} />}
                    {step.title}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="w-8 h-px bg-slate-200"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10 grid lg:grid-cols-12 gap-10">
        
        {/* === COLUMNA IZQUIERDA (PASOS) === */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
            
            {/* PASO 1: SELECCIÓN DE DIRECCIÓN */}
            {currentStep === 1 && (
              <AddressSelection 
                selectedAddressId={orderData.addressId}
                onSelect={(id) => setOrderData({ ...orderData, addressId: id })}
                onNext={() => setCurrentStep(2)}
              />
            )}
            
            {/* PASO 2: SELECCIÓN DE ENVÍO */}
            {currentStep === 2 && (
              <ShippingSelection 
                selectedMethod={orderData.shippingMethod}
                onSelect={(method) => setOrderData({ ...orderData, shippingMethod: method })}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {/* ✅ PASO 3: SELECCIÓN DE PAGO Y CONFIRMACIÓN */}
            {currentStep === 3 && (
              <PaymentSelection 
                selectedMethod={orderData.paymentMethod}
                referralCode={orderData.referralCode}
                onSelectMethod={(method) => setOrderData({ ...orderData, paymentMethod: method })}
                onChangeReferral={(code) => setOrderData({ ...orderData, referralCode: code })}
                onConfirmOrder={handleConfirmOrder}
                onBack={() => setCurrentStep(2)}
                isProcessing={isProcessing}
              />
            )}
          </div>

        </div>

        {/* === COLUMNA DERECHA (RESUMEN STICKY) === */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-28">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-600"/> Resumen de Orden
            </h2>

            {/* Lista compacta de items */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-4 mb-6 pr-2">
              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 p-1 flex-shrink-0">
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

            {/* Desglose de Costos */}
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(totals.subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-slate-500 items-center">
                <span>Envío {orderData.shippingMethod === 'express' ? '(Express)' : orderData.shippingMethod === 'standard' ? '(Estándar)' : ''}</span>
                {orderData.shippingMethod ? (
                  <span className="font-bold text-slate-800">{formatCurrency(totals.shippingCost)}</span>
                ) : (
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400">Por calcular</span>
                )}
              </div>

              {totals.paymentFee > 0 && (
                <div className="flex justify-between text-slate-500 items-center">
                  <span>Comisión Pago / Impuestos</span>
                  <span className="font-bold text-amber-600">+{formatCurrency(totals.paymentFee)}</span>
                </div>
              )}
            </div>

            {/* Total Final */}
            <div className="flex justify-between items-end pt-6 border-t border-dashed border-slate-200 mb-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total a Pagar</span>
              <span className="text-3xl font-black text-slate-900 leading-none">
                {formatCurrency(totals.total)}
              </span>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 mt-4">
              Al confirmar, aceptas nuestros términos de venta B2B y políticas de privacidad.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}