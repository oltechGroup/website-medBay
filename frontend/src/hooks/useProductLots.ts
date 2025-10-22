import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ProductLot {
  id: string;
  product_supplier_id: string;
  lot_number: string;
  expiry_date: string;
  quantity: number;
  unit: string;
  price_amount: number;
  price_currency: string;
  discount_price_amount: number;
  discount_price_currency: string;
  sales_category: 'regular' | 'near_expiry' | 'expired';
  manual_discount: boolean;
  received_at: string;
  status: 'available' | 'reserved' | 'expired' | 'near_expiry' | 'quarantine';
  expiry_category_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Campos relacionados (expandidos)
  product_name?: string;
  supplier_name?: string;
  expiry_category_name?: string;
}

export interface CreateProductLotData {
  product_supplier_id: string;
  lot_number: string;
  expiry_date: string;
  quantity: number;
  unit: string;
  price_amount: number;
  price_currency: string;
  discount_price_amount?: number;
  discount_price_currency?: string;
  sales_category?: 'regular' | 'near_expiry' | 'expired';
  manual_discount?: boolean;
  received_at?: string;
  status?: 'available' | 'reserved' | 'expired' | 'near_expiry' | 'quarantine';
  expiry_category_id?: string;
}

export const useProductLots = () => {
  const queryClient = useQueryClient();

  const { 
    data: productLots = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['product-lots'],
    queryFn: async (): Promise<ProductLot[]> => {
      try {
        const response = await api.get('/product-lots');
        return response.data;
      } catch (error) {
        console.error('Error fetching product lots:', error);
        throw error;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (lotData: CreateProductLotData) => {
      const response = await api.post('/product-lots', lotData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lots'] });
    },
    onError: (error: any) => {
      console.error('Error creating product lot:', error);
      throw error;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, lotData }: { id: string; lotData: Partial<ProductLot> }) => {
      const response = await api.put(`/product-lots/${id}`, lotData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lots'] });
    },
    onError: (error: any) => {
      console.error('Error updating product lot:', error);
      throw error;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/product-lots/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lots'] });
    },
    onError: (error: any) => {
      console.error('Error deleting product lot:', error);
      throw error;
    }
  });

  return {
    productLots,
    isLoading,
    error,
    refetch,
    createProductLot: createMutation.mutateAsync,
    updateProductLot: updateMutation.mutateAsync,
    deleteProductLot: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};