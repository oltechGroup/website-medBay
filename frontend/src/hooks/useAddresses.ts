// frontend/src/hooks/useAddresses.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Address {
  id: string;
  user_id: string;
  address_type: 'billing' | 'shipping';
  street: string;
  street_number: string;
  suite_number?: string;
  colony?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  between_streets?: string;
  reference_point?: string;
  is_fiscal: boolean;
  created_at: string;
}

export interface CreateAddressData {
  address_type: 'billing' | 'shipping';
  street: string;
  street_number: string;
  suite_number?: string;
  colony?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  between_streets?: string;
  reference_point?: string;
}

export const useAddresses = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER DIRECCIONES
  const { data: addresses = [], isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: async (): Promise<Address[]> => {
      const response = await api.get('/addresses');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  // 2. CREAR DIRECCIÓN
  const createMutation = useMutation({
    mutationFn: async (newData: CreateAddressData) => {
      const response = await api.post('/addresses', newData);
      return response.data;
    },
    onSuccess: () => {
      // Recargar la lista automáticamente
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  // 3. ELIMINAR DIRECCIÓN
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/addresses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  // Helpers para filtrar en la UI
  const shippingAddresses = addresses.filter(a => a.address_type === 'shipping');
  const billingAddresses = addresses.filter(a => a.address_type === 'billing' || a.is_fiscal);

  return {
    addresses,
    shippingAddresses,
    billingAddresses,
    isLoading,
    error,
    
    addAddress: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    
    deleteAddress: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};