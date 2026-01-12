// frontend/src/hooks/useClientNotifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface ClientNotification {
  id: string;
  type: 'order' | 'quote' | 'system';
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
    // ✅ CANDADO DE SEGURIDAD: Solo ejecuta si está autenticado
    enabled: !!isAuthenticated,
    refetchInterval: 30000,
    retry: false,
  });

  // 2. Borrar Notificación
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications'] });
    },
  });

  // 3. Marcar como leída
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
    deleteNotification: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    markAsRead: markReadMutation.mutateAsync
  };
};