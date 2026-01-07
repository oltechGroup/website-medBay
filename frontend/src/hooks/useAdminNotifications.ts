//frontend/src/hooks/useAdminNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Notification {
  id: number;
  type: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  content: any; // JSONB con product_details, contact_details, etc.
  created_at: string;
  is_read?: boolean;
}

export const useAdminNotifications = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER NOTIFICACIONES
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const response = await api.get('/notifications');
      return response.data;
    },
    // Refrescar cada 1 minuto automáticamente para ver si llegaron nuevos mensajes
    refetchInterval: 60000, 
  });

  // 2. ELIMINAR NOTIFICACIÓN
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      // Al borrar, actualizamos la lista automáticamente en todos lados (Header y Page)
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // 3. MARCAR COMO LEÍDA (Opcional, si tu backend lo soporta, si no, borrar es la acción principal)
  // Por ahora lo simularemos invalidando la query si implementas el endpoint PUT después.

  return {
    notifications,
    isLoading,
    error,
    deleteNotification: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    // Helpers para UI
    unreadCount: notifications.length, // O notifications.filter(n => !n.is_read).length si tuvieras esa flag
    isEmpty: notifications.length === 0,
  };
};