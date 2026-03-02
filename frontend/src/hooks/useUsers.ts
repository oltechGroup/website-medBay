// frontend/src/hooks/useUsers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- TIPOS DE DATOS ---

// ✅ MODIFICADO: Agregamos 'supplier' a los roles permitidos
export type UserRole = 'admin' | 'sales_agent' | 'business_verified' | 'medical_professional' | 'guest' | 'consumer_basic' | 'supplier';
export type AccountStatus = 'pending' | 'active' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  verification_level: UserRole;
  account_status: AccountStatus;
  referral_code?: string; // Para vendedores
  created_at: string;
  avatar_url?: string;
}

// DTO para crear vendedores y proveedores
export interface CreateUserDTO {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  // ✅ MODIFICADO: Agregamos supplier y los campos opcionales que enviamos desde el form
  role: 'sales_agent' | 'admin' | 'supplier'; 
  referral_code?: string; 
  company_name?: string;
  country?: string;
}

// Filtros para la tabla
interface UseUsersFilters {
  role?: UserRole | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

// --- HOOK PRINCIPAL ---

export const useUsers = (filters: UseUsersFilters = {}) => {
  const queryClient = useQueryClient();
  const { role = 'all', search = '', page = 1, limit = 10 } = filters;

  // 1. OBTENER USUARIOS (Query)
  const { data, isLoading, error } = useQuery({
    // La 'key' incluye los filtros para refetch automático si cambian
    queryKey: ['users', role, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role !== 'all') params.append('role', role);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/users?${params.toString()}`);
      
      return {
        users: (Array.isArray(response.data) ? response.data : response.data.data) as User[],
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de caché fresco
  });

  // 2. CREAR USUARIO STAFF/SUPPLIER (Mutation)
  const createUserMutation = useMutation({
    mutationFn: async (newUser: CreateUserDTO) => {
      const response = await api.post('/users/create-staff', newUser);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // 3. ACTUALIZAR ESTADO (Mutation)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AccountStatus }) => {
      const response = await api.put(`/users/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // 4. ELIMINAR USUARIO (Mutation)
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Helpers de UI para etiquetas
  // ✅ MODIFICADO: Textos en inglés y caso para 'supplier' agregado
  const getRoleLabel = (role: UserRole | string) => {
    switch (role) {
      case 'admin': return { label: 'Admin', color: 'bg-purple-100 text-purple-700' };
      case 'sales_agent': return { label: 'Sales Agent', color: 'bg-indigo-100 text-indigo-700' };
      case 'medical_professional': return { label: 'Doctor', color: 'bg-blue-100 text-blue-700' };
      case 'business_verified': return { label: 'Business', color: 'bg-emerald-100 text-emerald-700' };
      case 'supplier': return { label: 'Supplier', color: 'bg-teal-100 text-teal-700' };
      default: return { label: 'User', color: 'bg-gray-100 text-gray-600' };
    }
  };

  // ✅ MODIFICADO: Textos en inglés
  const getStatusLabel = (status: AccountStatus | string) => {
    switch (status) {
      case 'active': return { label: 'Active', color: 'bg-green-100 text-green-700' };
      case 'pending': return { label: 'Pending', color: 'bg-amber-100 text-amber-700' };
      case 'rejected': return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
      case 'suspended': return { label: 'Suspended', color: 'bg-slate-100 text-slate-700' };
      default: return { label: status, color: 'bg-gray-100' };
    }
  };

  return {
    // Datos
    users: data?.users || [],
    pagination: {
      total: data?.total || 0,
      totalPages: data?.totalPages || 1,
      currentPage: page,
    },
    
    // Estados
    isLoading,
    isError: !!error,
    error,

    // Acciones
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,

    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,

    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,

    // Helpers
    getRoleLabel,
    getStatusLabel
  };
};