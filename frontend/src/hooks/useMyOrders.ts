// frontend/src/hooks/useMyOrders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- TIPOS ---

export interface AddressJSON {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  product_name: string;
  global_sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  lot_number: string;
  expiry_date: string;
}

// Estructura de Opciones de Envío
export interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  estimated_days?: string;
  cost: string; 
}

// Orden Completa
export interface Order {
  id: string;
  status: string;
  total: string;
  subtotal?: string;      
  shipping_cost?: string; 
  tax?: string;           
  currency: string;       
  placed_at: string;
  shipping_method: string;
  payment_method: string;
  evidence_file?: string;
  tracking_number?: string; 
  items_count?: number;
  
  // Datos complejos
  items?: OrderItem[];    
  shipping_address_json?: AddressJSON;
  
  // Lista de opciones disponibles para esta orden
  shippingOptions?: ShippingOption[]; 
}

export const useMyOrders = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER LISTA DE MIS ÓRDENES
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async (): Promise<Order[]> => {
      const response = await api.get('/orders/my-orders');
      return response.data;
    },
  });

  // 2. SUBIR EVIDENCIA
  const uploadEvidenceMutation = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/orders/${orderId}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });

  // ✅ 3. SELECCIONAR ENVÍO (CORREGIDO)
  const selectShippingMutation = useMutation({
    mutationFn: async ({ orderId, shippingOptionId }: { orderId: string; shippingOptionId: string }) => {
      // AQUÍ ESTABA EL ERROR: Cambiamos la clave a 'shipping_option_id' para que el backend la lea bien
      const response = await api.post(`/orders/${orderId}/select-shipping`, { 
        shipping_option_id: shippingOptionId 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });

  // Helpers de UI
  const getStatusInfo = (status: string) => {
    switch (status) {
      // --- ESTADOS INICIALES ---
      case 'pending_valuation': 
        return { label: 'Cotizando Envío', color: 'bg-amber-100 text-amber-700', actionRequired: false };
      case 'waiting_customer_approval': 
        return { label: 'Aprobar Cotización', color: 'bg-sky-100 text-sky-700 border-sky-200 animate-pulse', actionRequired: true };
      
      // --- ESTADOS DE PAGO ---
      case 'payment_pending': 
        return { label: 'Pago Pendiente', color: 'bg-blue-100 text-blue-700', actionRequired: true };
      case 'payment_review': 
        return { label: 'Validando Pago', color: 'bg-purple-100 text-purple-700', actionRequired: false };
      
      // --- ESTADOS LOGÍSTICOS ---
      case 'processing': 
        return { label: 'Preparando', color: 'bg-indigo-100 text-indigo-700', actionRequired: false };
      case 'shipped': 
        return { label: 'Enviado', color: 'bg-cyan-100 text-cyan-700', actionRequired: false };
      case 'delivered':
        return { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700', actionRequired: false };
      
      // --- ESTADOS NEGATIVOS ---
      case 'rejected': 
      case 'cancelled':
        return { label: 'Cancelada', color: 'bg-slate-100 text-slate-500', actionRequired: false };
      
      default: 
        return { label: status, color: 'bg-gray-100 text-gray-500', actionRequired: false };
    }
  };

  return {
    orders,
    isLoading,
    uploadEvidence: uploadEvidenceMutation.mutateAsync,
    isUploading: uploadEvidenceMutation.isPending,
    
    // Exportamos la función corregida
    selectShippingOption: selectShippingMutation.mutateAsync,
    isSelectingShipping: selectShippingMutation.isPending,
    
    getStatusInfo
  };
};