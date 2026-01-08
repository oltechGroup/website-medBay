//frontend/src/app/(shop)/orders/page.tsx
"use client";

import { useState } from "react";
import { useMyOrders } from "@/hooks/useMyOrders";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  Package, UploadCloud, FileText, CheckCircle2, 
  Clock, AlertCircle, Loader2 
} from "lucide-react";

export default function MyOrdersPage() {
  const { orders, isLoading, uploadEvidence, isUploading, getStatusInfo } = useMyOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null); // Para mostrar el input de archivo

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo no debe superar los 5MB");
      return;
    }

    try {
      await uploadEvidence({ orderId, file });
      alert("Comprobante subido exitosamente. Lo revisaremos pronto.");
      setSelectedOrderId(null);
    } catch (error) {
      console.error(error);
      alert("Error al subir el archivo.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Mis Pedidos</h1>
          <p className="text-slate-500 mt-2">Historial de compras y estado de envíos.</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Package size={64} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">No tienes pedidos aún</h3>
            <p className="text-slate-500">Explora nuestro catálogo para realizar tu primera compra.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const showUpload = order.status === 'payment_pending';

              return (
                <div key={order.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{order.id.slice(0, 8)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.color}`}>
                        {statusInfo.actionRequired && <AlertCircle size={12} />}
                        {statusInfo.label}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        {formatDate(order.placed_at)}
                      </div>
                      <div className="font-bold text-slate-900">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-slate-500 capitalize">
                        {order.payment_method?.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="w-full md:w-auto flex flex-col items-end gap-3">
                    
                    {/* BOTÓN DE SUBIR EVIDENCIA */}
                    {showUpload && (
                      <div className="w-full md:w-auto">
                        {selectedOrderId === order.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                             <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, order.id)}
                              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                             />
                             <button onClick={() => setSelectedOrderId(null)} className="p-1 hover:bg-slate-100 rounded-full"><div className="w-4 h-4 text-slate-400">X</div></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedOrderId(order.id)}
                            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                          >
                            <UploadCloud size={16} />
                            Subir Comprobante
                          </button>
                        )}
                        <p className="text-[10px] text-blue-600 mt-2 text-center md:text-right font-medium">
                          ¡Stock reservado! Sube tu pago para procesar.
                        </p>
                      </div>
                    )}

                    {/* STATUS DE PAGO EN REVISIÓN */}
                    {order.status === 'payment_review' && (
                      <div className="text-right">
                         <div className="flex items-center justify-end gap-2 text-purple-700 font-bold text-sm mb-1">
                           <FileText size={16} /> Comprobante Enviado
                         </div>
                         <p className="text-[10px] text-slate-400">Validando tu transferencia...</p>
                      </div>
                    )}

                    {/* COMPLETADO */}
                    {(order.status === 'processing' || order.status === 'shipped') && (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl">
                        <CheckCircle2 size={16} />
                        Pago Aprobado
                      </div>
                    )}

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