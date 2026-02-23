// frontend/src/app/(shop)/orders/components/CustomerOrderModal.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  X, Package, MapPin, CreditCard, Truck, 
  CheckCircle2, AlertCircle, Clock, FileText, 
  Loader2, UploadCloud, DollarSign, Landmark
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Order, OrderItem, ShippingOption } from "@/hooks/useMyOrders"; 
import { api } from "@/lib/api";

// --- REAL BANK DETAILS ---
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

  // State for customer selection (Local before sending)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Load items and options when opening the modal
  useEffect(() => {
    if (isOpen && order.id) {
      setLoading(true);
      api.get(`/orders/${order.id}`)
        .then(res => {
          setItems(res.data.items || []);
          setShippingOptions(res.data.shippingOptions || []);
        })
        .catch(err => console.error("Error loading order details:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, order.id, order.status]); 

  if (!isOpen) return null;

  // --- TOTALS CALCULATION LOGIC (PREVIEW) ---
  const selectedOption = shippingOptions.find(o => o.id === selectedOptionId);
  
  const currentSubtotal = parseFloat(order.subtotal || '0');
  const currentTax = parseFloat(order.tax || '0');
  
  const currentShippingCost = selectedOption 
    ? parseFloat(selectedOption.cost) 
    : parseFloat(order.shipping_cost || '0');

  const currentTotal = currentSubtotal + currentTax + currentShippingCost;

  // --- CONFIRMATION HANDLER ---
  const handleConfirmSelection = async () => {
    if (!selectedOptionId) return;
    
    try {
      await onSelectShipping({ 
        orderId: order.id, 
        shippingOptionId: selectedOptionId 
      });
      onClose();
    } catch (error) {
      console.error("Error selecting shipping:", error);
      alert("There was a problem processing your selection. Please try again.");
    }
  };

  // Status Helpers (Visual)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_valuation': return { color: 'bg-amber-100 text-amber-700', icon: <Clock size={14}/>, label: 'Quoting Shipping' };
      case 'waiting_customer_approval': return { color: 'bg-sky-100 text-sky-700', icon: <DollarSign size={14}/>, label: 'Requires Approval' };
      case 'payment_pending': return { color: 'bg-blue-100 text-blue-700', icon: <AlertCircle size={14}/>, label: 'Payment Pending' };
      case 'payment_review': return { color: 'bg-purple-100 text-purple-700', icon: <FileText size={14}/>, label: 'Validating Payment' };
      case 'processing': return { color: 'bg-indigo-100 text-indigo-700', icon: <Package size={14}/>, label: 'Preparing Shipment' };
      case 'shipped': return { color: 'bg-cyan-100 text-cyan-700', icon: <Truck size={14}/>, label: 'Shipped' };
      case 'delivered': return { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={14}/>, label: 'Delivered' };
      default: return { color: 'bg-slate-100 text-slate-600', icon: <X size={14}/>, label: 'Cancelled' };
    }
  };

  const statusInfo = getStatusBadge(order.status);

  // Try to parse address if it comes as a string
  let parsedAddress = order.shipping_address_json;
  if (typeof parsedAddress === 'string') {
    try {
      parsedAddress = JSON.parse(parsedAddress);
    } catch (e) {
      console.error("Error parsing address JSON", e);
    }
  }

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
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Order #{order.id.slice(0,8)}</h2>
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

        {/* BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6 md:p-8">
          {loading ? (
             <div className="flex h-full items-center justify-center">
               <Loader2 className="animate-spin text-blue-500" size={32}/>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              
              {/* LEFT: PRODUCTS */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 font-bold text-slate-700 text-xs md:text-sm uppercase tracking-wide">
                    Purchase Summary
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
                               Lot: {item.lot_number}
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
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tracking Number</p>
                       <p className="text-xl md:text-2xl font-black text-slate-800 font-mono tracking-wider break-all">{order.tracking_number}</p>
                     </div>
                     <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-pulse flex-shrink-0">
                       <Truck size={24}/>
                     </div>
                   </div>
                )}
              </div>

              {/* RIGHT: ACTION PANELS (B2B Logic) */}
              <div className="space-y-6">
                
                {/* --- 1. SHIPPING SELECTION (Only if waiting for approval) --- */}
                {order.status === 'waiting_customer_approval' && (
                  <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-lg shadow-sky-100/50">
                    <h4 className="font-bold text-sky-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <Truck size={16}/> Select Shipping
                    </h4>
                    <div className="space-y-3">
                      {shippingOptions.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No options available yet.</p>
                      ) : (
                        shippingOptions.map(option => (
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
                        ))
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100">
                       <button 
                         onClick={handleConfirmSelection}
                         disabled={!selectedOptionId || isSelecting}
                         className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
                       >
                         {isSelecting ? <Loader2 className="animate-spin" size={18}/> : <DollarSign size={18}/>}
                         Accept and Pay Total
                       </button>
                    </div>
                  </div>
                )}

                {/* --- 2. BANK DETAILS + EVIDENCE --- */}
                {(order.status === 'payment_pending' || order.status === 'payment_review') && (
                  <div className="space-y-4">
                    
                    {/* Bank Details Card */}
                    {order.status === 'payment_pending' && (
                      <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-2 mb-4 text-blue-400">
                          <Landmark size={20}/> 
                          <span className="font-bold text-sm uppercase tracking-wider">Transfer Details</span>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs uppercase">Beneficiary</p>
                            <p className="font-bold">{BANK_DETAILS.company}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase">Bank</p>
                            <p className="font-bold">{BANK_DETAILS.bank}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-slate-400 text-xs uppercase">Account</p>
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
                            <p className="text-slate-400 text-xs uppercase">Address</p>
                            <p className="text-xs text-slate-300">{BANK_DETAILS.address}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUCCESS CARD OR FILE UPLOAD */}
                    {order.status === 'payment_review' ? (
                      <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-200 shadow-lg shadow-purple-100/50 text-center animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 size={24} />
                        </div>
                        <h4 className="font-bold text-purple-900 mb-1">Evidence Received!</h4>
                        <p className="text-xs text-purple-700 font-medium">
                          Your payment is being validated by our team. 
                          You will receive a notification shortly to proceed with the shipment.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-lg shadow-blue-100/50 text-center animate-in fade-in zoom-in">
                        <h4 className="font-bold text-slate-800 mb-1">Upload Receipt</h4>
                        <p className="text-xs text-slate-500 mb-4">Attach a photo or PDF of your transfer.</p>
                        
                        {isUploading ? (
                          <div className="py-3 flex justify-center text-blue-600"><Loader2 className="animate-spin"/></div>
                        ) : (
                          <label className="block w-full py-3 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95 text-sm">
                            Select File
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,application/pdf"
                              onChange={async (e) => {
                                await onUploadEvidence(e, order.id);
                                setTimeout(() => window.location.reload(), 1500);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* 3. DYNAMIC FINANCIAL SUMMARY */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs md:text-sm uppercase tracking-wide">
                     <CreditCard size={16}/> Totals
                   </h4>
                   <div className="space-y-3 text-xs md:text-sm">
                     <div className="flex justify-between text-slate-500">
                       <span>Subtotal</span>
                       <span>{formatCurrency(currentSubtotal)}</span>
                     </div>
                     <div className="flex justify-between text-slate-500">
                       <span>Taxes</span>
                       <span>{currentTax > 0 ? formatCurrency(currentTax) : 'Calculating...'}</span>
                     </div>
                     <div className="flex justify-between text-slate-500">
                       <span>Shipping {selectedOption ? `(${selectedOption.name})` : ''}</span>
                       <span className={!selectedOption && !order.shipping_cost ? 'text-blue-500 font-bold italic' : ''}>
                         {currentShippingCost > 0 ? formatCurrency(currentShippingCost) : 'Select...'}
                       </span>
                     </div>
                     <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-base md:text-lg text-slate-900">
                       <span>Total</span>
                       <span>{formatCurrency(currentTotal)}</span>
                     </div>
                   </div>
                </div>

                {/* 4. ACTUAL ADDRESS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs md:text-sm uppercase tracking-wide">
                     <MapPin size={16}/> Ship to
                   </h4>
                   {parsedAddress ? (
                     <div className="text-sm text-slate-600 space-y-1">
                       <p className="font-bold text-slate-900">{parsedAddress.street}</p>
                       <p>{parsedAddress.city}</p>
                       <p className="font-bold text-xs uppercase mt-2 text-slate-400">
                         {parsedAddress.state}, {parsedAddress.country} • ZIP {parsedAddress.postal_code}
                       </p>
                     </div>
                   ) : (
                     <p className="text-slate-400 italic text-sm">Standard address</p>
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