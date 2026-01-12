// frontend/src/app/dashboard/orders/page.tsx
"use client";

import { useState } from "react";
import { 
  Search, Filter, Package, AlertCircle, 
  Eye, Phone, Mail, Calendar, CreditCard 
} from "lucide-react";
import { useAdminOrders, AdminOrder } from "@/hooks/useAdminOrders";
import { formatCurrency, formatDate } from "@/lib/formatters";

// Importamos el Modal que acabamos de mejorar
import OrderDetailsModal from "./OrderDetailsModal"; 

export default function OrdersPage() {
  const { orders, isLoading, getStatusLabel, getStatusColor } = useAdminOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Estado para abrir el Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // --- LÓGICA DE FILTRADO ---
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (order.customer_name?.toLowerCase().includes(searchLower) || "") ||
      (order.customer_email?.toLowerCase().includes(searchLower) || "") ||
      (order.id.toLowerCase().includes(searchLower) || "") ||
      (order.customer_phone?.includes(searchLower) || ""); // También buscamos por teléfono
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- CONTADORES PARA ALERTAS ---
  const pendingReview = orders.filter(o => o.status === 'pending_review').length;
  const paymentReview = orders.filter(o => o.status === 'payment_review').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Órdenes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra el flujo de compras, validación de stock y envíos.
          </p>
        </div>
        
        {/* ALERTAS RÁPIDAS (Badges de Acción) */}
        <div className="flex gap-3">
          {pendingReview > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm animate-pulse">
              <AlertCircle size={18} />
              <span className="text-xs font-bold">{pendingReview} por revisar stock</span>
            </div>
          )}
          {paymentReview > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 shadow-sm">
              <CreditCard size={18} />
              <span className="text-xs font-bold">{paymentReview} pagos por validar</span>
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS (Buscador y Filtros) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ID, Cliente, Email o Teléfono..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium"
          />
        </div>

        {/* Filtro de Estado (Select Bonito) */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Filter size={18} className="text-slate-400 flex-shrink-0" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer font-bold"
          >
            <option value="all">📦 Todos los estados</option>
            <option value="pending_review">🟡 Revisión de Stock</option>
            <option value="payment_pending">🔵 Esperando Pago</option>
            <option value="payment_review">🟣 Validando Pago</option>
            <option value="processing">🟢 En Proceso / Preparando</option>
            <option value="shipped">🚚 Enviado</option>
            <option value="delivered">✅ Entregado</option>
            <option value="cancelled">❌ Cancelado</option>
            <option value="rejected">⛔ Rechazado</option>
          </select>
        </div>
      </div>

      {/* TABLA DE ÓRDENES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100 font-black tracking-wider">
              <tr>
                <th className="px-6 py-4">Orden ID</th>
                <th className="px-6 py-4">Cliente / Contacto</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                // SKELETON LOADING
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 bg-slate-100 rounded-lg w-full animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Package size={48} className="mb-4 text-slate-300" />
                      <p className="font-bold text-slate-600 text-lg">No se encontraron órdenes</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                    
                    {/* ID */}
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>

                    {/* CLIENTE (Con Teléfono) */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{order.customer_name}</div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail size={12} className="text-slate-400"/> {order.customer_email}
                        </div>
                        {/* ✅ AQUI ESTÁ EL TELÉFONO QUE PEDISTE */}
                        {order.customer_phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={12} className="text-slate-400"/> {order.customer_phone}
                          </div>
                        )}
                      </div>
                      {order.referral_code && (
                        <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100">
                          Ref: {order.referral_code}
                        </span>
                      )}
                    </td>

                    {/* FECHA */}
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400"/>
                        {formatDate(order.placed_at)}
                      </div>
                    </td>

                    {/* ESTADO (Badge Bonito en Español) */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>

                    {/* TOTAL */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-800 text-sm">
                        {formatCurrency(order.total)}
                      </span>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                        {order.currency}
                      </div>
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:shadow-md transition-all active:scale-95"
                        title="Ver Detalles y Gestionar"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLES (Se abre al seleccionar una orden) */}
      {selectedOrder && (
        <OrderDetailsModal 
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          orderId={selectedOrder.id}
        />
      )} 

    </div>
  );
}