//frontend/src/app/dashboard/orders/OrderDetailsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  X, Package, MapPin, User, CreditCard, 
  CheckCircle2, XCircle, Truck, FileText, 
  Download, ExternalLink, ShieldCheck, AlertTriangle,
  Clock // ✅ AÑADIDO AQUÍ
} from "lucide-react";
import { useAdminOrders, AdminOrder, OrderItem } from "@/hooks/useAdminOrders";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/formatters";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const { getOrderDetails, updateStatus, getStatusLabel, getStatusColor, isUpdating } = useAdminOrders();
  
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      getOrderDetails(orderId)
        .then((data) => {
          setOrder(data.order);
          setItems(data.items);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  // --- MANEJADORES DE ACCIÓN --- //

  // 1. Aprobar Orden (Confirmar que hay stock) -> Cliente puede pagar
  const handleApproveStock = async () => {
    if(!confirm("¿Confirmas que hay stock disponible con el proveedor? El cliente recibirá notificación para pagar.")) return;
    await updateStatus({ orderId, status: 'payment_pending' });
    onClose();
  };

  // 2. Rechazar Orden (Sin stock)
  const handleRejectOrder = async () => {
    if(!confirm("¿Rechazar esta orden? Se notificará al cliente y se cancelará la solicitud.")) return;
    await updateStatus({ orderId, status: 'rejected' });
    onClose();
  };

  // 3. Validar Pago (Verificaste la evidencia) -> Pasa a Proceso
  const handleApprovePayment = async () => {
    await updateStatus({ orderId, status: 'processing' });
    onClose();
  };

  // 4. Marcar Enviado (Ya tienes guía)
  const handleMarkShipped = async () => {
    await updateStatus({ orderId, status: 'shipped' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Package size={24} className="text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-800">Orden #{orderId?.slice(0,8)}</h2>
                {order && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1"><User size={12}/> {order?.customer_name}</span>
                <span className="text-slate-300">|</span>
                <span>{formatDate(order?.placed_at)}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* BODY CON SCROLL */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : order ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* COLUMNA IZQUIERDA (2/3): ÍTEMS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Tabla de Productos */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-700">
                    Productos Solicitados
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">Producto</th>
                        <th className="px-6 py-3 text-center">Lote</th>
                        <th className="px-6 py-3 text-center">Cant.</th>
                        <th className="px-6 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{item.product_name}</p>
                            <p className="text-xs text-slate-500 font-mono">{item.global_sku}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-bold text-slate-600">
                              {item.lot_number}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Cad: {formatDate(item.expiry_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">
                            {formatCurrency(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* VISOR DE EVIDENCIA (Solo si existe) */}
                {order.evidence_file && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="text-blue-500" size={20}/> Evidencia de Pago
                    </h4>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center">
                      {order.evidence_file.endsWith('.pdf') ? (
                        <iframe 
                          src={`http://localhost:3001${order.evidence_file}`} 
                          className="w-full h-96 rounded-lg"
                        ></iframe>
                      ) : (
                        <img 
                          src={`http://localhost:3001${order.evidence_file}`} 
                          alt="Comprobante" 
                          className="max-h-96 object-contain rounded-lg shadow-sm"
                        />
                      )}
                      <a 
                        href={`http://localhost:3001${order.evidence_file}`} 
                        target="_blank" 
                        className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                      >
                        <ExternalLink size={14}/> Abrir en nueva pestaña
                      </a>
                    </div>
                  </div>
                )}

              </div>

              {/* COLUMNA DERECHA (1/3): INFO Y ACCIONES */}
              <div className="space-y-6">
                
                {/* Caja de Acciones (Dinámica según estado) */}
                <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">Acciones Administrativas</h4>
                  
                  {/* CASO 1: PENDIENTE DE REVISIÓN */}
                  {order.status === 'pending_review' && (
                    <div className="space-y-3">
                      <p className="text-sm mb-4">El cliente espera confirmación de stock.</p>
                      <button 
                        onClick={handleApproveStock}
                        disabled={isUpdating}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle2 size={18}/> Aprobar & Solicitar Pago
                      </button>
                      <button 
                        onClick={handleRejectOrder}
                        disabled={isUpdating}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-red-300 hover:text-red-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <XCircle size={18}/> Rechazar (Sin Stock)
                      </button>
                    </div>
                  )}

                  {/* CASO 2: ESPERANDO PAGO */}
                  {order.status === 'payment_pending' && (
                    <div className="text-center py-4">
                      <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock size={24} className="text-blue-300"/>
                      </div>
                      <p className="font-bold">Esperando al Cliente</p>
                      <p className="text-xs text-slate-400 mt-1">Debe subir su comprobante o pagar en línea.</p>
                    </div>
                  )}

                  {/* CASO 3: REVISIÓN DE PAGO (Evidencia subida) */}
                  {order.status === 'payment_review' && (
                    <div className="space-y-3">
                      <p className="text-sm mb-2 text-yellow-200 font-bold flex items-center gap-2">
                        <AlertTriangle size={16}/> Verifica la evidencia
                      </p>
                      <button 
                        onClick={handleApprovePayment}
                        disabled={isUpdating}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShieldCheck size={18}/> Validar Pago
                      </button>
                      <button 
                        onClick={() => alert("Función de rechazo de pago pendiente de implementar (requiere enviar mail)")}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <XCircle size={18}/> Pago Inválido
                      </button>
                    </div>
                  )}

                  {/* CASO 4: EN PROCESO */}
                  {order.status === 'processing' && (
                    <div className="space-y-3">
                      <p className="text-sm mb-2">Pago validado. Preparando envío.</p>
                      <button 
                        onClick={handleMarkShipped}
                        disabled={isUpdating}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Truck size={18}/> Marcar como Enviado
                      </button>
                    </div>
                  )}

                  {/* ESTADOS FINALES */}
                  {['shipped', 'delivered', 'cancelled', 'rejected'].includes(order.status) && (
                    <div className="text-center py-2 opacity-50">
                      <p className="text-sm">Orden finalizada o en tránsito.</p>
                      <p className="text-xs font-bold mt-1 uppercase">{getStatusLabel(order.status)}</p>
                    </div>
                  )}
                </div>

                {/* Info Financiera */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-slate-400"/> Detalles Financieros
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Método</span>
                      <span className="font-bold text-slate-800 uppercase">{order.payment_method?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(items.reduce((acc, i) => acc + parseFloat(i.line_total), 0))}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Envío ({order.shipping_method})</span>
                      <span>+{formatCurrency(0)} {/* Nota: backend debe enviar shipping_cost si quieres mostrarlo aquí */}</span> 
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-lg text-slate-900">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Dirección de Envío */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-slate-400"/> Dirección de Entrega
                  </h4>
                  {/* NOTA: Aquí asumo que el backend `findById` devolvió los campos shipping_street, etc. 
                      Si no, habría que ajustar el endpoint o mostrar "Ver en perfil del usuario" */}
                  <div className="text-sm text-slate-600 leading-relaxed">
                    <p className="font-bold">{order.customer_name}</p>
                    {/* Estos datos dependen de que modifiques tu AdminOrder interface para incluirlos, 
                        o uses el objeto order directamente si trae la info aplanada */}
                    <p className="mt-1 text-slate-400 italic">
                      (Para ver la dirección completa, asegúrate de que el endpoint /orders/:id devuelva los joins de address)
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center text-red-500">Error al cargar orden</div>
          )}
        </div>
      </div>
    </div>
  );
}