// frontend/src/hooks/useMyOrders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MyOrder {
  id: string;
  status: string;
  total: string;
  placed_at: string;
  shipping_method: string;
  payment_method: string;
  evidence_file?: string;
  items_count?: number; // Puede venir del join o lo calculamos
}

export const useMyOrders = () => {
  const queryClient = useQueryClient();

  // 1. Obtener mis órdenes
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async (): Promise<MyOrder[]> => {
      const response = await api.get('/orders/my-orders');
      return response.data;
    },
  });

  // 2. Subir Evidencia
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
        return { label: 'Revisando Stock', color: 'bg-yellow-100 text-yellow-700', actionRequired: false };
      case 'payment_pending': 
        return { label: 'Pago Pendiente', color: 'bg-blue-100 text-blue-700', actionRequired: true };
      case 'payment_review': 
        return { label: 'Validando Pago', color: 'bg-purple-100 text-purple-700', actionRequired: false };
      case 'processing': 
        return { label: 'Preparando Envío', color: 'bg-indigo-100 text-indigo-700', actionRequired: false };
      case 'shipped': 
        return { label: 'Enviado', color: 'bg-green-100 text-green-700', actionRequired: false };
      case 'rejected': 
        return { label: 'Cancelada', color: 'bg-red-50 text-red-500', actionRequired: false };
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