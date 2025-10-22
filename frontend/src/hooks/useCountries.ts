import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Country {
  code: string;
  name: string;
  currency_code: string;
  tax_rules: any;
  created_at: string;
  updated_at: string;
  currency_name?: string;
  currency_symbol?: string;
}

export interface CreateCountryData {
  code: string;
  name: string;
  currency_code: string;
  tax_rules?: any;
}

// NUEVO: Tipo específico para actualización (sin code)
export interface UpdateCountryData {
  name: string;
  currency_code: string;
  tax_rules?: any;
}

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async (): Promise<Country[]> => {
      const response = await api.get('/countries');
      return response.data.data;
    },
  });
};

export const useCountry = (code: string) => {
  return useQuery({
    queryKey: ['countries', code],
    queryFn: async (): Promise<Country> => {
      const response = await api.get(`/countries/${code}`);
      return response.data.data;
    },
    enabled: !!code,
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCountryData): Promise<Country> => {
      const response = await api.post('/countries', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();
  
  // ACTUALIZADO: Usar UpdateCountryData en lugar de CreateCountryData
  return useMutation({
    mutationFn: async ({ code, data }: { code: string; data: UpdateCountryData }): Promise<Country> => {
      const response = await api.put(`/countries/${code}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      await api.delete(`/countries/${code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};