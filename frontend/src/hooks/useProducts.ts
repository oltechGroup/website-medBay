import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  manufacturer_id: string;
  global_sku: string;
  avalara_tax_code: string;
  requires_license: boolean;
  prescription_required: boolean;
  export_restricted: boolean;
  prohibited_countries: any;
  notes: any;
  created_at: string;
  updated_at: string;
  manufacturer_name?: string;
  categories?: string[]; // Nombres de categorías desde el backend
  // ✅ NUEVO: Para el formulario necesitamos los IDs
  category_ids?: string[];
}

export interface CreateProductData {
  name: string;
  description?: string;
  manufacturer_id?: string;
  global_sku?: string;
  avalara_tax_code?: string;
  requires_license?: boolean;
  prescription_required?: boolean;
  export_restricted?: boolean;
  prohibited_countries?: any;
  notes?: any;
  category_ids?: string[]; // ✅ Añadido para crear producto
}

// ✅ NUEVO: Interfaz específica para actualizar
export interface UpdateProductData {
  name?: string;
  description?: string;
  manufacturer_id?: string;
  global_sku?: string;
  avalara_tax_code?: string;
  requires_license?: boolean;
  prescription_required?: boolean;
  export_restricted?: boolean;
  prohibited_countries?: any;
  notes?: any;
  category_ids?: string[]; // ✅ Añadido para actualizar producto
}

export const useProducts = () => {
  const queryClient = useQueryClient();

  const { 
    data: products = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      try {
        const response = await api.get('/products');
        return response.data;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      const response = await api.post('/products', productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Error creating product:', error);
      throw error;
    }
  });

  // ✅ CORREGIDO: Usar UpdateProductData en lugar de Partial<Product>
  const updateMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: UpdateProductData }) => {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Error updating product:', error);
      throw error;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('Error deleting product:', error);
      throw error;
    }
  });

  return {
    products,
    isLoading,
    error,
    refetch,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};