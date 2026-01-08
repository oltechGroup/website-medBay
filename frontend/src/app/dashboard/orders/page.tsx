//frontend/src/app/dashboard/orders/page.tsx
"use client";

import { useState } from "react";
import { 
  Search, Filter, Package, AlertCircle, 
  FileText, Eye 
} from "lucide-react";
import { useAdminOrders, AdminOrder } from "@/hooks/useAdminOrders";
import { formatCurrency, formatDate } from "@/lib/formatters";

// ✅ Importación del Modal Descomentada
import OrderDetailsModal from "./OrderDetailsModal"; 

export default function OrdersPage() {
  const { orders, isLoading, getStatusLabel, getStatusColor } = useAdminOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Estado para el Modal de Detalles
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // --- FILTROS ---
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- ESTADÍSTICAS RÁPIDAS ---
  const pendingReview = orders.filter(o => o.status === 'pending_review').length;
  const paymentPending = orders.filter(o => o.status === 'payment_review').length;

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Órdenes de Compra</h1>
          <p className="text-slate-500 text-sm">Gestiona el flujo de inventario, pagos y envíos.</p>
        </div>
        
        {/* ALERTAS DE ACCIÓN */}
        <div className="flex gap-3">
          {pendingReview > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm animate-pulse">
              <AlertCircle size={18} />
              <span className="text-xs font-bold">{pendingReview} por revisar stock</span>
            </div>
          )}
          {paymentPending > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 shadow-sm">
              <FileText size={18} />
              <span className="text-xs font-bold">{paymentPending} pagos por validar</span>
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, ID o correo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>

        {/* Filtro de Estado */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Filter size={18} className="text-slate-400 flex-shrink-0" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="pending_review">🟡 Revisión de Stock</option>
            <option value="payment_pending">🔵 Esperando Pago</option>
            <option value="payment_review">🟣 Validando Pago</option>
            <option value="processing">🟢 En Proceso</option>
            <option value="shipped">🚚 Enviado</option>
            <option value="cancelled">❌ Cancelado</option>
          </select>
        </div>
      </div>

      {/* TABLA DE ÓRDENES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Orden ID</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Fecha</th>
                <th className="px-6 py-4 font-bold text-center">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Total</th>
                <th className="px-6 py-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // SKELETON LOADING
                [1,2,3,4].map(i => (
                  <tr key={i} className="border-b border-slate-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Package size={48} className="mx-auto mb-2 opacity-20" />
                    <p>No se encontraron órdenes</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    
                    {/* ID */}
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      #{order.id.slice(0, 8)}...
                    </td>

                    {/* CLIENTE */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{order.customer_name}</div>
                      <div className="text-xs text-slate-500">{order.customer_email}</div>
                      {order.referral_code && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100">
                          Ref: {order.referral_code}
                        </span>
                      )}
                    </td>

                    {/* FECHA */}
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(order.placed_at)}
                    </td>

                    {/* ESTADO (Badge) */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>

                    {/* TOTAL */}
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {formatCurrency(order.total)}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
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

      {/* ✅ MODAL DE DETALLES INTEGRADO */}
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