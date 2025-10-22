import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AvalaraTaxCode {
  id: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAvalaraTaxCodeData {
  code: string;
  description: string;
}

// NUEVO: Tipo específico para actualización (sin id)
export interface UpdateAvalaraTaxCodeData {
  code: string;
  description: string;
}

export const useAvalaraTaxCodes = () => {
  return useQuery({
    queryKey: ['avalara-tax-codes'],
    queryFn: async (): Promise<AvalaraTaxCode[]> => {
      const response = await api.get('/avalara-tax-codes');
      return response.data.data;
    },
  });
};

export const useAvalaraTaxCode = (id: string) => {
  return useQuery({
    queryKey: ['avalara-tax-codes', id],
    queryFn: async (): Promise<AvalaraTaxCode> => {
      const response = await api.get(`/avalara-tax-codes/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateAvalaraTaxCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAvalaraTaxCodeData): Promise<AvalaraTaxCode> => {
      const response = await api.post('/avalara-tax-codes', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avalara-tax-codes'] });
    },
  });
};

export const useUpdateAvalaraTaxCode = () => {
  const queryClient = useQueryClient();
  
  // ACTUALIZADO: Usar UpdateAvalaraTaxCodeData
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAvalaraTaxCodeData }): Promise<AvalaraTaxCode> => {
      const response = await api.put(`/avalara-tax-codes/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avalara-tax-codes'] });
    },
  });
};

export const useDeleteAvalaraTaxCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/avalara-tax-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avalara-tax-codes'] });
    },
  });
};