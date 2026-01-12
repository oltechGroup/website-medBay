// frontend/src/hooks/useMyOrders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ✅ 1. Definimos AddressJSON (Igual que en admin, para reutilizar lógica)
export interface AddressJSON {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

// ✅ 2. Definimos OrderItem (Para la tabla del modal)
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

// ✅ 3. Definimos la Orden Completa (Renombrado a 'Order' para estándar)
export interface Order {
  id: string;
  status: string;
  total: string;
  subtotal?: string;      // Nuevo
  shipping_cost?: string; // Nuevo
  tax?: string;           // Nuevo
  currency: string;       // Nuevo
  placed_at: string;
  shipping_method: string;
  payment_method: string;
  evidence_file?: string;
  tracking_number?: string; // Nuevo
  items_count?: number;
  
  // Datos complejos
  items?: OrderItem[];    // Nuevo (vendrá al pedir detalle)
  shipping_address_json?: AddressJSON; // Nuevo
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

  // Helpers de UI (Colores para el cliente)
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_review': 
        return { label: 'Revisando Stock', color: 'bg-amber-100 text-amber-700', actionRequired: false };
      case 'payment_pending': 
        return { label: 'Pago Pendiente', color: 'bg-blue-100 text-blue-700', actionRequired: true };
      case 'payment_review': 
        return { label: 'Validando Pago', color: 'bg-purple-100 text-purple-700', actionRequired: false };
      case 'processing': 
        return { label: 'Preparando Envío', color: 'bg-indigo-100 text-indigo-700', actionRequired: false };
      case 'shipped': 
        return { label: 'Enviado', color: 'bg-cyan-100 text-cyan-700', actionRequired: false };
      case 'delivered':
        return { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700', actionRequired: false };
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
    getStatusInfo
  };
};