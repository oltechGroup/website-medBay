import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ExpiryCategory {
  id: string;
  name: string;
  description?: string;
  days_threshold: number;
  discount_percentage: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExpiryCategoryData {
  name: string;
  description?: string;
  days_threshold: number;
  discount_percentage: number;
  is_active?: boolean;
  sort_order?: number;
}

export const useExpiryCategories = () => {
  const queryClient = useQueryClient();

  const { 
    data: expiryCategories = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['expiry-categories'],
    queryFn: async (): Promise<ExpiryCategory[]> => {
      try {
        const response = await api.get('/expiry-categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching expiry categories:', error);
        throw error;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (categoryData: CreateExpiryCategoryData) => {
      const response = await api.post('/expiry-categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiry-categories'] });
    },
    onError: (error: any) => {
      console.error('Error creating expiry category:', error);
      throw error;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, categoryData }: { id: string; categoryData: Partial<ExpiryCategory> }) => {
      const response = await api.put(`/expiry-categories/${id}`, categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiry-categories'] });
    },
    onError: (error: any) => {
      console.error('Error updating expiry category:', error);
      throw error;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/expiry-categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiry-categories'] });
    },
    onError: (error: any) => {
      console.error('Error deleting expiry category:', error);
      throw error;
    }
  });

  return {
    expiryCategories,
    isLoading,
    error,
    refetch,
    createExpiryCategory: createMutation.mutateAsync,
    updateExpiryCategory: updateMutation.mutateAsync,
    deleteExpiryCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};