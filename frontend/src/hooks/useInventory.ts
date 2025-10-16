// src/hooks/useInventory.ts - VERSIÓN COMPLETA CON CREATE_LOT_FOR_PRODUCT
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface ExpiryCategory {
  id: string;
  name: string;
  days_threshold: number;
  discount_percentage: number;
  is_active: boolean;
}

export interface ProductLot {
  id: string | null;  // Cambiado a null para productos sin lote
  lot_number: string | null;
  expiry_date: string | null;
  status: 'available' | 'reserved' | 'expired' | 'near_expiry' | 'quarantine';
  sales_category: 'regular' | 'near_expiry' | 'expired';
  discount_price_amount?: number;
  manual_discount: boolean;
  expiry_category_id?: string;
  
  // Campos de relaciones - NOMBRES EXACTOS de la consulta SQL
  product_id: string;
  product_name: string;
  product_code: string;
  product_description?: string;
  product_price?: number;
  manufacturer_name?: string;
  supplier_name?: string;
  
  // Inventory - NOMBRE EXACTO de la consulta SQL
  quantity_on_hand: number;
  
  // Expiry category
  expiry_category_name?: string;
  discount_percentage?: number;

  // ⬇️⬇️⬇️ PROPIEDAD AGREGADA PARA PRODUCTOS SIN LOTE ⬇️⬇️⬇️
  record_type: 'has_lot' | 'no_lot';
}

export interface InventoryAdjustment {
  lot_id: string;
  adjustment: number;
  reason: string;
  adjusted_by: string;
}

export interface CreateLotData {
  product_id: string;
  lot_number: string;
  expiry_date?: string;
  quantity?: number;
  supplier_id?: string;
}

export function useInventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener todos los lotes con inventario - USAMOS LA NUEVA RUTA
  const { data: lots, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory/lots-complete');
      return response.data as ProductLot[];
    },
    enabled: !!user,
  });

  // Obtener categorías de expiración
  const { data: expiryCategories } = useQuery({
    queryKey: ['expiry-categories'],
    queryFn: async () => {
      const response = await api.get('/inventory/expiry-categories');
      return response.data as ExpiryCategory[];
    },
    enabled: !!user,
  });

  // Filtrar lotes activos
  const activeLots = lots?.filter(lot => 
    ['available', 'reserved', 'near_expiry', 'quarantine'].includes(lot.status)
  ) || [];

  // Filtrar lotes vencidos
  const expiredLots = lots?.filter(lot => 
    lot.status === 'expired'
  ) || [];

  // Mutación para ajustar inventario
  const adjustInventoryMutation = useMutation({
    mutationFn: async (adjustment: InventoryAdjustment) => {
      const response = await api.post('/inventory/adjustments', adjustment);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Mutación para actualizar estado del lote - USA LA NUEVA RUTA
  const updateLotStatusMutation = useMutation({
    mutationFn: async ({ lotId, status }: { lotId: string; status: ProductLot['status'] }) => {
      const response = await api.patch(`/inventory/lots/${lotId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Mutación para actualizar categoría de expiración - USA LA NUEVA RUTA
  const updateExpiryCategoryMutation = useMutation({
    mutationFn: async ({ lotId, expiryCategoryId }: { lotId: string; expiryCategoryId?: string }) => {
      const response = await api.patch(`/inventory/lots/${lotId}/expiry-category`, { 
        expiry_category_id: expiryCategoryId 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // ⬇️⬇️⬇️ NUEVA MUTACIÓN PARA CREAR LOTE PARA PRODUCTO SIN LOTE ⬇️⬇️⬇️
  const createLotForProductMutation = useMutation({
    mutationFn: async (lotData: CreateLotData) => {
      const response = await api.post('/inventory/create-lot-for-product', lotData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      console.error('Error creating lot:', error);
      throw error;
    }
  });

  return {
    // Datos
    lots: lots || [],
    activeLots,
    expiredLots,
    expiryCategories,
    
    // Estados
    isLoading,
    error,
    refetch,
    
    // Acciones
    adjustInventory: adjustInventoryMutation.mutateAsync,
    isAdjusting: adjustInventoryMutation.isPending,
    updateLotStatus: updateLotStatusMutation.mutateAsync,
    isUpdatingStatus: updateLotStatusMutation.isPending,
    updateExpiryCategory: updateExpiryCategoryMutation.mutateAsync,
    isUpdatingCategory: updateExpiryCategoryMutation.isPending,
    
    // ⬇️⬇️⬇️ NUEVAS ACCIONES PARA CREAR LOTES ⬇️⬇️⬇️
    createLotForProduct: createLotForProductMutation.mutateAsync,
    isCreatingLot: createLotForProductMutation.isPending,
  };
}