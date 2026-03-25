// frontend/src/hooks/useAdminOrders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- TIPOS DE DATOS ---

// 1. Estructura de Proveedor
export interface Supplier {
  id: string;
  name: string;
  contact_info: string;
  country: string;
}

// 2. Estructura de Dirección
export interface AddressJSON {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
  tax_id?: string;
}

// 3. Estructura de Ítem (Actualizada con Unit of Measure)
export interface OrderItem {
  id: string;
  product_name: string;
  global_sku: string;
  supplier_sku?: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  lot_number: string;
  expiry_date: string;
  supplier_name?: string; 
  unit_of_measure?: string | null; // 🚀 NUEVO: Campo agregado para evitar errores de TS
}

// 4. Estructura de Opción de Envío
export interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  estimated_days?: string;
  cost: string; 
  is_selected: boolean;
}

// 5. Estructura de Orden
export interface AdminOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  
  status: 
    | 'pending_valuation' 
    | 'waiting_customer_approval' 
    | 'payment_pending' 
    | 'payment_review' 
    | 'processing' 
    | 'shipped' 
    | 'delivered' 
    | 'cancelled' 
    | 'rejected';
  
  total: string;
  subtotal: string;
  tax: string;
  shipping_cost: string;
  currency: string;
  
  shipping_address_json?: AddressJSON;
  billing_address_json?: AddressJSON;
  
  placed_at: string;
  items_count?: number;
  shipping_method?: string;
  payment_method?: string;
  notes?: string;
  referral_code?: string;
  evidence_file?: string;
  tracking_number?: string;
}

// 6. Respuesta completa del endpoint de detalles
interface OrderDetailsResponse {
  order: AdminOrder;
  items: OrderItem[];
  suppliers: Supplier[];
  shippingOptions: ShippingOption[]; 
}

export const useAdminOrders = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER TODAS LAS ÓRDENES
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async (): Promise<AdminOrder[]> => {
      const response = await api.get('/orders');
      return response.data;
    },
    refetchInterval: 60000, 
  });

  // 2. OBTENER DETALLE DE UNA ORDEN
  const getOrderDetails = async (orderId: string): Promise<OrderDetailsResponse> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data; 
  };

  // 3. CAMBIAR ESTADO GENERAL
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, tracking_number }: { orderId: string; status: string; tracking_number?: string }) => {
      const response = await api.put(`/orders/${orderId}/status`, { status, tracking_number });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // 4. AGREGAR OPCIÓN DE ENVÍO
  const addShippingOptionMutation = useMutation({
    mutationFn: async (data: { orderId: string; name: string; description: string; estimated_days: string; cost: number }) => {
      const response = await api.post(`/orders/${data.orderId}/shipping-options`, {
        name: data.name,
        description: data.description,
        estimated_days: data.estimated_days,
        cost: data.cost
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // 5. ENVIAR VALUACIÓN
  const submitValuationMutation = useMutation({
    mutationFn: async ({ orderId, tax_amount }: { orderId: string; tax_amount: number }) => {
      const response = await api.post(`/orders/${orderId}/valuation`, { tax_amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // --- HELPERS PARA UI ---
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_valuation': return 'Nueva Solicitud (Cotizar)';
      case 'waiting_customer_approval': return 'Esperando Cliente';
      case 'payment_pending': return 'Esperando Pago';
      case 'payment_review': return 'Validando Pago';
      case 'processing': return 'En Proceso / Preparando';
      case 'shipped': return 'Enviado / En Tránsito';
      case 'delivered': return 'Entregado Finalizado';
      case 'cancelled': return 'Cancelado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_valuation': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'waiting_customer_approval': return 'bg-sky-100 text-sky-700 border-sky-200';
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
    addShippingOption: addShippingOptionMutation.mutateAsync,
    isAddingOption: addShippingOptionMutation.isPending,
    submitValuation: submitValuationMutation.mutateAsync,
    isSubmittingValuation: submitValuationMutation.isPending,
    getStatusLabel,
    getStatusColor
  };
};