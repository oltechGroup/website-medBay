// frontend/src/hooks/useCategories.ts
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- INTERFACES ---
export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
  parent_name?: string;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCategoryData {
  name: string;
  parent_id?: string;
  description?: string;
}

export interface CategoryStats {
  total_categories: number;
  categories_with_products: number;
  categories_without_products: number;
}

interface UseCategoriesParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

export const useCategories = (params?: UseCategoriesParams) => {
  const queryClient = useQueryClient();

  // Valores por defecto para la paginación
  const page = params?.page;
  const limit = params?.limit || 20;
  const searchTerm = params?.searchTerm || '';

  // 1. 🌳 CONSULTA PARA EL ÁRBOL (Trae todo el catálogo sin paginar)
  // Se usa para CategoryTree.tsx porque necesita la estructura completa.
  const fullCategoriesQuery = useQuery({
    queryKey: ['categories', 'full-list'],
    queryFn: async (): Promise<Category[]> => {
      const response = await api.get('/categories');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos (la estructura no cambia seguido)
  });

  // 2. 📋 CONSULTA PAGINADA (Para la Tabla de gestión)
  // Solo se activa si se pasa el parámetro 'page'.
  const paginatedQuery = useQuery({
    queryKey: ['categories', 'paginated', page, limit, searchTerm],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (searchTerm) queryParams.append('search', searchTerm);

      const response = await api.get(`/categories?${queryParams.toString()}`);
      return response.data;
    },
    enabled: !!page, // Solo se ejecuta si hay intención de paginar
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  // 📊 Estadísticas (Actualizado con staleTime)
  const statsQuery = useQuery({
    queryKey: ['categories', 'stats'],
    queryFn: async (): Promise<CategoryStats> => {
      const response = await api.get('/categories/stats/overview');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // --- MUTACIONES (Simplificadas y Reforzadas) ---

  const createMutation = useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const response = await api.post('/categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidamos todas las queries relacionadas para refrescar árbol, tabla y stats
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, categoryData }: { id: string; categoryData: Partial<Category> }) => {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // --- RETORNO DE DATOS ---

  return {
    // Si estamos en modo paginado, devolvemos las categorías de la página, si no, la lista completa
    categories: page ? (paginatedQuery.data?.categories || []) : fullCategoriesQuery.data || [],
    fullCategories: fullCategoriesQuery.data || [], // Siempre disponible para el TreeView
    
    pagination: paginatedQuery.data?.pagination || {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    },
    
    stats: statsQuery.data,
    
    isLoading: fullCategoriesQuery.isLoading || paginatedQuery.isLoading || statsQuery.isLoading,
    isFetching: fullCategoriesQuery.isFetching || paginatedQuery.isFetching,
    isPlaceholderData: paginatedQuery.isPlaceholderData,
    
    error: fullCategoriesQuery.error || paginatedQuery.error,
    
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    
    refetch: () => {
      fullCategoriesQuery.refetch();
      if (page) paginatedQuery.refetch();
      statsQuery.refetch();
    }
  };
};