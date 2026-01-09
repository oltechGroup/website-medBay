// frontend/src/hooks/useClientNotifications.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface ClientNotification {
  id: string;
  type: 'order' | 'quote';
  subject: string;
  message: string;
  created_at: string;
}

export const useClientNotifications = () => {
  const { isAuthenticated } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['client-notifications'],
    queryFn: async (): Promise<ClientNotification[]> => {
      const response = await api.get('/notifications/client');
      return response.data;
    },
    // Solo ejecutar si está logueado
    enabled: isAuthenticated,
    // Refrescar cada 30 segundos para dar sensación de tiempo real
    refetchInterval: 30000, 
  });

  return {
    notifications,
    isLoading,
    unreadCount: notifications.length // Por simplicidad, todo lo que trae la query cuenta como "pendiente"
  };
};