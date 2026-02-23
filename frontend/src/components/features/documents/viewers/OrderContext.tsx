//frontend/src/components/features/documents/viewers/OrderContext.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Loader2, Package, MapPin, CreditCard, User } from "lucide-react";

export const OrderContext = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    api.get(`/orders/${orderId}`)
      .then(res => setOrder(res.data))
      .catch(err => console.error("Error loading order", err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!order) return <div className="p-4 text-slate-400">No order information found.</div>;

  const { order: data, items } = order;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Related Order</h4>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-lg font-black text-slate-800">#{data.id.slice(0,8)}</p>
            <p className="text-xs text-slate-500">{formatDate(data.placed_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-blue-600">{formatCurrency(data.total)}</p>
            <span className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-600">
              {data.payment_method?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
          <Package size={16} className="text-blue-500"/> Products ({items.length})
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          {items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="flex-1">
                <p className="font-bold text-slate-700 line-clamp-1">{item.product_name}</p>
                <p className="text-xs text-slate-400">Qty: {item.quantity} | SKU: {item.global_sku}</p>
              </div>
              <p className="font-bold text-slate-900">{formatCurrency(item.line_total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping and Customer Data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <h5 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
            <User size={14}/> Customer
          </h5>
          <p className="text-xs font-bold text-slate-800">{data.customer_name}</p>
          <p className="text-[10px] text-slate-400">{data.customer_email}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <h5 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
            <MapPin size={14}/> Shipping
          </h5>
          <p className="text-[10px] text-slate-600 leading-tight">
            {data.shipping_address_json?.street}, {data.shipping_address_json?.city}
          </p>
        </div>
      </div>
    </div>
  );
};