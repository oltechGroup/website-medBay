//frontend/src/hooks/useSuppliers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface Supplier {
  id: string;
  name: string;
  country_code: string;
  contact_info?: {
    telefono?: string;
    email?: string;
    persona_contacto?: string;
    direccion?: string;
    website?: string;
    notas?: string;
  };
  is_active: boolean;
  country_name?: string;
  currency_code?: string;
  currency_name?: string;
  currency_symbol?: string;
  exchange_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  country_code: string;
  contact_info?: {
    telefono?: string;
    email?: string;
    persona_contacto?: string;
    direccion?: string;
    website?: string;
    notas?: string;
  };
  is_active?: boolean;
}

export interface UpdateSupplierData {
  name: string;
  country_code: string;
  contact_info?: {
    telefono?: string;
    email?: string;
    persona_contacto?: string;
    direccion?: string;
    website?: string;
    notas?: string;
  };
  is_active?: boolean;
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  byCountry: Array<{
    country_code: string;
    country_name: string;
    supplier_count: number;
  }>;
}

export const useSuppliers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: suppliers, 
    isLoading, 
    error,
    refetch: refetchSuppliers 
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      try {
        const response = await api.get('/suppliers');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['suppliers', 'stats'],
    queryFn: async (): Promise<SupplierStats> => {
      try {
        const response = await api.get('/suppliers/stats');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching supplier stats:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      const response = await api.post('/suppliers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'stats'] });
    },
    onError: (error: any) => {
      console.error('Error creating supplier:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierData }) => {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'stats'] });
    },
    onError: (error: any) => {
      console.error('Error updating supplier:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'stats'] });
    },
    onError: (error: any) => {
      console.error('Error deleting supplier:', error);
    }
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers', 'stats'] });
  };

  return {
    suppliers: suppliers || [],
    stats,
    isLoading,
    isLoadingStats,
    error,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch,
  };
};

export const useSuppliersBasic = () => {
  const { user } = useAuth();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', 'basic'],
    queryFn: async (): Promise<Array<{ id: string; name: string; country_code: string; is_active: boolean }>> => {
      const response = await api.get('/suppliers');
      return response.data.data.map((supplier: Supplier) => ({
        id: supplier.id,
        name: supplier.name,
        country_code: supplier.country_code,
        is_active: supplier.is_active // AÑADIDO: Clave para el filtro
      }));
    },
    enabled: !!user,
  });

  return {
    suppliers: suppliers || [],
    isLoading
  };
};