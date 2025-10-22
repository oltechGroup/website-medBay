import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface Supplier {
  id: string;
  name: string;
  tax_id?: string;
  country_id?: string;
  currency_id?: string;
  contact_info?: {
    telefono?: string;
    email?: string;
    persona_contacto?: string;
    direccion?: string;
  };
  // ✅ NUEVO: Campos relacionados desde los joins
  country_name?: string;
  country_code?: string;
  currency_name?: string;
  currency_symbol?: string;
  created_at: string;
}

export interface CreateSupplierData {
  name: string;
  tax_id?: string;
  country_id?: string;     // ✅ NUEVO: Relación a países
  currency_id?: string;    // ✅ NUEVO: Relación a monedas
  contact_info?: {
    telefono?: string;
    email?: string;
    persona_contacto?: string;
    direccion?: string;
  };
}

export interface UpdateSupplierData {
  name: string;
  tax_id?: string;
  country_id?: string;     // ✅ NUEVO: Relación a países
  currency_id?: string;    // ✅ NUEVO: Relación a monedas
  contact_info?: {
    telefono?: string;
    email?: string;
    persona_contacto?: string;
    direccion?: string;
  };
}

export const useSuppliers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener todos los proveedores
  const { data: suppliers, isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const response = await api.get('/suppliers');
      return response.data.data; // ✅ ACTUALIZADO: Ahora la respuesta está en `data`
    },
    enabled: !!user,
  });

  // Crear proveedor
  const createMutation = useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      const response = await api.post('/suppliers', data);
      return response.data.data; // ✅ ACTUALIZADO: Ahora la respuesta está en `data`
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  // Actualizar proveedor
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierData }) => {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data.data; // ✅ ACTUALIZADO: Ahora la respuesta está en `data`
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  // Eliminar proveedor
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data.data; // ✅ ACTUALIZADO: Ahora la respuesta está en `data`
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  return {
    suppliers,
    isLoading,
    error,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};