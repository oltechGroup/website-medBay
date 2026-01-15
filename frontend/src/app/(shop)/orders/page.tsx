// frontend/src/app/(shop)/orders/page.tsx
"use client";

import { useState } from "react";
import { useMyOrders, Order } from "@/hooks/useMyOrders"; 
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  Package, UploadCloud, FileText, CheckCircle2, 
  Clock, AlertCircle, Loader2, ChevronRight, Truck
} from "lucide-react";

// ✅ Importamos el Modal
import CustomerOrderModal from "./components/CustomerOrderModal"; 

export default function MyOrdersPage() {
  const { orders, isLoading, uploadEvidence, getStatusInfo, isUploading } = useMyOrders();
  
  // Estado para el Modal de Detalles
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Estado para subida rápida (desde la tarjeta)
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo no debe superar los 5MB"); 
      return;
    }

    setUploadingId(orderId);
    try {
      await uploadEvidence({ orderId, file });
    } catch (error) {
      console.error(error);
      alert("Error al subir el archivo.");
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-12 flex justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="h-12 w-12 bg-slate-200 rounded-full animate-ping opacity-75"></div>
           <p className="text-slate-400 text-sm font-medium animate-pulse">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Ajuste: pt-32 para compensar el Header Fijo */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-32 pb-20">
        
        {/* Header de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Mis Pedidos</h1>
            <p className="text-slate-500 font-medium text-base md:text-lg">Historial de compras y seguimiento de envíos.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 w-fit">
              <Package className="text-blue-600" size={20} />
              <span className="font-bold text-slate-700 text-sm">Total: {orders.length}</span>
          </div>
        </div>

        {orders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-10 md:p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <Package size={40} className="text-slate-300 md:w-12 md:h-12" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2">No tienes pedidos aún</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm md:text-base">
              Tu historial de compras aparecerá aquí. Explora nuestro catálogo para realizar tu primera orden B2B.
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const showUpload = order.status === 'payment_pending';
              const isUploadingThis = uploadingId === order.id;

              return (
                <div 
                  key={order.id} 
                  className="group bg-white rounded-2xl md:rounded-[2rem] p-1 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                >
                  <div className="p-5 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center justify-between">
                    
                    {/* Info Principal */}
                    <div className="flex-1 space-y-3 md:space-y-4 w-full">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span className="font-mono text-[10px] md:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1 md:gap-1.5 ${statusInfo.color}`}>
                          {statusInfo.actionRequired ? <AlertCircle size={10} className="md:w-3 md:h-3" /> : <CheckCircle2 size={10} className="md:w-3 md:h-3" />}
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1 ml-auto md:ml-0">
                           <Clock size={10} className="md:w-3 md:h-3" /> {formatDate(order.placed_at)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Monto Total</p>
                           <p className="text-xl md:text-2xl font-black text-slate-900">{formatCurrency(order.total)}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Método de Pago</p>
                           <p className="text-xs md:text-sm font-bold text-slate-700 capitalize flex items-center gap-2">
                             {order.payment_method?.replace('_', ' ')}
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Acciones & Estado */}
                    <div className="w-full md:w-auto flex flex-col items-end gap-3 min-w-[200px]">
                      
                      {/* --- CASO 1: PENDIENTE DE PAGO (SUBIR EVIDENCIA RÁPIDA) --- */}
                      {showUpload && (
                        <div className="w-full">
                           <div className="text-center md:text-right">
                             {isUploadingThis ? (
                               <div className="flex items-center justify-center md:justify-end gap-2 text-blue-600 font-bold text-xs py-3">
                                 <Loader2 className="animate-spin" size={16}/> Subiendo...
                               </div>
                             ) : (
                               <label className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                                 <UploadCloud size={18} />
                                 Subir Comprobante
                                 <input 
                                   type="file" 
                                   className="hidden" 
                                   accept="image/*,application/pdf"
                                   onChange={(e) => handleFileChange(e, order.id)}
                                 />
                               </label>
                             )}
                             <p className="text-[10px] text-blue-600 mt-2 font-bold bg-blue-50 px-2 py-1 rounded inline-block">
                               ¡Stock reservado por 24h!
                             </p>
                           </div>
                        </div>
                      )}

                      {/* --- CASO 2: EN REVISIÓN --- */}
                      {order.status === 'payment_review' && (
                        <div className="bg-purple-50 px-4 py-3 rounded-xl border border-purple-100 w-full text-center md:text-right">
                           <div className="flex items-center justify-center md:justify-end gap-2 text-purple-700 font-bold text-xs md:text-sm mb-1">
                             <FileText size={16} /> Validación en Proceso
                           </div>
                           <p className="text-[10px] text-purple-600 font-medium">Finanzas está revisando tu pago.</p>
                        </div>
                      )}

                      {/* --- CASO 3: ENVIADO (TRACKING) --- */}
                      {(order.status === 'shipped') && (
                        <div className="bg-cyan-50 px-4 py-3 rounded-xl border border-cyan-100 w-full text-center md:text-right">
                           <div className="flex items-center justify-center md:justify-end gap-2 text-cyan-700 font-bold text-xs md:text-sm">
                             <Truck size={18}/> Pedido Enviado
                           </div>
                           <p className="text-[10px] text-cyan-600 font-medium mt-1">Ver detalles para rastreo.</p>
                        </div>
                      )}

                    </div>
                  </div>
                  
                  {/* Footer de la tarjeta (Detalle rápido) */}
                  <div className="bg-slate-50/50 px-5 py-3 md:px-8 md:py-3 border-t border-slate-100 flex justify-between items-center rounded-b-2xl md:rounded-b-[2rem]">
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Detalles del pedido</span>
                      
                      {/* ✅ BOTÓN ACTIVO PARA ABRIR MODAL */}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-800 text-[10px] md:text-xs font-black uppercase tracking-wide flex items-center gap-1 transition-colors"
                      >
                        Ver Productos <ChevronRight size={12} />
                      </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ✅ MODAL DE DETALLE INTEGRADO */}
        {selectedOrder && (
          <CustomerOrderModal 
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            order={selectedOrder}
            onUploadEvidence={handleFileChange}
            isUploading={isUploading}
          />
        )}

      </div>
    </div>
  );
}