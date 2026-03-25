// frontend/src/app/dashboard/orders/OrderDetailsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  X, Package, MapPin, User, CreditCard, 
  CheckCircle2, XCircle, Truck, FileText, 
  ExternalLink, ShieldCheck, AlertTriangle,
  Clock, Phone, MessageCircle, Building2,
  Plus, Send, DollarSign, Loader2, AlertCircle,
  Layers // 🚀 Icono para la unidad
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
  const [hasEditedTax, setHasEditedTax] = useState(false); 
  
  const [newOption, setNewOption] = useState({ name: '', days: '', cost: '' });
  
  const [loading, setLoading] = useState(true);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    actionColor: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', actionLabel: '', actionColor: '', onConfirm: () => {} });

  const fetchOrder = () => {
    getOrderDetails(orderId)
      .then((data) => {
        setOrder(data.order);
        setItems(data.items);
        setSuppliers(data.suppliers || []);
        setShippingOptions(data.shippingOptions || []);
        
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

  const handleAddOption = async () => {
    if (!newOption.name || !newOption.cost) return alert("Name and Cost are required");
    const cleanCost = parseFloat(newOption.cost).toFixed(2);
    await addShippingOption({
      orderId,
      name: newOption.name,
      description: "Standard option",
      estimated_days: newOption.days,
      cost: parseFloat(cleanCost)
    });
    setNewOption({ name: '', days: '', cost: '' });
    fetchOrder(); 
  };

  const handleSubmitValuation = () => {
    if (shippingOptions.length === 0) return alert("You must add at least one shipping option.");
    if (!taxInput) return alert("You must define the tax (or set to 0).");
    
    setConfirmModal({
      isOpen: true,
      title: "Send Proposal",
      message: "Confirm that taxes and shipping are correct? An email will be sent to the customer for payment.",
      actionLabel: "Send Proposal",
      actionColor: "bg-blue-600 hover:bg-blue-700",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await submitValuation({ orderId, tax_amount: parseFloat(taxInput) });
        onClose();
      }
    });
  };

  const handleRejectOrder = () => {
    setConfirmModal({
      isOpen: true,
      title: "Reject Order",
      message: "This action will cancel the customer's request. Are you sure?",
      actionLabel: "Yes, Reject",
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
      title: "Validate Payment",
      message: "By confirming, the order will move to 'Processing' and the customer will be notified of their successful payment.",
      actionLabel: "Approve Payment",
      actionColor: "bg-emerald-600 hover:bg-emerald-700",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await updateStatus({ orderId, status: 'processing' });
        onClose();
      }
    });
  };

  const handleMarkShippedDirectly = () => {
    setConfirmModal({
      isOpen: true,
      title: "Mark as Shipped",
      message: "Confirm that the package is already on its way to the customer?",
      actionLabel: "Confirm Shipment",
      actionColor: "bg-blue-600 hover:bg-blue-700",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await updateStatus({ orderId, status: 'shipped' });
        onClose();
      }
    });
  };

  const handleMarkDelivered = () => {
    setConfirmModal({
      isOpen: true,
      title: "Complete Order",
      message: "Confirm that the customer received the package correctly? This will close the sales cycle.",
      actionLabel: "Mark as Delivered",
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
        title: "Message Sent",
        message: "The message has been sent and recorded in the log.",
        actionLabel: "Got it",
        actionColor: "bg-slate-900",
        onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
      });
      setNewMessage(""); 
    } catch (error) {
      console.error(error);
      alert("Error sending the message.");
    } finally {
      setIsSendingMsg(false);
    }
  };

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
                <h2 className="text-xl font-black text-slate-800">Order #{orderId?.slice(0,8)}</h2>
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
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
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
              
              {/* LEFT: PRODUCTS */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <Package size={18} className="text-blue-500"/> Order Contents
                    </span>
                    {suppliers.length > 0 && (
                      <button 
                        onClick={() => setShowSupplierModal(true)}
                        className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Building2 size={14}/> View Suppliers ({suppliers.length})
                      </button>
                    )}
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Product Description</th>
                        <th className="px-6 py-3 text-center">Batch/Lot</th>
                        <th className="px-6 py-3 text-center">Quantity</th>
                        <th className="px-6 py-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{item.product_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-mono">SKU: {item.global_sku}</span>
                              {/* 🚀 NUEVA INFO: Unidad de medida para el admin */}
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase flex items-center gap-1">
                                <Layers size={10}/> {item.unit_of_measure || 'Unit'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-white px-2 py-1 rounded text-xs font-mono font-bold text-slate-600 border border-slate-200 shadow-sm">
                              {item.lot_number || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {/* 🚀 Cantidad con sufijo de unidad para evitar errores de picking */}
                            <div className="flex flex-col items-center">
                              <span className="font-black text-slate-800 text-base">{item.quantity}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {item.unit_of_measure || 'units'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-black text-slate-800">{formatCurrency(item.line_total)}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{formatCurrency(item.unit_price)} / {item.unit_of_measure || 'unit'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {order.status === 'shipped' && order.tracking_number && (
                   <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Carrier Tracking</p>
                       <p className="text-xl md:text-2xl font-black text-slate-800 font-mono tracking-wider break-all">{order.tracking_number}</p>
                     </div>
                     <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-pulse flex-shrink-0">
                       <Truck size={24}/>
                     </div>
                   </div>
                )}
              </div>

              {/* RIGHT: CONTROL PANEL */}
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-5 border-b border-slate-700 pb-2">
                    Action Center
                  </h4>

                  {order.status === 'pending_valuation' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Logistics Tax (USD)</label>
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                              type="number" 
                              value={taxInput}
                              onChange={(e) => {
                                setTaxInput(e.target.value);
                                setHasEditedTax(true); 
                              }}
                              placeholder="0.00"
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-bold text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex justify-between">
                          <span>Shipping Matrix</span>
                          <span className="text-blue-400">{shippingOptions.length} tiers</span>
                        </label>
                        <div className="space-y-2 mb-3">
                          {shippingOptions.map(opt => (
                            <div key={opt.id} className="bg-slate-800 p-2 rounded-lg flex justify-between items-center text-xs">
                               <div>
                                 <span className="font-bold block text-white">{opt.name}</span>
                                 <span className="text-slate-400">{opt.estimated_days} days</span>
                               </div>
                               <span className="font-mono text-emerald-400 font-bold">${parseFloat(opt.cost).toFixed(2)}</span>
                            </div>
                          ))}
                          {shippingOptions.length === 0 && (
                            <p className="text-xs text-slate-500 italic text-center py-2">Add at least one delivery option.</p>
                          )}
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2">
                            <input 
                              placeholder="Name (e.g., DHL Express)" 
                              value={newOption.name}
                              onChange={(e) => setNewOption({...newOption, name: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                              <input 
                                placeholder="Days (e.g., 1-2)" 
                                value={newOption.days}
                                onChange={(e) => setNewOption({...newOption, days: e.target.value})}
                                className="w-1/2 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                              />
                              <input 
                                type="number"
                                placeholder="Cost $" 
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
                              <Plus size={12}/> Register Option
                            </button>
                        </div>
                      </div>

                      <div className="h-px bg-slate-700 my-4"></div>

                      <button 
                        onClick={handleSubmitValuation}
                        disabled={isSubmittingValuation}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                      >
                         <Send size={16}/> Push Proposal to Client
                      </button>
                      <button 
                        onClick={handleRejectOrder}
                        className="w-full py-3 bg-transparent text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        Decline and Close
                      </button>
                    </div>
                  )}

                  {order.status === 'waiting_customer_approval' && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <Clock size={24}/>
                      </div>
                      <p className="font-bold text-white uppercase tracking-wider text-xs">Awaiting Approval</p>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                        Client is reviewing the shipping matrix. We are on stand-by.
                      </p>
                    </div>
                  )}

                  {order.status === 'payment_pending' && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle size={24}/>
                      </div>
                      <p className="font-bold text-white uppercase tracking-wider text-xs">Funds Pending</p>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                        Order confirmed by client. Waiting for bank transfer receipt.
                      </p>
                    </div>
                  )}

                  {order.status === 'payment_review' && (
                     <div className="space-y-3">
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Internal Validation</p>
                       <button onClick={handleApprovePayment} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                         <ShieldCheck size={18}/> Approve and Pick Order
                       </button>
                     </div>
                  )}

                  {order.status === 'processing' && (
                    <div className="space-y-3 text-center">
                      <p className="text-xs text-slate-400 mb-3">Picking and packing in progress.</p>
                      <button onClick={handleMarkShippedDirectly} className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                        <Truck size={18}/> Mark as Shipped
                      </button>
                    </div>
                  )}

                  {order.status === 'shipped' && (
                    <div className="space-y-6">
                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <label className="text-[10px] font-black text-blue-400 uppercase mb-2 flex items-center gap-2 tracking-widest">
                          <MessageCircle size={14}/> Dispatch Update
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Update the customer on delivery status..."
                          className="w-full bg-slate-900 text-white text-sm p-3 rounded-lg border border-slate-600 focus:border-blue-500 outline-none resize-none mb-3 placeholder-slate-600"
                          onChange={(e) => setNewMessage(e.target.value)} 
                          value={newMessage}
                        ></textarea>
                        <button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSendingMsg}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSendingMsg ? <Loader2 className="animate-spin" size={12}/> : <Send size={12}/>} 
                          Notify Client
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-700">
                        <button 
                          onClick={handleMarkDelivered} 
                          disabled={isUpdating}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} 
                          Confirm Final Delivery
                        </button>
                      </div>
                    </div>
                  )}

                  {order.status === 'delivered' && (
                     <div className="text-center py-4">
                        <div className="bg-emerald-500/20 text-emerald-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                          <CheckCircle2 size={32}/>
                        </div>
                        <h3 className="font-black text-sm uppercase text-white tracking-widest">Cycle Closed</h3>
                        <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase">Transaction Archived</p>
                     </div>
                  )}

                  {['cancelled', 'rejected'].includes(order.status) && (
                     <div className="text-center py-4 opacity-50">
                        <XCircle size={32} className="mx-auto mb-2 text-slate-500"/>
                        <p className="font-black uppercase text-xs tracking-widest">Order Revoked</p>
                     </div>
                  )}
                </div>

                {/* 2. FINANCIAL SUMMARY */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                    <CreditCard size={14} className="text-slate-400"/> Ledger Entry
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-bold">{formatCurrency(parseFloat(order.subtotal || '0'))}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Taxes</span>
                      {order.status === 'pending_valuation' ? (
                        <span className="text-blue-500 font-bold italic">TBD</span>
                      ) : (
                        <span className="font-bold">{formatCurrency(parseFloat(order.tax || '0'))}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Shipping</span>
                      {order.status === 'pending_valuation' || order.status === 'waiting_customer_approval' ? (
                        <span className="text-blue-500 font-bold italic">TBD</span>
                      ) : (
                        <span className="font-bold">{formatCurrency(parseFloat(order.shipping_cost || '0'))}</span>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-lg text-slate-900">
                      <span>Grand Total</span>
                      {order.status === 'pending_valuation' ? (
                        <span className="text-slate-400 text-sm italic">Pending valuation</span>
                      ) : (
                        <span className="text-blue-600">{formatCurrency(order.total)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. SHIPPING ADDRESS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                     <MapPin size={14} className="text-slate-400"/> Delivery Target
                   </h4>
                   {parsedAddress ? (
                      <div className="text-sm text-slate-600 space-y-1">
                        <p className="font-black text-slate-900">{parsedAddress.street} {parsedAddress.street_number}</p>
                        <p className="font-bold">{parsedAddress.colony ? `${parsedAddress.colony}, ` : ''}{parsedAddress.city}</p>
                        <p className="text-[10px] uppercase mt-2 font-black text-slate-400 tracking-widest">
                          {parsedAddress.state}, {parsedAddress.country} • ZIP {parsedAddress.postal_code}
                        </p>
                      </div>
                   ) : (
                     <p className="text-slate-400 text-xs italic">No address provided.</p>
                   )}
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center text-red-500 font-black uppercase text-xs tracking-widest">Critial error: Data Sync Failed</div>
          )}
        </div>
      </div>
    </div>

    {/* DESIGN MODALS */}

    {confirmModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({...confirmModal, isOpen: false})}></div>
        <div className="bg-white rounded-3xl shadow-2xl p-8 relative w-full max-w-md animate-in zoom-in-95 text-center">
          <AlertCircle size={48} className="mx-auto text-slate-200 mb-4"/>
          <h3 className="font-black text-xl text-slate-800 mb-2 uppercase tracking-tight">{confirmModal.title}</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">{confirmModal.message}</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmModal({...confirmModal, isOpen: false})} className="w-1/2 py-3 rounded-xl font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors uppercase text-xs tracking-widest">
              Abort
            </button>
            <button onClick={confirmModal.onConfirm} className={`w-1/2 py-3 rounded-xl font-black text-white transition-colors shadow-lg uppercase text-xs tracking-widest ${confirmModal.actionColor}`}>
              {confirmModal.actionLabel}
            </button>
          </div>
        </div>
      </div>
    )}

    {showSupplierModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSupplierModal(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl p-6 relative w-full max-w-md animate-in zoom-in-95">
            <button onClick={() => setShowSupplierModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors"><X size={20}/></button>
            <h3 className="font-black text-lg mb-6 text-slate-800 flex items-center gap-2 border-b pb-2"><Building2 size={18} className="text-blue-500"/> Procurement Sources</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {suppliers.map(sup => (
                <div key={sup.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{sup.name}</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">{sup.country} • Contact: {sup.contact_info}</p>
                </div>
              ))}
            </div>
          </div>
      </div>
    )}
    </>
  );
}