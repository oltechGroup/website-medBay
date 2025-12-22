// frontend/src/hooks/useProductDetails.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductLot } from './useProductLots'; // Reutilizamos tus tipos existentes
import { Category } from './useCategories';   // Reutilizamos tus tipos existentes

export const useProductDetails = (productId: string, enabled: boolean = true) => {
  
  // 1. Obtener Lotes del Producto
  const lotsQuery = useQuery({
    queryKey: ['product-lots', productId],
    queryFn: async () => {
      if (!productId) return [];
      try {
        // Intenta obtener los lotes específicos de este producto
        const response = await api.get(`/products/${productId}/lots`);
        return response.data as ProductLot[];
      } catch (error) {
        console.error("Error cargando lotes:", error);
        return [];
      }
    },
    enabled: enabled && !!productId, // Solo ejecuta si el modal/card está abierto
    staleTime: 1000 * 60 * 2, // Guarda en caché 2 minutos
  });

  // 2. Obtener Categorías del Producto
  const categoriesQuery = useQuery({
    queryKey: ['product-categories', productId],
    queryFn: async () => {
      if (!productId) return [];
      try {
        const response = await api.get(`/products/${productId}/categories`);
        return response.data as Category[];
      } catch (error) {
        console.error("Error cargando categorías:", error);
        return [];
      }
    },
    enabled: enabled && !!productId,
  });

  // 3. Obtener Imágenes Adicionales
  const imagesQuery = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      if (!productId) return [];
      try {
        const response = await api.get(`/products/${productId}/images`);
        return response.data;
      } catch (error) {
        console.warn("No se pudieron cargar imágenes extra:", error);
        return [];
      }
    },
    enabled: enabled && !!productId,
  });

  return {
    lots: lotsQuery.data || [],
    isLoadingLots: lotsQuery.isLoading,
    categories: categoriesQuery.data || [],
    images: imagesQuery.data || [],
    isLoadingDetails: lotsQuery.isLoading || categoriesQuery.isLoading,
  };
};