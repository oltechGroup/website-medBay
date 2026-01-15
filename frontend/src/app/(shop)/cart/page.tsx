"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/formatters";
import { 
  Trash2, Plus, Minus, ShoppingCart, ArrowRight, 
  Package, Calendar, AlertCircle, ShieldCheck, 
  Tag, X, AlertTriangle 
} from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { cartItems, summary, isLoading, updateQuantity, removeItem, clearCart } = useCart();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Estado para el modal de confirmación
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleUpdateQuantity = async (itemId: string, lotId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(itemId);
    try {
      await updateQuantity({ itemId, quantity: newQuantity, lotId });
    } finally {
      setUpdatingId(null);
    }
  };

  // Función para ejecutar el vaciado y cerrar el modal
  const confirmClearCart = () => {
    clearCart();
    setIsClearModalOpen(false);
  };

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             <div className="h-16 w-16 bg-slate-200 rounded-full animate-ping opacity-75"></div>
             <div className="absolute inset-0 h-16 w-16 bg-slate-300 rounded-full animate-pulse"></div>
          </div>
          <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden flex flex-col">
      {/* ======= MAIN CONTENT ======= */}
      {/* Ajuste: pt-32 para compensar el Header Fijo */}
      <main className="flex-grow w-[90%] max-w-[1400px] mx-auto pt-32 pb-12 relative">
        
        {cartItems.length === 0 ? (
          /* --- EMPTY STATE PREMIUM --- */
          <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 mb-6 md:mb-8 border border-slate-100">
              <ShoppingCart size={40} className="text-slate-300 ml-2 md:w-12 md:h-12" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 md:mb-4 tracking-tight">Tu carrito está vacío</h1>
            <p className="text-slate-500 mb-8 md:mb-10 max-w-md text-base md:text-lg leading-relaxed font-medium px-4">
              Parece que aún no has agregado insumos médicos a tu orden. Explora nuestro catálogo para encontrar lotes vigentes.
            </p>
            <Link 
              href="/products" 
              className="group bg-slate-900 text-white px-8 py-3 md:px-10 md:py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3 text-sm md:text-base"
            >
              Explorar Catálogo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform md:w-5 md:h-5" />
            </Link>
          </div>
        ) : (
          /* --- CONTENIDO CARRITO --- */
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
               <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Orden de Compra</h1>
               <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider w-fit">
                 {summary.totalItems} Ítems agregados
               </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 md:gap-10 items-start">
              
              {/* --- LISTA DE PRODUCTOS (Left) --- */}
              <div className="flex-1 w-full space-y-4 md:space-y-6">
                {cartItems.map((item) => (
                  <div 
                    key={item.cart_item_id} 
                    // Ajuste: Padding reducido en móvil (p-4)
                    className="group bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-white shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                      
                      {/* Imagen con estilo médico */}
                      {/* Ajuste: Altura fija en móvil (h-40) para uniformidad */}
                      <div className="w-full h-40 sm:w-32 sm:h-32 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 flex-shrink-0 p-4 flex items-center justify-center group-hover:bg-white transition-colors">
                        <img 
                          src={getImageUrl(item.product_image)} 
                          alt={item.product_name} 
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => e.currentTarget.src = getImageUrl(null)}
                        />
                      </div>

                      {/* Detalles */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="pr-2">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                              {item.manufacturer_name}
                            </p>
                            <h3 className="font-bold text-slate-800 text-lg md:text-xl leading-tight hover:text-blue-700 transition-colors line-clamp-2">
                              {item.product_name}
                            </h3>
                          </div>
                          <button 
                            onClick={() => removeItem(item.cart_item_id)}
                            className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                            title="Eliminar"
                          >
                            <Trash2 size={18} className="md:w-5 md:h-5" />
                          </button>
                        </div>

                        {/* Info Lote - Plaquita Técnica */}
                        {/* Ajuste: Wrap y gap reducido en móvil */}
                        <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 mb-4 md:mb-5 w-full sm:w-auto">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <Package size={14} className="text-blue-500" />
                            Lote: <span className="font-mono font-bold text-slate-900">{item.lot_number}</span>
                          </div>
                          <div className="w-px h-3 bg-slate-300 hidden sm:block"></div>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <Calendar size={14} className="text-blue-500" />
                            Caducidad: <span className="font-bold text-slate-900">{formatDate(item.expiry_date)}</span>
                          </div>
                        </div>

                        {/* Controles y Precio */}
                        <div className="flex flex-wrap items-end justify-between gap-4">
                          
                          {/* Selector de Cantidad Premium */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button 
                              onClick={() => handleUpdateQuantity(item.cart_item_id, item.product_lot_id, item.cart_quantity - 1)}
                              disabled={item.cart_quantity <= 1 || updatingId === item.cart_item_id}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-50 hover:shadow transition-all"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-slate-800 w-8 md:w-10 text-center text-sm">
                              {updatingId === item.cart_item_id ? <span className="animate-pulse">...</span> : item.cart_quantity}
                            </span>
                            <button 
                              onClick={() => handleUpdateQuantity(item.cart_item_id, item.product_lot_id, item.cart_quantity + 1)}
                              disabled={item.cart_quantity >= item.available_stock || updatingId === item.cart_item_id}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-50 hover:shadow transition-all"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="text-right">
                             <div className="flex items-center justify-end gap-1.5 mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                <Tag size={12} className="text-slate-400" />
                                <span className="text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-wide">Unitario:</span>
                                <span className="text-xs font-bold text-slate-700">{formatCurrency(parseFloat(item.unit_price))}</span>
                             </div>
                             
                             <div className="flex items-baseline justify-end gap-2">
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide hidden xs:block">Subtotal</p>
                               <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">
                                 {formatCurrency(parseFloat(item.unit_price) * item.cart_quantity)}
                               </p>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end pt-2 md:pt-4">
                  {/* BOTÓN DE VACIAR CARRITO */}
                  <button 
                    onClick={() => setIsClearModalOpen(true)}
                    className="text-red-500 text-xs font-black uppercase tracking-widest hover:text-red-700 flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} /> Vaciar Todo
                  </button>
                </div>
              </div>

              {/* --- RESUMEN DE ORDEN (Right Sticky) --- */}
              <div className="w-full lg:w-[400px] flex-shrink-0">
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-28">
                  <h2 className="text-lg md:text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    Resumen <span className="text-slate-300 font-light">|</span> Financiero
                  </h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm font-medium text-slate-500">
                      <span>Subtotal ({summary.totalItems} ítems)</span>
                      <span className="font-bold text-slate-800">{formatCurrency(summary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-slate-500">
                      <span>Logística y Envío</span>
                      <span className="text-emerald-600 font-bold text-[10px] md:text-xs bg-emerald-50 px-2 py-0.5 rounded">CALCULAR AL PAGO</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-slate-500">
                      <span>Impuestos (IVA)</span>
                      <span className="text-slate-300 italic">--</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end py-6 border-t border-dashed border-slate-200 mb-6">
                    <span className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">Total Estimado</span>
                    <span className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{formatCurrency(summary.subtotal)}</span>
                  </div>

                  <div className="space-y-4">
                      {/* ✅ LINK AL CHECKOUT */}
                      <Link 
                        href="/checkout" 
                        className="group w-full bg-slate-900 text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3"
                      >
                        Proceder al Pago 
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform text-white/50 group-hover:text-white"/>
                      </Link>
                      
                      <Link href="/products" className="w-full block text-center py-2 md:py-3 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                        Continuar Comprando
                      </Link>
                  </div>

                  <div className="mt-6 md:mt-8 bg-blue-50/50 p-4 rounded-xl md:rounded-2xl border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-[10px] md:text-[11px] text-blue-700 leading-relaxed font-medium">
                      <strong>Nota B2B:</strong> Los costos finales de envío y la facturación fiscal se procesarán en el siguiente paso de checkout seguro.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {/* MODAL DE CONFIRMACIÓN */}
        {isClearModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
              onClick={() => setIsClearModalOpen(false)}
            ></div>

            <div className="relative bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <AlertTriangle className="text-red-500" size={28} />
              </div>
              
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 md:mb-3">¿Vaciar Carrito?</h3>
              <p className="text-slate-500 font-medium mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
                Esta acción eliminará todos los productos seleccionados de tu orden actual. No podrás deshacer esta acción.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsClearModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmClearCart}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Vaciar
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}