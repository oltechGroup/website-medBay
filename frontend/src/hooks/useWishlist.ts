//frontend/src/hooks/useWishlist.ts

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
  total_stock: string; // Stock total de todos los lotes
}

export const useWishlist = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // 1. OBTENER LISTA
  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: async (): Promise<WishlistItem[]> => {
      const response = await api.get('/wishlist');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // 2. AGREGAR A FAVORITOS
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.post('/wishlist', { productId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      // También invalidamos el check de status específico si lo hubiera
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

  // 4. CHECK STATUS (Helper para saber si un ID está en favoritos)
  const useWishlistStatus = (productId: string) => {
    return useQuery({
      queryKey: ['wishlist-status', productId],
      queryFn: async () => {
        if (!productId) return false;
        const response = await api.get(`/wishlist/${productId}/status`);
        return response.data.isInWishlist;
      },
      enabled: isAuthenticated && !!productId,
    });
  };

  return {
    wishlistItems: wishlistQuery.data || [],
    isLoading: wishlistQuery.isLoading,
    
    addToWishlist: addToWishlistMutation.mutateAsync,
    removeFromWishlist: removeFromWishlistMutation.mutateAsync,
    
    // Hook interno expuesto
    useWishlistStatus,
  };
};