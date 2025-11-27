// frontend/src/hooks/useProducts.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';


export interface Product {
  id: string;
  description: string;
  manufacturer_id: string;
  global_sku: string;
  notes: any;
  created_at: string;
  updated_at: string;
  manufacturer_name?: string;
  categories?: string[];
  category_ids?: string[];
  primary_image?: string;
  image_count?: number;
  category_names?: string[];
  min_price?: number;
  max_price?: number;
  active_lots?: number;
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

export interface ProductStats {
  total_products: number;
  total_images: number;
  products_with_images: number;
  products_without_images: number;
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

export const useProducts = () => {
  const queryClient = useQueryClient();

  // 📋 Obtener todos los productos
  const { 
    data: products = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const response = await api.get('/products');
      return response.data;
    },
    retry: 1,
  });

  // 📊 Obtener estadísticas
  const statsQuery = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: async (): Promise<ProductStats> => {
      const response = await api.get('/products/stats/overview');
      return response.data;
    },
  });

  // 📥 Obtener productos sin imágenes
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
  });

  // 📥 Obtener productos sin categorías
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
  });

  // 🖼️ Obtener imágenes de producto
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

  // ➕ Crear producto
  const createMutation = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      const response = await api.post('/products', productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-images'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-categories'] });
    },
  });

  // ✏️ Actualizar producto
  const updateMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: UpdateProductData }) => {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-categories'] });
    },
  });

  // 🗑️ Eliminar producto
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-images'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-categories'] });
    },
  });

  // 🖼️ Subir imagen individual
  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, formData }: { productId: string; formData: FormData }) => {
      const response = await api.post(`/products/${productId}/images/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-images'] });
    },
  });

  // 📤 Subir múltiples imágenes con metadata
  const uploadImagesWithMetadataMutation = useMutation({
    mutationFn: async ({ productId, formData }: { productId: string; formData: FormData }) => {
      const response = await api.post(`/products/${productId}/images/upload-with-metadata`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-images'] });
    },
  });

  // ⭐ Establecer imagen como principal 
  const setPrimaryImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (!imageId) throw new Error("ID de imagen requerido");
      // Aseguramos que la ruta coincida con productRoutes.js: router.put('/images/:id/primary')
      const response = await api.put(`/products/images/${imageId}/primary`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      console.error("Error setting primary image:", error);
    }
  });

  // 🗑️ Eliminar imagen
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await api.delete(`/products/images/${imageId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-images'] });
    },
  });

  // ✅ NUEVO: Asignación masiva de categorías
  const batchAssignCategoriesMutation = useMutation({
    mutationFn: async (data: BatchAssignCategoriesData) => {
      const response = await api.post('/products/batch/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'without-categories'] });
    },
  });

  // 📤 Exportar
  const exportProductsWithoutImages = async (): Promise<Blob> => {
    const response = await api.get('/products/export/without-images', { responseType: 'blob' });
    return response.data;
  };

  // Wrappers simplificados
  const uploadImage = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('images', file);
    return uploadImageMutation.mutateAsync({ productId, formData });
  };

  const uploadImagesWithMetadata = async (productId: string, formData: FormData) => {
    return uploadImagesWithMetadataMutation.mutateAsync({ productId, formData });
  };

  const setPrimaryImage = async (imageId: string) => {
    return setPrimaryImageMutation.mutateAsync(imageId);
  };

  const deleteImage = async (imageId: string) => {
    return deleteImageMutation.mutateAsync(imageId);
  };

  const batchAssignCategories = async (productIds: string[], categoryIds: string[]) => {
    return batchAssignCategoriesMutation.mutateAsync({ productIds, categoryIds });
  };

  return {
    products,
    stats: statsQuery.data,
    productsWithoutImages: productsWithoutImagesQuery.data,
    productsWithoutCategories: productsWithoutCategoriesQuery.data,
    
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploadingImage: uploadImageMutation.isPending,
    isUploadingImagesWithMetadata: uploadImagesWithMetadataMutation.isPending,
    isSettingPrimary: setPrimaryImageMutation.isPending,
    isDeletingImage: deleteImageMutation.isPending,
    isBatchAssigning: batchAssignCategoriesMutation.isPending,
    
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