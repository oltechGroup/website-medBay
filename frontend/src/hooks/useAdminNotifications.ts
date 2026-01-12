// frontend/src/hooks/useAdminNotifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth'; // ✅ Importamos Auth

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
  const { isAuthenticated, user } = useAuth(); // ✅ Obtenemos estado del usuario
  const queryClient = useQueryClient();

  // Verificamos si es staff para activar el hook
  const isStaff = user?.verification_level === 'admin' || user?.verification_level === 'sales_agent';

  // 1. OBTENER NOTIFICACIONES
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const response = await api.get('/notifications');
      return response.data;
    },
    // ✅ CANDADO DE SEGURIDAD: Solo ejecuta si está logueado Y es Staff
    enabled: !!isAuthenticated && !!isStaff, 
    // Refrescar cada 1 minuto automáticamente
    refetchInterval: 60000, 
    // Si falla (ej. 401), no reintentes infinitamente
    retry: false,
  });

  // 2. ELIMINAR NOTIFICACIÓN
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  return {
    notifications,
    isLoading,
    error,
    deleteNotification: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    unreadCount: notifications.length,
    isEmpty: notifications.length === 0,
  };
};