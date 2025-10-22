import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCurrencyData {
  code: string;
  name: string;
  symbol: string;
  decimals?: number;
}

// NUEVO: Tipo específico para actualización (sin code)
export interface UpdateCurrencyData {
  name: string;
  symbol: string;
  decimals?: number;
}

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async (): Promise<Currency[]> => {
      const response = await api.get('/currencies');
      return response.data.data;
    },
  });
};

export const useCurrency = (code: string) => {
  return useQuery({
    queryKey: ['currencies', code],
    queryFn: async (): Promise<Currency> => {
      const response = await api.get(`/currencies/${code}`);
      return response.data.data;
    },
    enabled: !!code,
  });
};

export const useCreateCurrency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCurrencyData): Promise<Currency> => {
      const response = await api.post('/currencies', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};

export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();
  
  // ACTUALIZADO: Usar UpdateCurrencyData en lugar de CreateCurrencyData
  return useMutation({
    mutationFn: async ({ code, data }: { code: string; data: UpdateCurrencyData }): Promise<Currency> => {
      const response = await api.put(`/currencies/${code}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};

export const useDeleteCurrency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      await api.delete(`/currencies/${code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};