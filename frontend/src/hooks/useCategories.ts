//frontend/src/components/UseCategories.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
  parent_name?: string;
}

export interface CreateCategoryData {
  name: string;
  parent_id?: string;
  description?: string;
}

export interface BatchAssignProductsData {
  categoryIds: string[];
  productIds: string[];
}

export interface CategoryStats {
  total_categories: number;
  categories_with_products: number;
  categories_without_products: number;
}

export const useCategories = () => {
  const queryClient = useQueryClient();

  // Consulta principal de categorías
  const { 
    data: categories = [], 
    isLoading, 
    isFetching, // 🟢 Agregado para consistencia y monitoreo de carga
    error,
    refetch 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      try {
        const response = await api.get('/categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },
    // ⚡ Optimización: Evita que el catálogo parpadee o tarde al navegar
    staleTime: 1000 * 60 * 10, // 10 minutos (las categorías no cambian seguido)
  });

  const createMutation = useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const response = await api.post('/categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      console.error('Error creating category:', error);
      throw error;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, categoryData }: { id: string; categoryData: Partial<Category> }) => {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      console.error('Error updating category:', error);
      throw error;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      console.error('Error deleting category:', error);
      throw error;
    }
  });

  // Consultas de administración (Estas pueden quedarse sin staleTime largo si prefieres)
  const categoriesWithoutProductsQuery = useQuery({
    queryKey: ['categories', 'without-products'],
    queryFn: async (): Promise<Category[]> => {
      try {
        const response = await api.get('/categories/filters/without-products');
        return response.data;
      } catch (error) {
        console.error('Error fetching categories without products:', error);
        return [];
      }
    },
  });

  const categoriesStatsQuery = useQuery({
    queryKey: ['categories', 'stats'],
    queryFn: async (): Promise<CategoryStats> => {
      try {
        const response = await api.get('/categories/stats/overview');
        return response.data;
      } catch (error) {
        console.error('Error fetching categories stats:', error);
        return {
          total_categories: 0,
          categories_with_products: 0,
          categories_without_products: 0
        };
      }
    },
  });

  const batchAssignProductsMutation = useMutation({
    mutationFn: async (data: BatchAssignProductsData) => {
      const response = await api.post('/categories/batch/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'without-products'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Error in batch assign products:', error);
      throw error;
    }
  });

  const batchAssignProducts = async (categoryIds: string[], productIds: string[]) => {
    return batchAssignProductsMutation.mutateAsync({ categoryIds, productIds });
  };

  return {
    categories,
    isLoading,
    isFetching,
    error,
    refetch,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    categoriesWithoutProducts: categoriesWithoutProductsQuery.data,
    categoriesStats: categoriesStatsQuery.data,
    batchAssignProducts,
    isBatchAssigning: batchAssignProductsMutation.isPending,
    batchAssignError: batchAssignProductsMutation.error,
  };
};