import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  slug?: string;
  description?: string;
  created_at: string;
  parent_name?: string;
}

export interface CreateCategoryData {
  name: string;
  parent_id?: string;
  slug?: string;
  description?: string;
}

export const useCategories = () => {
  const queryClient = useQueryClient();

  const { 
    data: categories = [], 
    isLoading, 
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

  return {
    categories,
    isLoading,
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
  };
};