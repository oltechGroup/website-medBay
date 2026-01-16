// frontend/src/hooks/useCountries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// ✅ CAMBIO 1: Importamos axios directo para peticiones públicas sin token
import axios from 'axios';

// ✅ CAMBIO 2: Definimos la URL base para evitar usar la instancia 'api' en rutas públicas
const API_URL = 'https://api.medbaysupply.com/api';

export interface Country {
  code: string;
  name: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  currency_decimals: number;
  exchange_rate: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCountryData {
  code: string;
  name: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  currency_decimals: number;
  exchange_rate: number;
}

export interface UpdateCountryData {
  name: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  currency_decimals: number;
  exchange_rate: number;
}

export interface CountriesResponse {
  success: boolean;
  data: Country[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CountryStats {
  totalCountries: number;
  totalCurrencies: number;
  averageExchangeRate: number;
  minExchangeRate: number;
  maxExchangeRate: number;
}

// Hook principal para obtener países con paginación y búsqueda
// ✅ CAMBIO: Usamos axios.get para evitar error 401 si hay un token basura
export const useCountries = (page: number = 1, limit: number = 10, search: string = '') => {
  return useQuery({
    queryKey: ['countries', page, limit, search],
    queryFn: async (): Promise<CountriesResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await axios.get(`${API_URL}/countries?${params}`);
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

// Hook para obtener estadísticas de países
// ✅ CAMBIO: Usamos axios.get
export const useCountryStats = () => {
  return useQuery({
    queryKey: ['countries', 'stats'],
    queryFn: async (): Promise<{ success: boolean; data: CountryStats }> => {
      const response = await axios.get(`${API_URL}/countries/stats`);
      return response.data;
    },
  });
};

// Hook para obtener un país específico
// ✅ CAMBIO: Usamos axios.get
export const useCountry = (code: string) => {
  return useQuery({
    queryKey: ['countries', code],
    queryFn: async (): Promise<{ success: boolean; data: Country }> => {
      const response = await axios.get(`${API_URL}/countries/${code}`);
      return response.data;
    },
    enabled: !!code,
  });
};

// Hook para obtener países por moneda
// ✅ CAMBIO: Usamos axios.get
export const useCountriesByCurrency = (currencyCode: string) => {
  return useQuery({
    queryKey: ['countries', 'currency', currencyCode],
    queryFn: async (): Promise<{ success: boolean; data: Country[] }> => {
      const response = await axios.get(`${API_URL}/countries/currency/${currencyCode}`);
      return response.data;
    },
    enabled: !!currencyCode,
  });
};

// Hook para crear país
// 🔒 MANTENEMOS 'api' porque requiere Auth
export const useCreateCountry = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (data: CreateCountryData): Promise<{ success: boolean; data: Country }> => {
      const response = await api.post('/countries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });

  return {
    createCountry: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error
  };
};

// Hook para actualizar país
// 🔒 MANTENEMOS 'api' porque requiere Auth
export const useUpdateCountry = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async ({ code, data }: { code: string; data: UpdateCountryData }): Promise<{ success: boolean; data: Country }> => {
      const response = await api.put(`/countries/${code}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      queryClient.invalidateQueries({ queryKey: ['countries', variables.code] });
    },
  });

  return {
    updateCountry: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error
  };
};

// Hook para eliminar país
// 🔒 MANTENEMOS 'api' porque requiere Auth
export const useDeleteCountry = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (code: string): Promise<{ success: boolean; message: string }> => {
      const response = await api.delete(`/countries/${code}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });

  return {
    deleteCountry: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error
  };
};

// Hook para obtener países básicos (sin paginación, para selects)
// ✅ CAMBIO CRÍTICO: Usamos axios.get para el registro
export const useCountriesBasic = () => {
  return useQuery({
    queryKey: ['countries', 'basic'],
    queryFn: async (): Promise<Country[]> => {
      // Petición limpia sin Header Authorization
      const response = await axios.get(`${API_URL}/countries?limit=1000`);
      return response.data.data;
    },
    select: (data) => data.map(country => ({
      code: country.code,
      name: country.name,
      currency_code: country.currency_code,
      currency_symbol: country.currency_symbol
    }))
  });
};