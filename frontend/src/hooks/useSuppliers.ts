import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Supplier {
  id: string;
  name: string;
  tax_id?: string;
  country?: string;
  default_currency?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
    contact_person?: string;
  };
  created_at: string;
}

export interface CreateSupplierData {
  name: string;
  tax_id?: string;
  country?: string;
  default_currency?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
    contact_person?: string;
  };
}

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  const { 
    data: suppliers = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      try {
        const response = await api.get('/suppliers');
        return response.data;
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        throw error;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (supplierData: CreateSupplierData) => {
      const response = await api.post('/suppliers', supplierData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: any) => {
      console.error('Error creating supplier:', error);
      throw error;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, supplierData }: { id: string; supplierData: Partial<Supplier> }) => {
      const response = await api.put(`/suppliers/${id}`, supplierData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: any) => {
      console.error('Error updating supplier:', error);
      throw error;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: any) => {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  });

  return {
    suppliers,
    isLoading,
    error,
    refetch,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};


