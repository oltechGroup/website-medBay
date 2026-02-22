//frontend/src/hooks/useProducts.ts
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- INTERFACES --- (Se mantienen igual)
export interface Product {
  id: string;
  description: string;
  manufacturer_id: string;
  global_sku: string;
  notes: any;
  created_at: string;
  updated_at: string;
  manufacturer_name?: string;
  image_count?: number;
  primary_image?: string;
  category_ids?: string[];
  category_names?: string[];
  min_price?: number;
  max_price?: number;
  active_lots?: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductStats {
  total_products: number;
  products_with_images: number;
  products_without_images: number;
  with_categories: number;
  without_categories: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_name: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  description: string;
  manufacturer_id?: string;
  global_sku?: string;
  notes?: any;
  category_ids?: string[];
}

export interface UpdateProductData {
  description?: string;
  manufacturer_id?: string;
  global_sku?: string;
  notes?: any;
  category_ids?: string[];
}

export interface BatchAssignCategoriesData {
  productIds: string[];
  categoryIds: string[];
}

interface UseProductsParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  hasImages?: 'all' | 'with' | 'without';
  manufacturerId?: string;
  categoryId?: string;
  categoryStatus?: 'all' | 'uncategorized' | 'categorized'; 
  status?: string; 
  minPrice?: number | string; // Permitir string para manejar inputs vacíos
  maxPrice?: number | string;
  sortBy?: string;
}

export const useProducts = (params?: UseProductsParams) => {
  const queryClient = useQueryClient();

  // Valores por defecto
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const searchTerm = params?.searchTerm || '';
  const hasImages = params?.hasImages || 'all';
  const manufacturerId = params?.manufacturerId || '';
  const categoryId = params?.categoryId || '';
  const categoryStatus = params?.categoryStatus || 'all';
  const status = params?.status || 'all';
  const minPrice = params?.minPrice;
  const maxPrice = params?.maxPrice;
  const sortBy = params?.sortBy || 'newest';

  const { 
    data: responseData, 
    isLoading, 
    isFetching, 
    isPlaceholderData, // 🟢 IMPORTANTE: Para saber si estamos viendo datos de la página anterior
    error,
    refetch 
  } = useQuery({
    queryKey: ['products', page, limit, searchTerm, hasImages, manufacturerId, categoryId, categoryStatus, status, minPrice, maxPrice, sortBy],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (searchTerm) queryParams.append('search', searchTerm);
      if (hasImages !== 'all') queryParams.append('hasImages', hasImages);
      if (manufacturerId) queryParams.append('manufacturerId', manufacturerId);
      if (categoryId) queryParams.append('categoryId', categoryId);
      if (categoryStatus !== 'all') queryParams.append('categoryStatus', categoryStatus);
      if (status !== 'all') queryParams.append('status', status);
      
      // Limpieza de precios para evitar enviar strings vacíos
      if (minPrice !== undefined && minPrice !== '') queryParams.append('minPrice', minPrice.toString());
      if (maxPrice !== undefined && maxPrice !== '') queryParams.append('maxPrice', maxPrice.toString());
      if (sortBy) queryParams.append('sortBy', sortBy);

      const response = await api.get(`/products?${queryParams.toString()}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // ⚡ 5 minutos de caché: Hace la navegación entre páginas instantánea
  });

  const products: Product[] = responseData?.products || [];
  const pagination: PaginationMetadata = responseData?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  };

  // 📊 Estadísticas (Optimizado con staleTime)
  const statsQuery = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: async (): Promise<ProductStats> => {
      const response = await api.get('/products/stats/overview');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // Las estadísticas no necesitan refrescarse cada segundo
  });

  // --- El resto de las queries y mutaciones se mantienen igual para no romper funcionalidades ---
  
  const productsWithoutImagesQuery = useQuery({
    queryKey: ['products', 'without-images'],
    queryFn: async (): Promise<Product[]> => {
      try {
        const response = await api.get('/products/export/without-images');
        return response.data.products || [];
      } catch (error) {
        console.error('Error fetching products without images:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, 
  });

  const productsWithoutCategoriesQuery = useQuery({
    queryKey: ['products', 'without-categories'],
    queryFn: async (): Promise<Product[]> => {
      try {
        const response = await api.get('/products/filters/without-categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching products without categories:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const getProductImages = async (productId: string): Promise<ProductImage[]> => {
    if (!productId) return [];
    try {
      const response = await api.get(`/products/${productId}/images`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
  };

  // --- MUTACIONES --- (Se mantienen intactas para preservar la lógica de negocio)
  const createMutation = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      const response = await api.post('/products', productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: UpdateProductData }) => {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] });
    },
  });

  // Mutaciones de imágenes
  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, formData }: { productId: string; formData: FormData }) => {
      const response = await api.post(`/products/${productId}/images/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); },
  });

  const uploadImagesWithMetadataMutation = useMutation({
    mutationFn: async ({ productId, formData }: { productId: string; formData: FormData }) => {
      const response = await api.post(`/products/${productId}/images/upload-with-metadata`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); },
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (!imageId) throw new Error("ID de imagen requerido");
      const response = await api.put(`/products/images/${imageId}/primary`);
      return response.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await api.delete(`/products/images/${imageId}`);
      return response.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); },
  });

  const batchAssignCategoriesMutation = useMutation({
    mutationFn: async (data: BatchAssignCategoriesData) => {
      const response = await api.post('/products/batch/categories', data);
      return response.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); },
  });

  // Wrappers de métodos
  const uploadImage = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('images', file);
    return uploadImageMutation.mutateAsync({ productId, formData });
  };

  const uploadImagesWithMetadata = async (productId: string, formData: FormData) => {
    return uploadImagesWithMetadataMutation.mutateAsync({ productId, formData });
  };

  const setPrimaryImage = async (imageId: string) => setPrimaryImageMutation.mutateAsync(imageId);
  const deleteImage = async (imageId: string) => deleteImageMutation.mutateAsync(imageId);
  const batchAssignCategories = async (productIds: string[], categoryIds: string[]) => batchAssignCategoriesMutation.mutateAsync({ productIds, categoryIds });
  
  const exportProductsWithoutImages = async (): Promise<Blob> => {
    const response = await api.get('/products/export/without-images', { responseType: 'blob' });
    return response.data;
  };

  return {
    products,
    pagination,
    stats: statsQuery.data,
    productsWithoutImages: productsWithoutImagesQuery.data,
    productsWithoutCategories: productsWithoutCategoriesQuery.data,
    
    isLoading,
    isFetching,
    isPlaceholderData, // 🟢 Exportado para que la UI pueda dar feedback visual
    isProductsWithoutImagesLoading: productsWithoutImagesQuery.isLoading,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploadingImage: uploadImageMutation.isPending,
    isUploadingImagesWithMetadata: uploadImagesWithMetadataMutation.isPending,
    isSettingPrimary: setPrimaryImageMutation.isPending,
    isDeletingImage: deleteImageMutation.isPending,
    isBatchAssigning: batchAssignCategoriesMutation.isPending,
    
    error,
    createError: createMutation.error,
    updateError: updateMutation.error,
    batchAssignError: batchAssignCategoriesMutation.error,
    
    refetch,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    getProductImages,
    uploadImage,
    uploadImagesWithMetadata,
    setPrimaryImage,
    deleteImage,
    batchAssignCategories,
    exportProductsWithoutImages,
  };
};