// frontend/src/app/(shop)/orders/components/CustomerOrderModal.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  X, Package, MapPin, CreditCard, Truck, 
  CheckCircle2, AlertCircle, Clock, FileText, 
  Loader2, UploadCloud, DollarSign, Landmark, Copy
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Order, OrderItem, ShippingOption } from "@/hooks/useMyOrders"; 
import { api } from "@/lib/api";

// --- DATOS BANCARIOS REALES (Hardcoded para seguridad visual) ---
const BANK_DETAILS = {
  company: "Silkweb Systems & Innovations LLC",
  bank: "JP Morgan Chase Bank, N.A.",
  account: "573508788",
  routing: "021000021",
  swift: "CHASUS33",
  address: "13046 Racetrack Road, Suite 160, Tampa, FL 33626"
};

interface CustomerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onUploadEvidence: (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => Promise<void>;
  isUploading: boolean;
  // ✅ Nuevas Props
  onSelectShipping: (opts: { orderId: string, shippingOptionId: string }) => Promise<void>;
  isSelecting: boolean;
}

export default function CustomerOrderModal({ 
  isOpen, 
  onClose, 
  order, 
  onUploadEvidence, 
  isUploading,
  onSelectShipping,
  isSelecting
}: CustomerOrderModalProps) {
  
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para la selección del cliente (Local antes de enviar)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Cargar items y opciones al abrir
  useEffect(() => {
    if (isOpen && order.id) {
      setLoading(true);
      api.get(`/orders/${order.id}`)
        .then(res => {
          setItems(res.data.items || []);
          setShippingOptions(res.data.shippingOptions || []);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, order.id]);

  if (!isOpen) return null;

  // --- LÓGICA DE CÁLCULO DE TOTALES (PREVIEW) ---
  const selectedOption = shippingOptions.find(o => o.id === selectedOptionId);
  
  const currentSubtotal = parseFloat(order.subtotal || '0');
  const currentTax = parseFloat(order.tax || '0');
  
  // Si ya seleccionó una opción localmente, usamos ese costo. Si no, el de la orden (que será 0 al inicio)
  const currentShippingCost = selectedOption 
    ? parseFloat(selectedOption.cost) 
    : parseFloat(order.shipping_cost || '0');

  const currentTotal = currentSubtotal + currentTax + currentShippingCost;

  // --- HANDLER DE CONFIRMACIÓN ---
  const handleConfirmSelection = async () => {
    if (!selectedOptionId) return;
    await onSelectShipping({ orderId: order.id, shippingOptionId: selectedOptionId });
    onClose();
  };

  // Helpers de Estado (Visual)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_valuation': return { color: 'bg-amber-100 text-amber-700', icon: <Clock size={14}/>, label: 'Cotizando Envío' };
      case 'waiting_customer_approval': return { color: 'bg-sky-100 text-sky-700', icon: <DollarSign size={14}/>, label: 'Requiere Aprobación' };
      case 'payment_pending': return { color: 'bg-blue-100 text-blue-700', icon: <AlertCircle size={14}/>, label: 'Pago Pendiente' };
      case 'payment_review': return { color: 'bg-purple-100 text-purple-700', icon: <FileText size={14}/>, label: 'Validando Pago' };
      case 'processing': return { color: 'bg-indigo-100 text-indigo-700', icon: <Package size={14}/>, label: 'Preparando Envío' };
      case 'shipped': return { color: 'bg-cyan-100 text-cyan-700', icon: <Truck size={14}/>, label: 'Enviado' };
      case 'delivered': return { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={14}/>, label: 'Entregado' };
      default: return { color: 'bg-slate-100 text-slate-600', icon: <X size={14}/>, label: 'Cancelado' };
    }
  };

  const statusInfo = getStatusBadge(order.status);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-4xl h-[90vh] md:h-[85vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 border border-white/20">
        
        {/* HEADER */}
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10 flex-shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Orden #{order.id.slice(0,8)}</h2>
              <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase flex items-center gap-1.5 ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{formatDate(order.placed_at)}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400 md:w-6 md:h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6 md:p-8">
          {loading ? (
             <div className="flex h-full items-center justify-center">
               <Loader2 className="animate-spin text-blue-500" size={32}/>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              
              {/* IZQUIERDA: PRODUCTOS */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 font-bold text-slate-700 text-xs md:text-sm uppercase tracking-wide">
                    Resumen de Compra
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map(item => (
                      <div key={item.id} className="p-4 md:p-5 flex flex-col sm:flex-row items-start gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-4 w-full sm:w-auto">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                              <Package size={20} />
                            </div>
                            <div className="flex-1 sm:hidden">
                                <p className="font-bold text-slate-800 text-sm">{item.product_name}</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full sm:w-auto pl-[3.25rem] sm:pl-0 -mt-2 sm:mt-0">
                          <p className="font-bold text-slate-800 hidden sm:block">{item.product_name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                             <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                               Lote: {item.lot_number}
                             </span>
                          </div>
                        </div>
                        <div className="text-right w-full sm:w-auto pl-[3.25rem] sm:pl-0">
                          <p className="text-xs md:text-sm font-bold text-slate-600">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                          <p className="text-sm md:text-base font-black text-slate-900 mt-1">{formatCurrency(item.line_total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status === 'shipped' && order.tracking_number && (
                   <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Número de Rastreo</p>
                        <p className="text-xl md:text-2xl font-black text-slate-800 font-mono tracking-wider break-all">{order.tracking_number}</p>
                      </div>
                      <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-pulse flex-shrink-0">
                        <Truck size={24}/>
                      </div>
                   </div>
                )}
              </div>

              {/* DERECHA: PANELES DE ACCIÓN (B2B Logic) */}
              <div className="space-y-6">
                
                {/* --- 1. SELECCIÓN DE ENVÍO (Solo si espera aprobación) --- */}
                {order.status === 'waiting_customer_approval' && (
                  <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-lg shadow-sky-100/50">
                    <h4 className="font-bold text-sky-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <Truck size={16}/> Selecciona Envío
                    </h4>
                    <div className="space-y-3">
                      {shippingOptions.map(option => (
                        <div 
                          key={option.id}
                          onClick={() => setSelectedOptionId(option.id)}
                          className={`
                            cursor-pointer p-3 rounded-xl border transition-all flex justify-between items-center
                            ${selectedOptionId === option.id ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-200' : 'border-slate-200 hover:border-sky-300'}
                          `}
                        >
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{option.name}</p>
                            <p className="text-xs text-slate-500">{option.estimated_days}</p>
                          </div>
                          <span className="font-bold text-slate-900">{formatCurrency(parseFloat(option.cost))}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100">
                       <button 
                         onClick={handleConfirmSelection}
                         disabled={!selectedOptionId || isSelecting}
                         className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
                       >
                         {isSelecting ? <Loader2 className="animate-spin" size={18}/> : <DollarSign size={18}/>}
                         Aceptar y Pagar Total
                       </button>
                    </div>
                  </div>
                )}

                {/* --- 2. DATOS BANCARIOS + EVIDENCIA (Solo si espera pago) --- */}
                {order.status === 'payment_pending' && (
                  <div className="space-y-4">
                    
                    {/* Tarjeta de Datos Bancarios (Chase) */}
                    <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                      <div className="flex items-center gap-2 mb-4 text-blue-400">
                        <Landmark size={20}/> 
                        <span className="font-bold text-sm uppercase tracking-wider">Datos para Transferencia</span>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs uppercase">Beneficiario</p>
                          <p className="font-bold">{BANK_DETAILS.company}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase">Banco</p>
                          <p className="font-bold">{BANK_DETAILS.bank}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                             <p className="text-slate-400 text-xs uppercase">Cuenta</p>
                             <p className="font-mono font-bold tracking-wider text-emerald-400 select-all">{BANK_DETAILS.account}</p>
                           </div>
                           <div>
                             <p className="text-slate-400 text-xs uppercase">Routing (ABA)</p>
                             <p className="font-mono font-bold tracking-wider select-all">{BANK_DETAILS.routing}</p>
                           </div>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase">SWIFT</p>
                          <p className="font-mono font-bold tracking-wider select-all">{BANK_DETAILS.swift}</p>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-700">
                           <p className="text-slate-400 text-xs uppercase">Dirección</p>
                           <p className="text-xs text-slate-300">{BANK_DETAILS.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subida de Archivo */}
                    <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-lg shadow-blue-100/50 text-center">
                      <h4 className="font-bold text-slate-800 mb-1">Subir Comprobante</h4>
                      <p className="text-xs text-slate-500 mb-4">Adjunta foto o PDF de tu transferencia.</p>
                      
                      {isUploading ? (
                        <div className="py-3 flex justify-center text-blue-600"><Loader2 className="animate-spin"/></div>
                      ) : (
                        <label className="block w-full py-3 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95 text-sm">
                          Seleccionar Archivo
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,application/pdf"
                            onChange={(e) => onUploadEvidence(e, order.id)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. RESUMEN FINANCIERO DINÁMICO */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs md:text-sm uppercase tracking-wide">
                     <CreditCard size={16}/> Totales
                   </h4>
                   <div className="space-y-3 text-xs md:text-sm">
                     <div className="flex justify-between text-slate-500">
                       <span>Subtotal</span>
                       <span>{formatCurrency(currentSubtotal)}</span>
                     </div>
                     <div className="flex justify-between text-slate-500">
                       <span>Impuestos</span>
                       <span>{currentTax > 0 ? formatCurrency(currentTax) : 'Calculando...'}</span>
                     </div>
                     <div className="flex justify-between text-slate-500">
                       <span>Envío {selectedOption ? `(${selectedOption.name})` : ''}</span>
                       <span className={!selectedOption && !order.shipping_cost ? 'text-blue-500 font-bold italic' : ''}>
                         {currentShippingCost > 0 ? formatCurrency(currentShippingCost) : 'Seleccionar...'}
                       </span>
                     </div>
                     <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-base md:text-lg text-slate-900">
                       <span>Total</span>
                       <span>{formatCurrency(currentTotal)}</span>
                     </div>
                   </div>
                </div>

                {/* 4. DIRECCIÓN */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs md:text-sm uppercase tracking-wide">
                     <MapPin size={16}/> Envío a
                   </h4>
                   {order.shipping_address_json ? (
                     <div className="text-sm text-slate-600 space-y-1">
                       <p className="font-bold text-slate-900">{order.shipping_address_json.street}</p>
                       <p>{order.shipping_address_json.city}, {order.shipping_address_json.state}</p>
                       <p className="font-bold text-xs uppercase mt-2 text-slate-400">{order.shipping_address_json.country} • CP {order.shipping_address_json.postal_code}</p>
                     </div>
                   ) : (
                     <p className="text-slate-400 italic text-sm">Dirección estándar</p>
                   )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}