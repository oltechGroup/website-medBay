// frontend/src/hooks/useInventory.ts

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// --- INTERFACES ---

export interface ProductLot {
  id: string;
  product_supplier_id: string;
  product_name: string;
  product_code: string;
  product_description?: string;
  supplier_name: string;
  supplier_sku: string;
  product_supplier_name: string;
  lot_number: string;
  expiry_date: string;
  quantity: number;
  price: number;
  status: 'available' | 'near_expiry' | 'expired' | 'equipment'; // ✅ AÑADIDO
  received_at: string;
  created_at: string;
  updated_at: string;
  product_id?: string;
  supplier_id?: string;
  manufacturer_name?: string;
}

export interface SupplierMetrics {
  id: string;
  supplier_name: string;
  unique_products: number;
  active_lots: number;
  total_units: number;
  total_value: number;
  available_lots: number;
  near_expiry_lots: number;
  expired_lots: number;
  equipment_lots?: number; // ✅ AÑADIDO
  total_lots: number;
  last_import: string;
  country_code?: string;
  is_active?: boolean;
}

export interface InventoryDashboard {
  total_lots: number;
  unique_products: number;
  total_suppliers: number;
  total_value: number;
  available_lots: number;
  near_expiry_lots: number;
  expired_lots: number;
  equipment_lots?: number; // ✅ AÑADIDO
  total_units: number;
  last_import: string;
  // NUEVOS CAMPOS: Detalle de última importación
  last_import_supplier?: string;
  last_import_type?: string;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedLots {
  lots: ProductLot[];
  pagination: PaginationMetadata;
}

export interface PaginatedSuppliers {
  suppliers: SupplierMetrics[];
  pagination: PaginationMetadata;
}

export interface LotFilters {
  page?: number;
  limit?: number;
  supplier_id?: string;
  status?: string;
  search?: string;
}

export interface CreateLotData {
  product_supplier_id: string;
  lot_number: string;
  expiry_date: string;
  quantity: number;
  price: number;
  status: 'available' | 'near_expiry' | 'expired' | 'equipment'; // ✅ AÑADIDO
  received_at?: string;
}

// --- HOOK PRINCIPAL ---

export const useInventory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DASHBOARD - MEJORADO
  const getDashboard = useCallback(async (): Promise<InventoryDashboard> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/dashboard');
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error loading dashboard';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // MÉTRICAS POR PROVEEDOR - PAGINADAS
  const getSuppliersMetrics = useCallback(async (params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedSuppliers> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/suppliers-metrics', { params });
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error loading supplier metrics';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // OBTENER LOTES - PAGINACIÓN REAL
  const getLots = useCallback(async (filters: LotFilters = {}): Promise<PaginatedLots> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/lots', { params: filters });
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error loading lots';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // OBTENER LOTE POR ID
  const getLotById = useCallback(async (id: string): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/inventory/lots/${id}`);
      return response.data;
    } catch (err: any) {
      setError('Error loading lot details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // CREAR LOTE
  const createLot = useCallback(async (lotData: CreateLotData): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/inventory/lots', lotData);
      return response.data.lot;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ACTUALIZAR LOTE
  const updateLot = useCallback(async (id: string, lotData: Partial<ProductLot>): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/inventory/lots/${id}`, lotData);
      return response.data.lot;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ELIMINAR LOTE
  const deleteLot = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await api.delete(`/inventory/lots/${id}`);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // CATÁLOGO POR PROVEEDOR Y ESTADO - PAGINADO
  const getCatalogBySupplier = useCallback(async (
    supplierId: string, 
    status: string, 
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedLots> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/inventory/catalog/supplier/${supplierId}/status/${status}`, { params });
      return response.data;
    } catch (err: any) {
      setError('Error loading catalog');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // OBTENER DATOS PARA FORMULARIO CON BÚSQUEDA DINÁMICA
  const getFormData = useCallback(async (search: string = '') => {
    try {
      const response = await api.get('/inventory/form-data', { params: { search } });
      return response.data;
    } catch (err) {
      console.error('Error fetching form data:', err);
      return { products: [], suppliers: [] };
    }
  }, []);

  // CREAR LOTE PARA PRODUCTO EXISTENTE
  const createLotForProduct = useCallback(async (productData: {
    product_id: string;
    supplier_id?: string;
    lot_number: string;
    expiry_date: string;
    quantity: number;
    price: number;
    status: 'available' | 'near_expiry' | 'expired' | 'equipment'; // ✅ AÑADIDO
  }): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      
      const relationResponse = await api.post('/inventory/product-suppliers', {
        product_id: productData.product_id,
        supplier_id: productData.supplier_id
      });
      
      const productSupplierId = relationResponse.data.id;

      const lotData: CreateLotData = {
        product_supplier_id: productSupplierId,
        lot_number: productData.lot_number,
        expiry_date: productData.expiry_date,
        quantity: productData.quantity,
        price: productData.price,
        status: productData.status,
        received_at: new Date().toISOString()
      };

      const response = await api.post('/inventory/lots', lotData);
      return response.data.lot;
    } catch (err: any) {
      setError('Error creating lot for product');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getDashboard,
    getSuppliersMetrics,
    getLots,
    getLotById,
    createLot,
    updateLot,
    deleteLot,
    createLotForProduct,
    getCatalogBySupplier,
    getFormData, 
  };
};