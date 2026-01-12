// frontend/src/hooks/useClientNotifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface ClientNotification {
  id: string;
  type: 'order' | 'quote' | 'system'; // Agregamos 'system' para mensajes generales
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export const useClientNotifications = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // 1. Obtener Notificaciones
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['client-notifications'],
    queryFn: async (): Promise<ClientNotification[]> => {
      const response = await api.get('/notifications/client');
      return response.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, 
  });

  // 2. ✅ NUEVO: Borrar Notificación
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      // Recargar la lista automáticamente al borrar
      queryClient.invalidateQueries({ queryKey: ['client-notifications'] });
    },
  });

  // 3. ✅ NUEVO: Marcar como leída (Opcional, pero útil)
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications'] });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount: notifications.length,
    // Exportamos las funciones
    deleteNotification: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    markAsRead: markReadMutation.mutateAsync
  };
};