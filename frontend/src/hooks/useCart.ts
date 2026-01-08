//frontend/src/hooks/useCart.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface CartItem {
  cart_item_id: string;
  cart_quantity: number;
  product_lot_id: string;
  product_supplier_id: string;
  // Detalles del Lote
  lot_number: string;
  expiry_date: string;
  unit_price: string;
  available_stock: number;
  lot_status: string;
  // Detalles del Producto
  product_id: string;
  product_name: string;
  global_sku: string;
  manufacturer_name: string;
  product_image: string;
}

export interface CartSummary {
  totalItems: number;
  subtotal: number;
}

interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}

export const useCart = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // 1. OBTENER CARRITO
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async (): Promise<CartResponse> => {
      const response = await api.get('/cart');
      return response.data;
    },
    enabled: isAuthenticated, // Solo fetch si está logueado
    staleTime: 1000 * 60, // Considerar fresco por 1 minuto
  });

  // 2. AGREGAR AL CARRITO
  const addToCartMutation = useMutation({
    mutationFn: async ({ lotId, quantity }: { lotId: string; quantity: number }) => {
      const response = await api.post('/cart', { product_lot_id: lotId, quantity });
      return response.data;
    },
    onSuccess: () => {
      // Recargar carrito automáticamente
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 3. ACTUALIZAR CANTIDAD
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity, lotId }: { itemId: string; quantity: number, lotId: string }) => {
      const response = await api.put(`/cart/${itemId}`, { quantity, product_lot_id: lotId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 4. ELIMINAR ÍTEM
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/cart/${itemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 5. VACIAR CARRITO
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/cart');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return {
    cartItems: cartQuery.data?.items || [],
    summary: cartQuery.data?.summary || { totalItems: 0, subtotal: 0 },
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    
    addToCart: addToCartMutation.mutateAsync,
    isAdding: addToCartMutation.isPending,
    
    updateQuantity: updateQuantityMutation.mutateAsync,
    
    removeItem: removeItemMutation.mutateAsync,
    
    clearCart: clearCartMutation.mutateAsync,
  };
};