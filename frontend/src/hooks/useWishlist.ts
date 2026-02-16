// frontend/src/hooks/useWishlist.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface WishlistItem {
  wishlist_item_id: string;
  product_id: string;
  added_at: string;
  product_name: string;
  global_sku: string;
  manufacturer_name: string;
  product_image: string;
  total_stock: string;
}

export const useWishlist = () => {
  const queryClient = useQueryClient();
  // ✅ Extraemos token para validar presencia real de la sesión
  const { isAuthenticated, token } = useAuth();

  // 1. OBTENER LISTA
  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: async (): Promise<WishlistItem[]> => {
      const response = await api.get('/wishlist');
      return response.data;
    },
    // ✅ Solo habilitamos si el estado dice autenticado Y el token está presente
    enabled: !!isAuthenticated && !!token,
    staleTime: 1000 * 60,
    // ✅ Evitamos reintentos infinitos si el servidor rechaza la sesión (401/403)
    retry: (failureCount, error: any) => {
      if (error.response?.status === 401 || error.response?.status === 403) return false;
      return failureCount < 2;
    }
  });

  // 2. AGREGAR A FAVORITOS
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.post('/wishlist', { productId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-status'] });
    },
  });

  // 3. ELIMINAR DE FAVORITOS
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.delete(`/wishlist/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-status'] });
    },
  });

  // 4. CHECK STATUS (Helper para la UI)
  const useWishlistStatus = (productId: string) => {
    return useQuery({
      queryKey: ['wishlist-status', productId],
      queryFn: async () => {
        if (!productId) return false;
        const response = await api.get(`/wishlist/${productId}/status`);
        return response.data.isInWishlist;
      },
      // ✅ Aplicamos el mismo doble candado aquí
      enabled: !!isAuthenticated && !!token && !!productId,
      retry: false // Para estados de UI, mejor no reintentar si falla auth
    });
  };

  return {
    wishlistItems: wishlistQuery.data || [],
    isLoading: wishlistQuery.isLoading && isAuthenticated,
    
    addToWishlist: addToWishlistMutation.mutateAsync,
    removeFromWishlist: removeFromWishlistMutation.mutateAsync,
    
    useWishlistStatus,
  };
};