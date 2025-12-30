//frontend/src/app/(shop)/cart/page.tsx

"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/formatters";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { cartItems, summary, isLoading, updateQuantity, removeItem, clearCart } = useCart();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateQuantity = async (itemId: string, lotId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(itemId);
    try {
      await updateQuantity({ itemId, quantity: newQuantity, lotId });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <ShoppingCart size={40} className="text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Tu carrito está vacío</h1>
        <p className="text-slate-500 mb-8 max-w-md text-center">
          Parece que aún no has agregado insumos médicos a tu orden. Explora nuestro catálogo para encontrar lotes vigentes.
        </p>
        <Link 
          href="/products" 
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
        >
          Explorar Catálogo <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="w-[95%] max-w-[1200px] mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <ShoppingCart className="text-blue-600" /> Carrito de Compras
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LISTA DE PRODUCTOS (Left) --- */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => (
              <div 
                key={item.cart_item_id} 
                className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 transition-all hover:border-blue-300"
              >
                {/* Imagen */}
                <div className="w-full sm:w-24 h-24 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0 p-2">
                  <img 
                    src={getImageUrl(item.product_image)} 
                    alt={item.product_name} 
                    className="w-full h-full object-contain mix-blend-multiply"
                    onError={(e) => e.currentTarget.src = getImageUrl(null)}
                  />
                </div>

                {/* Detalles */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">
                        {item.product_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                        {item.manufacturer_name}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.cart_item_id)}
                      className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar del carrito"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Info del Lote (Vital para B2B) */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Package size={14} className="text-blue-500" />
                      Lote: <span className="font-mono font-bold text-slate-800">{item.lot_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="text-blue-500" />
                      Caducidad: <span className="font-medium text-slate-800">{formatDate(item.expiry_date)}</span>
                    </div>
                  </div>

                  {/* Controles y Precio */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                      <button 
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.product_lot_id, item.cart_quantity - 1)}
                        disabled={item.cart_quantity <= 1 || updatingId === item.cart_item_id}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 disabled:opacity-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-slate-800 w-8 text-center">
                        {updatingId === item.cart_item_id ? "..." : item.cart_quantity}
                      </span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.product_lot_id, item.cart_quantity + 1)}
                        disabled={item.cart_quantity >= item.available_stock || updatingId === item.cart_item_id}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                       <p className="text-xs text-slate-400 mb-0.5">Precio Unitario: {formatCurrency(parseFloat(item.unit_price))}</p>
                       <p className="text-xl font-black text-blue-700">
                         {formatCurrency(parseFloat(item.unit_price) * item.cart_quantity)}
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => { if(confirm('¿Estás seguro de vaciar el carrito?')) clearCart() }}
              className="text-red-500 text-sm font-bold hover:underline flex items-center gap-2 mt-4"
            >
              <Trash2 size={14} /> Vaciar Carrito
            </button>
          </div>

          {/* --- RESUMEN DE ORDEN (Right Sticky) --- */}
          <div className="lg:w-96">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Resumen de Orden</h2>
              
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({summary.totalItems} ítems)</span>
                  <span className="font-bold text-slate-800">{formatCurrency(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Envío estimado</span>
                  <span className="text-green-600 font-medium">Por calcular</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Impuestos estimados</span>
                  <span className="text-slate-400 italic">--</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mb-8">
                <span className="text-lg font-bold text-slate-800">Total Estimado</span>
                <span className="text-2xl font-black text-slate-900">{formatCurrency(summary.subtotal)}</span>
              </div>

              <div className="space-y-3">
                 <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2">
                   Proceder al Pago <ArrowRight size={20} />
                 </button>
                 <Link href="/products" className="w-full block text-center py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                   Continuar Comprando
                 </Link>
              </div>

              <div className="mt-6 bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Nota B2B:</strong> Los costos finales de envío y facturación se calcularán en el siguiente paso según su dirección fiscal.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}