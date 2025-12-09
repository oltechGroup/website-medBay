//frontend/src/hooks/useManufacturers.ts

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface Manufacturer {
  id: string;
  name: string;
  contact_info?: { email?: string; phone?: string; address?: string; contact_person?: string; };
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface ManufacturersResponse {
  success: boolean;
  data: Manufacturer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useManufacturers = (page: number = 1, limit: number = 10, search: string = '') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: response, 
    isLoading, 
    error,
    refetch 
  } = useQuery<ManufacturersResponse>({
    queryKey: ['manufacturers', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (search) params.append('search', search);

      const res = await api.get(`/manufacturers?${params}`);
      return res.data;
    },
    enabled: !!user,
    // CORRECCIÓN V5: Se usa placeholderData con la función importada
    placeholderData: keepPreviousData, 
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await api.post('/manufacturers', data); return res.data.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturers'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => { const res = await api.put(`/manufacturers/${id}`, data); return res.data.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturers'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await api.delete(`/manufacturers/${id}`); return res.data.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['manufacturers'] }); },
  });

  return {
    // CORRECCIÓN TS: Aseguramos valores por defecto seguros
    manufacturers: response?.data || [],
    pagination: response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    isLoading,
    error,
    createManufacturer: createMutation.mutateAsync,
    updateManufacturer: updateMutation.mutateAsync,
    deleteManufacturer: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch,
  };
};

// Hook simple para selects
export const useSuppliersBasic = () => {
  const { user } = useAuth();
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', 'basic'],
    queryFn: async (): Promise<Array<{ id: string; name: string; country_code: string; is_active: boolean }>> => {
      const response = await api.get('/suppliers');
      return response.data.data.map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
        country_code: supplier.country_code,
        is_active: supplier.is_active
      }));
    },
    enabled: !!user,
  });
  return { suppliers: suppliers || [], isLoading };
};