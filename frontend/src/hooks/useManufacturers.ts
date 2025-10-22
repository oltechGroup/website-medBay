import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface Manufacturer {
  id: string;
  name: string;
  country?: string;
  country_id?: string;
  country_name?: string;
  country_code?: string;
  created_at: string;
}

export interface CreateManufacturerData {
  name: string;
  country_id?: string;
}

export interface UpdateManufacturerData {
  name: string;
  country_id?: string;
}

export const useManufacturers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener todos los fabricantes
  const { data: manufacturers, isLoading, error } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: async (): Promise<Manufacturer[]> => {
      const response = await api.get('/manufacturers');
      return response.data;
    },
    enabled: !!user,
  });

  // Crear fabricante
  const createMutation = useMutation({
    mutationFn: async (data: CreateManufacturerData) => {
      const response = await api.post('/manufacturers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
    },
  });

  // Actualizar fabricante
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateManufacturerData }) => {
      const response = await api.put(`/manufacturers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
    },
  });

  return {
    manufacturers,
    isLoading,
    error,
    createManufacturer: createMutation.mutateAsync,
    updateManufacturer: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};