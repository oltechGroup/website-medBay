// frontend/src/app/dashboard/orders/OrderDetailsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  X, Package, MapPin, User, CreditCard, 
  CheckCircle2, XCircle, Truck, FileText, 
  ExternalLink, ShieldCheck, AlertTriangle,
  Clock, Phone, Globe, MessageCircle, Building2,
  Plus, Trash2, Send, DollarSign, Calendar, Loader2
} from "lucide-react";
import { useAdminOrders, AdminOrder, OrderItem, Supplier, ShippingOption } from "@/hooks/useAdminOrders";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api"; // ✅ Importamos api para el mensaje directo

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const { 
    getOrderDetails, updateStatus, 
    addShippingOption, submitValuation, 
    getStatusLabel, getStatusColor, 
    isUpdating, isAddingOption, isSubmittingValuation 
  } = useAdminOrders();
  
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [taxInput, setTaxInput] = useState<string>('');
  const [newOption, setNewOption] = useState({ name: '', days: '', cost: '' });
  
  const [loading, setLoading] = useState(true);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // ✅ NUEVO: Estados para el mensaje de Concierge
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Cargar datos
  const fetchOrder = () => {
    setLoading(true);
    getOrderDetails(orderId)
      .then((data) => {
        setOrder(data.order);
        setItems(data.items);
        setSuppliers(data.suppliers || []);
        setShippingOptions(data.shippingOptions || []);
        setTaxInput(data.order.tax || '0');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  // --- MANEJADORES B2B ---

  const handleAddOption = async () => {
    if (!newOption.name || !newOption.cost) return alert("Nombre y Costo son obligatorios");
    
    await addShippingOption({
      orderId,
      name: newOption.name,
      description: "Opción personalizada por agente",
      estimated_days: newOption.days,
      cost: parseFloat(newOption.cost)
    });
    
    setNewOption({ name: '', days: '', cost: '' });
    fetchOrder(); 
  };

  const handleSubmitValuation = async () => {
    if (shippingOptions.length === 0) return alert("Debes agregar al menos una opción de envío.");
    if (!taxInput) return alert("Debes definir el impuesto (o poner 0).");
    
    if(!confirm("¿Enviar propuesta al cliente? Se le notificará por correo.")) return;

    await submitValuation({
      orderId,
      tax_amount: parseFloat(taxInput)
    });
    onClose();
  };

  // --- MANEJADORES ANTERIORES ---

  const handleRejectOrder = async () => {
    if(!confirm("¿Rechazar esta orden?")) return;
    await updateStatus({ orderId, status: 'rejected' });
    onClose();
  };

  const handleApprovePayment = async () => {
    if(!confirm("¿El pago es válido?")) return;
    await updateStatus({ orderId, status: 'processing' });
    onClose();
  };

  const handleMarkShipped = async () => {
    const tracking = prompt("Ingresa el Número de Rastreo / Guía:");
    if (tracking === null) return; 

    await updateStatus({ 
      orderId, 
      status: 'shipped', 
      tracking_number: tracking 
    });
    onClose();
  };

  // ✅ NUEVO: Enviar Mensaje Manual
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      await api.post(`/orders/${orderId}/message`, { message: newMessage });
      alert("Mensaje enviado y notificado al cliente.");
      setNewMessage(""); // Limpiar caja
      // Opcional: Podríamos recargar para ver el historial, pero por ahora limpia
    } catch (error) {
      console.error(error);
      alert("Error al enviar el mensaje.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  // ✅ NUEVO: Marcar como Entregado
  const handleMarkDelivered = async () => {
    if(!confirm("¿Confirmas que el cliente recibió el paquete correctamente? Esto cerrará el ciclo de venta.")) return;
    
    await updateStatus({ orderId, status: 'delivered' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package size={24} />
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
              <p className="text-xs text-slate-500 font-medium flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><User size={12}/> {order?.customer_name}</span>
                {order?.customer_phone && (
                   <span className="flex items-center gap-1 text-slate-600">
                     <Phone size={12}/> {order.customer_phone}
                   </span>
                )}
                <span className="text-slate-300">|</span>
                <span>{formatDate(order?.placed_at)}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : order ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* IZQUIERDA: PRODUCTOS */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <Package size={18} className="text-blue-500"/> Productos
                    </span>
                    {suppliers.length > 0 && (
                      <button 
                        onClick={() => setShowSupplierModal(true)}
                        className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Building2 size={14}/> Ver Proveedores ({suppliers.length})
                      </button>
                    )}
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Producto</th>
                        <th className="px-6 py-3 text-center">Lote</th>
                        <th className="px-6 py-3 text-center">Cant.</th>
                        <th className="px-6 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{item.product_name}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.global_sku}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-bold text-slate-600 border border-slate-200">
                              {item.lot_number}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* VISOR DE EVIDENCIA */}
                {order.evidence_file && (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="text-purple-500" size={20}/> Evidencia de Pago
                    </h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center">
                      <a 
                        href={`https://api.medbaysupply.com${order.evidence_file}`} 
                        target="_blank"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-2"
                      >
                        <ExternalLink size={16}/> Ver Documento Adjunto
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* DERECHA: PANEL DE CONTROL */}
              <div className="space-y-6">
                
                {/* 1. PANEL DE ACCIÓN DINÁMICO */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-5 border-b border-slate-700 pb-2">
                    Panel de Control
                  </h4>

                  {/* CASO 1: PENDIENTE DE VALUACIÓN */}
                  {order.status === 'pending_valuation' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Impuestos (USD)</label>
                        <div className="relative">
                           <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                           <input 
                             type="number" 
                             value={taxInput}
                             onChange={(e) => setTaxInput(e.target.value)}
                             placeholder="0.00"
                             className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-bold text-sm focus:border-blue-500 outline-none"
                           />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex justify-between">
                          <span>Opciones de Envío</span>
                          <span className="text-blue-400">{shippingOptions.length} agregadas</span>
                        </label>
                        <div className="space-y-2 mb-3">
                          {shippingOptions.map(opt => (
                            <div key={opt.id} className="bg-slate-800 p-2 rounded-lg flex justify-between items-center text-xs">
                               <div>
                                 <span className="font-bold block text-white">{opt.name}</span>
                                 <span className="text-slate-400">{opt.estimated_days}</span>
                               </div>
                               <span className="font-mono text-emerald-400 font-bold">${opt.cost}</span>
                            </div>
                          ))}
                          {shippingOptions.length === 0 && (
                            <p className="text-xs text-slate-500 italic">No hay opciones de envío aún.</p>
                          )}
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2">
                           <input 
                             placeholder="Nombre (Ej: Aéreo)" 
                             value={newOption.name}
                             onChange={(e) => setNewOption({...newOption, name: e.target.value})}
                             className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white"
                           />
                           <div className="flex gap-2">
                             <input 
                               placeholder="Días (Ej: 2-3)" 
                               value={newOption.days}
                               onChange={(e) => setNewOption({...newOption, days: e.target.value})}
                               className="w-1/2 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white"
                             />
                             <input 
                               type="number"
                               placeholder="Costo $" 
                               value={newOption.cost}
                               onChange={(e) => setNewOption({...newOption, cost: e.target.value})}
                               className="w-1/2 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white"
                             />
                           </div>
                           <button 
                             onClick={handleAddOption}
                             disabled={isAddingOption}
                             className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                           >
                             <Plus size={12}/> Agregar Opción
                           </button>
                        </div>
                      </div>

                      <div className="h-px bg-slate-700 my-4"></div>

                      <button 
                        onClick={handleSubmitValuation}
                        disabled={isSubmittingValuation}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                      >
                         <Send size={16}/> Enviar Propuesta al Cliente
                      </button>
                      <button 
                        onClick={handleRejectOrder}
                        className="w-full py-3 bg-transparent text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        Cancelar y Rechazar
                      </button>
                    </div>
                  )}

                  {/* CASO 2: ESPERANDO APROBACIÓN CLIENTE */}
                  {order.status === 'waiting_customer_approval' && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <Clock size={24}/>
                      </div>
                      <p className="font-bold text-white">Esperando al Cliente</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Se enviaron {shippingOptions.length} opciones de envío. El cliente debe elegir una y confirmar.
                      </p>
                    </div>
                  )}

                  {/* CASO 3: ESPERANDO PAGO */}
                  {order.status === 'payment_pending' && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle size={24}/>
                      </div>
                      <p className="font-bold text-white">Pago Pendiente</p>
                      <p className="text-xs text-slate-400 mt-1">
                        El cliente aceptó la cotización. Esperando comprobante de pago.
                      </p>
                    </div>
                  )}

                  {/* CASO 4: REVISIÓN DE PAGO */}
                  {order.status === 'payment_review' && (
                     <div className="space-y-3">
                       <p className="text-sm text-slate-300">Evidencia recibida. Valídala antes de procesar.</p>
                       <button onClick={handleApprovePayment} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                         <ShieldCheck size={18}/> Validar Pago
                       </button>
                     </div>
                  )}

                  {/* CASO 5: EN PROCESO */}
                  {order.status === 'processing' && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300">Pago Validado. Orden lista para envío.</p>
                      <button onClick={handleMarkShipped} className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                        <Truck size={18}/> Marcar Enviado
                      </button>
                    </div>
                  )}

                  {/* ✅ CASO 6: ENVIADO - SEGUIMIENTO Y CIERRE */}
                  {order.status === 'shipped' && (
                    <div className="space-y-6">
                      
                      {/* Tracking Info Opcional */}
                      {order.tracking_number && (
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest">Tracking Number</p>
                           <p className="font-mono font-bold text-lg text-white mt-1 select-all">{order.tracking_number}</p>
                        </div>
                      )}

                      {/* Notificación Manual (Concierge) */}
                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <label className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                          <MessageCircle size={14}/> Mensaje al Cliente
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Ej: Hola! El repartidor ya está en tu colonia, estate pendiente."
                          className="w-full bg-slate-900 text-white text-sm p-3 rounded-lg border border-slate-600 focus:border-blue-500 outline-none resize-none mb-3 placeholder-slate-500"
                          onChange={(e) => setNewMessage(e.target.value)} 
                          value={newMessage}
                        ></textarea>
                        <button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSendingMsg}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSendingMsg ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} 
                          {isSendingMsg ? 'Enviando...' : 'Enviar Notificación'}
                        </button>
                      </div>

                      {/* Botón de Finalizar */}
                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-[10px] text-slate-400 mb-3 text-center leading-relaxed">
                          Presiona este botón solo cuando el cliente confirme que recibió su pedido correctamente.
                        </p>
                        <button 
                          onClick={handleMarkDelivered} 
                          disabled={isUpdating}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>} 
                          Finalizar Pedido (Entregado)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASO 7: FINALIZADO */}
                  {order.status === 'delivered' && (
                     <div className="text-center py-4">
                        <div className="bg-emerald-500/20 text-emerald-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                          <CheckCircle2 size={32}/>
                        </div>
                        <h3 className="font-bold text-lg text-white">Pedido Completado</h3>
                        <p className="text-slate-400 text-xs mt-1">Este ciclo de venta se ha cerrado exitosamente.</p>
                        
                        {order.tracking_number && (
                          <div className="mt-4 bg-slate-800 p-3 rounded-lg inline-block">
                            <p className="text-[10px] text-slate-500 uppercase">Tracking Usado</p>
                            <p className="font-mono text-white text-xs">{order.tracking_number}</p>
                          </div>
                        )}
                     </div>
                  )}

                  {/* CASOS CANCELADOS */}
                  {['cancelled', 'rejected'].includes(order.status) && (
                     <div className="text-center py-4 opacity-50">
                        <XCircle size={32} className="mx-auto mb-2 text-slate-500"/>
                        <p className="font-bold">Orden Cancelada</p>
                     </div>
                  )}

                </div>

                {/* 2. RESUMEN FINANCIERO */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-slate-400"/> Resumen Financiero
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(parseFloat(order.subtotal || '0'))}</span>
                    </div>
                    
                    {/* Tax Dinámico */}
                    <div className="flex justify-between text-slate-500">
                      <span>Impuestos</span>
                      {order.status === 'pending_valuation' ? (
                        <span className="text-blue-500 font-bold italic">Pendiente</span>
                      ) : (
                        <span>{formatCurrency(parseFloat(order.tax || '0'))}</span>
                      )}
                    </div>

                    {/* Envío Dinámico */}
                    <div className="flex justify-between text-slate-500">
                      <span>Envío {order.shipping_method ? `(${order.shipping_method})` : ''}</span>
                      {order.status === 'pending_valuation' || order.status === 'waiting_customer_approval' ? (
                        <span className="text-blue-500 font-bold italic">Por definir</span>
                      ) : (
                        <span>{formatCurrency(parseFloat(order.shipping_cost || '0'))}</span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-lg text-slate-900">
                      <span>Total</span>
                      {order.status === 'pending_valuation' ? (
                        <span className="text-slate-400 text-base">Calculando...</span>
                      ) : (
                        <span>{formatCurrency(order.total)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. DIRECCIÓN */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                     <MapPin size={18} className="text-slate-400"/> Dirección de Envío
                   </h4>
                   {order.shipping_address_json ? (
                      <div className="text-sm text-slate-600">
                        <p className="font-bold">{order.shipping_address_json.street}</p>
                        <p>{order.shipping_address_json.city}, {order.shipping_address_json.state}</p>
                        <p className="text-xs uppercase mt-1">{order.shipping_address_json.country} • CP {order.shipping_address_json.postal_code}</p>
                      </div>
                   ) : (
                     <p className="text-slate-400 text-xs italic">Sin dirección estructurada</p>
                   )}
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center text-red-500">Error cargando datos</div>
          )}
        </div>
      </div>

      {/* MINI MODAL PROVEEDORES */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setShowSupplierModal(false)}></div>
           <div className="bg-white rounded-2xl shadow-2xl p-6 relative w-full max-w-md animate-in zoom-in-95">
             <button onClick={() => setShowSupplierModal(false)} className="absolute top-4 right-4"><X size={20}/></button>
             <h3 className="font-bold text-lg mb-4">Proveedores del Pedido</h3>
             <div className="space-y-3">
               {suppliers.map(sup => (
                 <div key={sup.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <p className="font-bold">{sup.name}</p>
                   <p className="text-xs text-slate-500">{sup.country} • {sup.contact_info}</p>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}