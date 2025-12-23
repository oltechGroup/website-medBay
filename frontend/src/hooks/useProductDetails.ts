// frontend/src/hooks/useProductDetails.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductLot } from './useProductLots'; 
import { Category } from './useCategories';   

// ✅ Aceptamos filterStatus como parámetro opcional
export const useProductDetails = (
  productId: string, 
  enabled: boolean = true, 
  filterStatus: string = 'all'
) => {
  
  // 1. Obtener Lotes del Producto (Con filtro de estado)
  const lotsQuery = useQuery({
    // Incluimos el filtro en la key para que el cache sea único por filtro
    queryKey: ['product-lots', productId, filterStatus],
    queryFn: async () => {
      if (!productId) return [];
      try {
        // ✅ Enviamos el status al backend
        const response = await api.get(`/products/${productId}/lots?status=${filterStatus}`);
        return response.data as ProductLot[];
      } catch (error) {
        console.error("Error cargando lotes:", error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 1000 * 60 * 2, 
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