// frontend/src/hooks/useAdminOrders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- TIPOS DE DATOS ---
export interface OrderItem {
  id: string;
  product_name: string;
  global_sku: string;
  supplier_sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  lot_number: string;
  expiry_date: string;
}

export interface AdminOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  status: 'pending_review' | 'payment_pending' | 'payment_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  total: string;
  currency: string;
  placed_at: string;
  items_count?: number; // Puede venir calculado o lo calculamos
  shipping_method?: string;
  payment_method?: string;
  notes?: string;
  referral_code?: string;
  evidence_file?: string;
}

export const useAdminOrders = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER TODAS LAS ÓRDENES
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async (): Promise<AdminOrder[]> => {
      const response = await api.get('/orders'); // Endpoint admin que creamos en backend
      return response.data;
    },
    // Refrescar cada minuto para ver nuevos pedidos
    refetchInterval: 60000, 
  });

  // 2. OBTENER DETALLE DE UNA ORDEN
  const getOrderDetails = async (orderId: string) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data; // Retorna { order, items, payments }
  };

  // 3. CAMBIAR ESTADO (Aprobar/Rechazar/Enviar)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // --- HELPERS PARA UI ---
  
  // Traducir status técnico a texto legible
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_review': return 'Revisión de Stock';
      case 'payment_pending': return 'Esperando Pago';
      case 'payment_review': return 'Validando Pago';
      case 'processing': return 'En Proceso';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      case 'rejected': return 'Rechazado (Sin Stock)';
      default: return status;
    }
  };

  // Colores para los badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'payment_pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'payment_review': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'processing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'shipped': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': 
      case 'rejected': 
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return {
    orders,
    isLoading,
    error,
    getOrderDetails,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    getStatusLabel,
    getStatusColor
  };
};