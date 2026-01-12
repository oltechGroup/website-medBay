// frontend/src/app/dashboard/orders/OrderDetailsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  X, Package, MapPin, User, CreditCard, 
  CheckCircle2, XCircle, Truck, FileText, 
  ExternalLink, ShieldCheck, AlertTriangle,
  Clock, Phone, Globe, MessageCircle, Building2
} from "lucide-react";
import { useAdminOrders, AdminOrder, OrderItem, Supplier } from "@/hooks/useAdminOrders";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const { getOrderDetails, updateStatus, getStatusLabel, getStatusColor, isUpdating } = useAdminOrders();
  
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); // ✅ Estado para proveedores
  const [loading, setLoading] = useState(true);

  // Estado para el mini-modal de proveedores
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      getOrderDetails(orderId)
        .then((data) => {
          setOrder(data.order);
          setItems(data.items);
          setSuppliers(data.suppliers || []); // ✅ Guardamos proveedores
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  // --- MANEJADORES DE ACCIÓN --- //

  const handleApproveStock = async () => {
    if(!confirm("¿Confirmas que hay stock disponible? El cliente recibirá un correo con los datos bancarios para pagar.")) return;
    await updateStatus({ orderId, status: 'payment_pending' });
    onClose();
  };

  const handleRejectOrder = async () => {
    if(!confirm("¿Rechazar esta orden? Se notificará al cliente y se cancelará la solicitud.")) return;
    await updateStatus({ orderId, status: 'rejected' });
    onClose();
  };

  const handleApprovePayment = async () => {
    if(!confirm("¿El pago es válido? Esto moverá la orden a 'En Proceso'.")) return;
    await updateStatus({ orderId, status: 'processing' });
    onClose();
  };

  const handleMarkShipped = async () => {
    // ✅ Pedimos el Tracking Number aquí
    const tracking = prompt("Ingresa el Número de Rastreo / Guía (Opcional):");
    if (tracking === null) return; // Cancelado por usuario

    await updateStatus({ 
      orderId, 
      status: 'shipped', 
      tracking_number: tracking 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
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
                {/* ✅ Teléfono visible */}
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

        {/* BODY CON SCROLL */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : order ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* === COLUMNA IZQUIERDA (2/3): ÍTEMS === */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Tabla de Productos */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <Package size={18} className="text-blue-500"/> Productos Solicitados
                    </span>
                    
                    {/* ✅ BOTÓN DE PROVEEDORES (El botón mágico) */}
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
                        <th className="px-6 py-3">Detalle</th>
                        <th className="px-6 py-3 text-center">Lote</th>
                        <th className="px-6 py-3 text-center">Cant.</th>
                        <th className="px-6 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{item.product_name}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.global_sku}</p>
                            {/* Mostrar el supplier SKU si existe */}
                            {item.supplier_sku && (
                               <p className="text-[10px] text-blue-500 font-mono">Prov SKU: {item.supplier_sku}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-bold text-slate-600 border border-slate-200">
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
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="text-purple-500" size={20}/> Evidencia de Pago
                    </h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center">
                      {order.evidence_file.endsWith('.pdf') ? (
                        <iframe 
                          src={`http://localhost:3001${order.evidence_file}`} 
                          className="w-full h-96 rounded-xl border border-slate-200"
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
                        className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink size={14}/> Abrir archivo original
                      </a>
                    </div>
                  </div>
                )}

              </div>

              {/* === COLUMNA DERECHA (1/3): INFO Y ACCIONES === */}
              <div className="space-y-6">
                
                {/* 1. CAJA DE ACCIONES (Lógica de Negocio) */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-5 border-b border-slate-700 pb-2">
                    Panel de Control
                  </h4>
                  
                  {/* PENDIENTE DE REVISIÓN */}
                  {order.status === 'pending_review' && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300 mb-2">Valida disponibilidad con el proveedor antes de aprobar.</p>
                      <button 
                        onClick={handleApproveStock}
                        disabled={isUpdating}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 size={18}/> Confirmar Stock
                      </button>
                      <button 
                        onClick={handleRejectOrder}
                        disabled={isUpdating}
                        className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-red-400 hover:text-red-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <XCircle size={18}/> Rechazar Pedido
                      </button>
                    </div>
                  )}

                  {/* ESPERANDO PAGO */}
                  {order.status === 'payment_pending' && (
                    <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400">
                        <Clock size={24}/>
                      </div>
                      <p className="font-bold text-white">Esperando Cliente</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                        Se enviaron las instrucciones de pago. El cliente debe subir su comprobante.
                      </p>
                    </div>
                  )}

                  {/* REVISIÓN DE PAGO */}
                  {order.status === 'payment_review' && (
                    <div className="space-y-3">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3 mb-2">
                        <AlertTriangle className="text-yellow-400 flex-shrink-0" size={20}/>
                        <span className="text-xs text-yellow-100 font-medium">Revisa la evidencia adjunta antes de validar.</span>
                      </div>
                      <button 
                        onClick={handleApprovePayment}
                        disabled={isUpdating}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <ShieldCheck size={18}/> Validar Pago
                      </button>
                    </div>
                  )}

                  {/* EN PROCESO */}
                  {order.status === 'processing' && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300 mb-2">Orden pagada. Prepara el paquete.</p>
                      <button 
                        onClick={handleMarkShipped}
                        disabled={isUpdating}
                        className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Truck size={18}/> Marcar Enviado
                      </button>
                    </div>
                  )}

                  {/* ESTADOS FINALES */}
                  {['shipped', 'delivered', 'cancelled', 'rejected'].includes(order.status) && (
                     <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ciclo Finalizado</p>
                        {order.tracking_number && (
                          <div className="mt-3 bg-white/10 p-3 rounded-xl">
                             <p className="text-[10px] text-slate-400 uppercase">Tracking Number</p>
                             <p className="font-mono font-bold text-white tracking-wider">{order.tracking_number}</p>
                          </div>
                        )}
                     </div>
                  )}
                </div>

                {/* 2. DATOS FINANCIEROS */}
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
                      <span>Envío ({order.shipping_method})</span>
                      {/* ✅ Ahora usa el shipping_cost real */}
                      <span className="font-medium text-slate-700">
                        {parseFloat(order.shipping_cost) > 0 ? formatCurrency(parseFloat(order.shipping_cost)) : 'Gratis'}
                      </span> 
                    </div>
                    {parseFloat(order.tax) > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Impuestos</span>
                        <span>{formatCurrency(parseFloat(order.tax))}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-lg text-slate-900">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-center text-slate-400">
                    Método: <span className="font-bold text-slate-600 uppercase">{order.payment_method?.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* 3. DIRECCIÓN DE ENTREGA (MEJORADA) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-slate-400"/> Dirección de Entrega
                  </h4>
                  
                  {order.shipping_address_json ? (
                    <div className="text-sm text-slate-600 space-y-1">
                      <p className="font-bold text-slate-900">{order.customer_name}</p>
                      <p>{order.shipping_address_json.street}</p>
                      <p>
                        {order.shipping_address_json.city}, {order.shipping_address_json.state}
                      </p>
                      <p className="font-mono text-xs bg-slate-100 inline-block px-1.5 rounded text-slate-500">
                        CP: {order.shipping_address_json.postal_code}
                      </p>
                      <p className="font-bold text-slate-400 uppercase text-xs mt-1">
                        {order.shipping_address_json.country}
                      </p>
                      {order.shipping_address_json.phone && (
                        <p className="mt-2 flex items-center gap-2 text-blue-600 font-medium">
                          <Phone size={14}/> {order.shipping_address_json.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm italic">Dirección no disponible en formato nuevo.</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center text-red-500">Error al cargar orden</div>
          )}
        </div>
      </div>

      {/* =========================================================
          🔥 MINI-MODAL DE PROVEEDORES (POPUP)
          ========================================================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           {/* Backdrop Transparente pero bloqueante */}
           <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setShowSupplierModal(false)}></div>
           
           <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowSupplierModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={20}/>
              </button>
              
              <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
                <Building2 className="text-blue-600"/> Proveedores
              </h3>
              <p className="text-sm text-slate-500 mb-6">Contacta para verificar disponibilidad.</p>

              <div className="space-y-4">
                {suppliers.map(sup => (
                  <div key={sup.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                    <p className="font-bold text-slate-900">{sup.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 mb-3">
                      <Globe size={12}/> {sup.country || 'Intl'}
                    </div>
                    
                    {/* Botones de Contacto */}
                    <div className="flex gap-2">
                      <a 
                        href={`mailto:${sup.contact_info}`} 
                        className="flex-1 bg-white border border-slate-200 py-2 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100"
                      >
                         <MessageCircle size={14}/> Email
                      </a>
                      <button 
                        onClick={() => alert(`Teléfono: ${sup.contact_info}`)}
                        className="flex-1 bg-white border border-slate-200 py-2 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100"
                      >
                         <Phone size={14}/> Teléfono
                      </button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}