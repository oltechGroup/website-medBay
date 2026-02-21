// frontend/src/app/dashboard/orders/OrderDetailsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  X, Package, MapPin, User, CreditCard, 
  CheckCircle2, XCircle, Truck, FileText, 
  ExternalLink, ShieldCheck, AlertTriangle,
  Clock, Phone, MessageCircle, Building2,
  Plus, Send, DollarSign, Loader2, AlertCircle
} from "lucide-react";
import { useAdminOrders, AdminOrder, OrderItem, Supplier, ShippingOption } from "@/hooks/useAdminOrders";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api"; 

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
  const [hasEditedTax, setHasEditedTax] = useState(false); // ✅ Control para no sobreescribir el input
  
  const [newOption, setNewOption] = useState({ name: '', days: '', cost: '' });
  
  const [loading, setLoading] = useState(true);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Estados para Mensajes
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // ✅ ESTADOS PARA MODALES PERSONALIZADOS
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    actionColor: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', actionLabel: '', actionColor: '', onConfirm: () => {} });

  const [trackingModal, setTrackingModal] = useState<{isOpen: boolean, value: string}>({ isOpen: false, value: '' });

  // Cargar datos
  const fetchOrder = () => {
    getOrderDetails(orderId)
      .then((data) => {
        setOrder(data.order);
        setItems(data.items);
        setSuppliers(data.suppliers || []);
        setShippingOptions(data.shippingOptions || []);
        
        // ✅ Solo actualiza el impuesto de la BD si el usuario no ha empezado a escribir
        if (!hasEditedTax) {
           setTaxInput(data.order.tax || '0');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      fetchOrder();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  // --- MANEJADORES B2B ---

  const handleAddOption = async () => {
    if (!newOption.name || !newOption.cost) return alert("Nombre y Costo son obligatorios");
    
    // ✅ Formateamos a 2 decimales limpios antes de enviar
    const cleanCost = parseFloat(newOption.cost).toFixed(2);

    await addShippingOption({
      orderId,
      name: newOption.name,
      description: "Opción estándar",
      estimated_days: newOption.days,
      cost: parseFloat(cleanCost)
    });
    
    setNewOption({ name: '', days: '', cost: '' });
    fetchOrder(); 
  };

  const handleSubmitValuation = () => {
    if (shippingOptions.length === 0) return alert("Debes agregar al menos una opción de envío.");
    if (!taxInput) return alert("Debes definir el impuesto (o poner 0).");
    
    setConfirmModal({
      isOpen: true,
      title: "Enviar Propuesta",
      message: "¿Confirmas que los impuestos y envíos son correctos? Se enviará un correo al cliente para que realice el pago.",
      actionLabel: "Enviar Propuesta",
      actionColor: "bg-blue-600 hover:bg-blue-700",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await submitValuation({ orderId, tax_amount: parseFloat(taxInput) });
        onClose();
      }
    });
  };

  // --- MANEJADORES ANTERIORES CON MODALES PROPIOS ---

  const handleRejectOrder = () => {
    setConfirmModal({
      isOpen: true,
      title: "Rechazar Orden",
      message: "Esta acción cancelará la solicitud del cliente. ¿Estás seguro?",
      actionLabel: "Sí, Rechazar",
      actionColor: "bg-red-600 hover:bg-red-700",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await updateStatus({ orderId, status: 'rejected' });
        onClose();
      }
    });
  };

  const handleApprovePayment = () => {
    setConfirmModal({
      isOpen: true,
      title: "Validar Pago",
      message: "Al confirmar, la orden pasará a 'En Proceso' y el cliente será notificado de que su pago fue exitoso.",
      actionLabel: "Aprobar Pago",
      actionColor: "bg-emerald-600 hover:bg-emerald-700",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await updateStatus({ orderId, status: 'processing' });
        onClose();
      }
    });
  };

  const submitTracking = async () => {
    if(!trackingModal.value) return;
    setTrackingModal({ ...trackingModal, isOpen: false });
    await updateStatus({ 
      orderId, 
      status: 'shipped', 
      tracking_number: trackingModal.value 
    });
    onClose();
  };

  const handleMarkDelivered = () => {
    setConfirmModal({
      isOpen: true,
      title: "Finalizar Pedido",
      message: "¿Confirmas que el cliente recibió el paquete correctamente? Esto cerrará el ciclo de venta.",
      actionLabel: "Marcar como Entregado",
      actionColor: "bg-emerald-600 hover:bg-emerald-700",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await updateStatus({ orderId, status: 'delivered' });
        onClose();
      }
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      await api.post(`/orders/${orderId}/message`, { message: newMessage });
      setConfirmModal({
        isOpen: true,
        title: "Mensaje Enviado",
        message: "El mensaje ha sido enviado y registrado en la bitácora.",
        actionLabel: "Entendido",
        actionColor: "bg-slate-900",
        onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
      });
      setNewMessage(""); 
    } catch (error) {
      console.error(error);
      alert("Error al enviar el mensaje.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  // ✅ Parsear Dirección Segura
  let parsedAddress: any = null;
  if (order?.shipping_address_json) {
    if (typeof order.shipping_address_json === 'string') {
      try { parsedAddress = JSON.parse(order.shipping_address_json); } catch (e) {}
    } else {
      parsedAddress = order.shipping_address_json;
    }
  }

  return (
    <>
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
                              {item.lot_number || 'N/A'}
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
                      <FileText className="text-purple-500" size={20}/> Evidencia de Pago Adjunta
                    </h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center">
                      <a 
                        href={`https://api.medbaysupply.com${order.evidence_file}`} 
                        target="_blank"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-2"
                      >
                        <ExternalLink size={16}/> Ver Documento
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
                             onChange={(e) => {
                               setTaxInput(e.target.value);
                               setHasEditedTax(true); // ✅ Evita que se borre al actualizar opciones
                             }}
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
                               {/* ✅ Formato a 2 decimales para envíos existentes */}
                               <span className="font-mono text-emerald-400 font-bold">${parseFloat(opt.cost).toFixed(2)}</span>
                            </div>
                          ))}
                          {shippingOptions.length === 0 && (
                            <p className="text-xs text-slate-500 italic">No hay opciones de envío aún.</p>
                          )}
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2">
                           <input 
                             placeholder="Nombre (Ej: DHL Express)" 
                             value={newOption.name}
                             onChange={(e) => setNewOption({...newOption, name: e.target.value})}
                             className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                           />
                           <div className="flex gap-2">
                             <input 
                               placeholder="Días (Ej: 2-3)" 
                               value={newOption.days}
                               onChange={(e) => setNewOption({...newOption, days: e.target.value})}
                               className="w-1/2 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                             />
                             <input 
                               type="number"
                               placeholder="Costo $" 
                               value={newOption.cost}
                               onChange={(e) => setNewOption({...newOption, cost: e.target.value})}
                               className="w-1/2 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                             />
                           </div>
                           <button 
                             onClick={handleAddOption}
                             disabled={isAddingOption}
                             className="w-full py-1.5 bg-slate-700 hover:bg-blue-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
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
                        Se enviaron opciones de envío. El cliente debe elegir una para continuar.
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
                        Esperando que el cliente suba su comprobante.
                      </p>
                    </div>
                  )}

                  {/* CASO 4: REVISIÓN DE PAGO */}
                  {order.status === 'payment_review' && (
                     <div className="space-y-3">
                       <p className="text-sm text-slate-300 mb-2">Comprobante recibido. Revisa el documento adjunto y valida.</p>
                       <button onClick={handleApprovePayment} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                         <ShieldCheck size={18}/> Validar Pago y Procesar
                       </button>
                     </div>
                  )}

                  {/* CASO 5: EN PROCESO */}
                  {order.status === 'processing' && (
                    <div className="space-y-3 text-center">
                      <p className="text-sm text-slate-300 mb-2">Prepara el paquete para envío.</p>
                      <button onClick={() => setTrackingModal({isOpen: true, value: ''})} className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                        <Truck size={18}/> Ingresar Rastreo y Enviar
                      </button>
                    </div>
                  )}

                  {/* CASO 6: ENVIADO - SEGUIMIENTO Y CIERRE */}
                  {order.status === 'shipped' && (
                    <div className="space-y-6">
                      {order.tracking_number && (
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest">Tracking / Guía</p>
                           <p className="font-mono font-bold text-lg text-white mt-1 select-all">{order.tracking_number}</p>
                        </div>
                      )}

                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <label className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                          <MessageCircle size={14}/> Notificación Directa
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Ej: El repartidor ya está en tu zona."
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
                          {isSendingMsg ? 'Enviando...' : 'Enviar al Cliente'}
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-700">
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
                        <p className="text-slate-400 text-xs mt-1">Este ciclo de venta se ha cerrado.</p>
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
                    <div className="flex justify-between text-slate-500">
                      <span>Impuestos</span>
                      {order.status === 'pending_valuation' ? (
                        <span className="text-blue-500 font-bold italic">Pendiente</span>
                      ) : (
                        <span>{formatCurrency(parseFloat(order.tax || '0'))}</span>
                      )}
                    </div>
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

                {/* ✅ 3. DIRECCIÓN COMPLETA */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <MapPin size={18} className="text-slate-400"/> Dirección de Envío
                   </h4>
                   {parsedAddress ? (
                      <div className="text-sm text-slate-600 space-y-1">
                        <p className="font-bold text-slate-900">{parsedAddress.street} {parsedAddress.street_number}</p>
                        <p>{parsedAddress.colony ? `${parsedAddress.colony}, ` : ''}{parsedAddress.city}</p>
                        <p className="text-xs uppercase mt-2 font-bold text-slate-400">
                          {parsedAddress.state}, {parsedAddress.country} • CP {parsedAddress.postal_code}
                        </p>
                      </div>
                   ) : (
                     <p className="text-slate-400 text-xs italic">Dirección no especificada.</p>
                   )}
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center text-red-500">Error cargando datos</div>
          )}
        </div>
      </div>
    </div>

    {/* ✅ MODALES DE DISEÑO MEDBAY */}

    {/* Modal de Confirmación General */}
    {confirmModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({...confirmModal, isOpen: false})}></div>
        <div className="bg-white rounded-3xl shadow-2xl p-8 relative w-full max-w-md animate-in zoom-in-95 text-center">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4"/>
          <h3 className="font-black text-xl text-slate-800 mb-2">{confirmModal.title}</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{confirmModal.message}</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmModal({...confirmModal, isOpen: false})} className="w-1/2 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button onClick={confirmModal.onConfirm} className={`w-1/2 py-3 rounded-xl font-bold text-white transition-colors shadow-lg ${confirmModal.actionColor}`}>
              {confirmModal.actionLabel}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal Input de Rastreo */}
    {trackingModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setTrackingModal({...trackingModal, isOpen: false})}></div>
        <div className="bg-white rounded-3xl shadow-2xl p-8 relative w-full max-w-md animate-in zoom-in-95">
          <Truck size={40} className="mx-auto text-blue-500 mb-4"/>
          <h3 className="font-black text-xl text-slate-800 text-center mb-2">Ingresar Rastreo</h3>
          <p className="text-slate-500 text-sm text-center mb-6">Proporciona el número de guía de la paquetería.</p>
          <input 
            type="text" 
            autoFocus
            placeholder="Ej: 1Z9999999999999999"
            value={trackingModal.value}
            onChange={(e) => setTrackingModal({...trackingModal, value: e.target.value})}
            className="w-full p-4 text-center font-mono font-bold text-lg bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 mb-6"
          />
          <div className="flex gap-3">
            <button onClick={() => setTrackingModal({...trackingModal, isOpen: false})} className="w-1/3 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
              Cerrar
            </button>
            <button onClick={submitTracking} disabled={!trackingModal.value} className="w-2/3 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50">
              Confirmar Envío
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal Mini de Proveedores */}
    {showSupplierModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
         <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSupplierModal(false)}></div>
         <div className="bg-white rounded-3xl shadow-2xl p-6 relative w-full max-w-md animate-in zoom-in-95">
           <button onClick={() => setShowSupplierModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20}/></button>
           <h3 className="font-black text-lg mb-4 text-slate-800 flex items-center gap-2"><Building2 size={18}/> Proveedores</h3>
           <div className="space-y-3">
             {suppliers.map(sup => (
               <div key={sup.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <p className="font-bold text-slate-800">{sup.name}</p>
                 <p className="text-xs text-slate-500 mt-1">{sup.country} • Contacto: {sup.contact_info}</p>
               </div>
             ))}
           </div>
         </div>
      </div>
    )}
    </>
  );
}