//frontend/src/app/(shop)/orders/page.tsx
"use client";

import { useState } from "react";
import { useMyOrders } from "@/hooks/useMyOrders";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  Package, UploadCloud, FileText, CheckCircle2, 
  Clock, AlertCircle, Loader2, X, ChevronRight, Truck
} from "lucide-react";

export default function MyOrdersPage() {
  const { orders, isLoading, uploadEvidence, getStatusInfo } = useMyOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo no debe superar los 5MB"); // Idealmente usar un toast
      return;
    }

    setUploadingId(orderId);
    try {
      await uploadEvidence({ orderId, file });
      // El hook useMyOrders debería refrescar la lista, si no, aquí podrías forzar un refresh
      setSelectedOrderId(null);
    } catch (error) {
      console.error(error);
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
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Mis Pedidos</h1>
            <p className="text-slate-500 font-medium text-lg">Historial de compras y seguimiento de envíos.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
             <Package className="text-blue-600" size={20} />
             <span className="font-bold text-slate-700 text-sm">Total: {orders.length}</span>
          </div>
        </div>

        {orders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <Package size={48} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No tienes pedidos aún</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Tu historial de compras aparecerá aquí. Explora nuestro catálogo para realizar tu primera orden B2B.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const showUpload = order.status === 'payment_pending';
              const isUploadingThis = uploadingId === order.id;

              return (
                <div 
                  key={order.id} 
                  className="group bg-white rounded-[2rem] p-1 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                    
                    {/* Info Principal */}
                    <div className="flex-1 space-y-4 w-full">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 ${statusInfo.color}`}>
                          {statusInfo.actionRequired ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto md:ml-0">
                           <Clock size={12} /> {formatDate(order.placed_at)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Monto Total</p>
                           <p className="text-2xl font-black text-slate-900">{formatCurrency(order.total)}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Método de Pago</p>
                           <p className="text-sm font-bold text-slate-700 capitalize flex items-center gap-2">
                             {order.payment_method?.replace('_', ' ')}
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Acciones & Estado */}
                    <div className="w-full md:w-auto flex flex-col items-end gap-3 min-w-[200px]">
                      
                      {/* --- CASO 1: PENDIENTE DE PAGO (SUBIR EVIDENCIA) --- */}
                      {showUpload && (
                        <div className="w-full">
                          {selectedOrderId === order.id ? (
                            <div className="bg-slate-50 p-4 rounded-xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200 relative">
                               <button 
                                 onClick={() => setSelectedOrderId(null)} 
                                 className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition-all shadow-sm"
                               >
                                 <X size={14} />
                               </button>
                               
                               {isUploadingThis ? (
                                 <div className="flex flex-col items-center justify-center py-2 text-blue-600">
                                   <Loader2 size={24} className="animate-spin mb-2" />
                                   <span className="text-xs font-bold">Subiendo...</span>
                                 </div>
                               ) : (
                                 <>
                                   <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                          <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                                          <p className="text-xs text-blue-600 font-bold">Clic para subir (PDF/IMG)</p>
                                      </div>
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*,application/pdf"
                                        onChange={(e) => handleFileChange(e, order.id)}
                                      />
                                  </label>
                                  <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Máx. 5MB</p>
                                 </>
                               )}
                            </div>
                          ) : (
                            <div className="text-center md:text-right">
                              <button 
                                onClick={() => setSelectedOrderId(order.id)}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                              >
                                <UploadCloud size={18} />
                                Subir Comprobante
                              </button>
                              <p className="text-[10px] text-blue-600 mt-2 font-bold bg-blue-50 px-2 py-1 rounded inline-block">
                                ¡Stock reservado por 24h!
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- CASO 2: EN REVISIÓN --- */}
                      {order.status === 'payment_review' && (
                        <div className="bg-purple-50 px-5 py-3 rounded-xl border border-purple-100 w-full text-center md:text-right">
                           <div className="flex items-center justify-center md:justify-end gap-2 text-purple-700 font-bold text-sm mb-1">
                             <FileText size={16} /> Validación en Proceso
                           </div>
                           <p className="text-[10px] text-purple-600 font-medium">Tu comprobante está siendo revisado por finanzas.</p>
                        </div>
                      )}

                      {/* --- CASO 3: APROBADO / ENVIADO --- */}
                      {(order.status === 'processing' || order.status === 'shipped') && (
                        <div className="bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100 w-full text-center md:text-right">
                           <div className="flex items-center justify-center md:justify-end gap-2 text-emerald-700 font-bold text-sm">
                             {order.status === 'shipped' ? <Truck size={18}/> : <CheckCircle2 size={18} />}
                             {order.status === 'shipped' ? 'Enviado' : 'Pago Aprobado'}
                           </div>
                           {order.status === 'processing' && (
                             <p className="text-[10px] text-emerald-600 font-medium mt-1">Preparando envío...</p>
                           )}
                        </div>
                      )}

                    </div>
                  </div>
                  
                  {/* Footer de la tarjeta (Detalle rápido) */}
                  <div className="bg-slate-50/50 px-8 py-3 border-t border-slate-100 flex justify-between items-center rounded-b-[2rem]">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalles del pedido</span>
                     <button className="text-blue-600 hover:text-blue-800 text-xs font-black uppercase tracking-wide flex items-center gap-1 transition-colors">
                        Ver Productos <ChevronRight size={12} />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}