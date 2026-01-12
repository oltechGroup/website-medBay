// frontend/src/hooks/useAdminOrders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- TIPOS DE DATOS ---

// 1. Estructura de Proveedor (Para el botón mágico)
export interface Supplier {
  id: string;
  name: string;
  contact_info: string;
  country: string;
}

// 2. Estructura de Dirección (Viene del JSON del backend)
export interface AddressJSON {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
  tax_id?: string;
}

// 3. Estructura de Ítem
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
  // Info extra para visualización
  supplier_name?: string; 
}

// 4. Estructura de Orden (Actualizada con Phone y Addresses)
export interface AdminOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string; // ✅ Nuevo
  customer_company?: string;
  
  status: 'pending_review' | 'payment_pending' | 'payment_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  
  // Totales y Costos
  total: string;
  subtotal: string;
  tax: string;
  shipping_cost: string; // ✅ Nuevo (Antes aparecía +Consultar porque faltaba aquí)
  currency: string;
  
  // Direcciones Completas (JSON)
  shipping_address_json?: AddressJSON; // ✅ Nuevo
  billing_address_json?: AddressJSON;  // ✅ Nuevo
  
  placed_at: string;
  items_count?: number;
  shipping_method?: string;
  payment_method?: string;
  notes?: string;
  referral_code?: string;
  evidence_file?: string;
  tracking_number?: string;
}

// 5. Respuesta completa del endpoint de detalles
interface OrderDetailsResponse {
  order: AdminOrder;
  items: OrderItem[];
  suppliers: Supplier[]; // ✅ Array de proveedores únicos
}

export const useAdminOrders = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER TODAS LAS ÓRDENES (Tabla principal)
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async (): Promise<AdminOrder[]> => {
      const response = await api.get('/orders');
      return response.data;
    },
    refetchInterval: 60000, 
  });

  // 2. OBTENER DETALLE DE UNA ORDEN (Modal)
  const getOrderDetails = async (orderId: string): Promise<OrderDetailsResponse> => {
    const response = await api.get(`/orders/${orderId}`);
    // response.data debe coincidir con la estructura del controlador getById
    return response.data; 
  };

  // 3. CAMBIAR ESTADO (Aprobar/Rechazar/Enviar)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, tracking_number }: { orderId: string; status: string; tracking_number?: string }) => {
      const response = await api.put(`/orders/${orderId}/status`, { status, tracking_number });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // --- HELPERS PARA UI (Etiquetas en Español Limpio) ---
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_review': return 'Pendiente de Revisión'; // ✅ Corregido (Sin guiones bajos)
      case 'payment_pending': return 'Esperando Pago';
      case 'payment_review': return 'Validando Pago';
      case 'processing': return 'En Proceso / Preparando';
      case 'shipped': return 'Enviado / En Tránsito';
      case 'delivered': return 'Entregado Finalizado';
      case 'cancelled': return 'Cancelado';
      case 'rejected': return 'Rechazado (Sin Stock)';
      default: return status;
    }
  };

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