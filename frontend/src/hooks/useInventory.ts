// frontend/src/hooks/useInventory.ts

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ✅ TIPOS ACTUALIZADOS - SIN unit
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
  status: 'available' | 'near_expiry' | 'expired';
  received_at: string;
  created_at: string;
  updated_at: string;
  // ✅ CAMPOS NUEVOS PARA INTEGRACIÓN
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
  total_lots: number;
  last_import: string;
  // ✅ CAMPOS NUEVOS PARA INTEGRACIÓN
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
  total_units: number;
  last_import: string;
}

export interface LotFilters {
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
  status: 'available' | 'near_expiry' | 'expired';
  received_at?: string;
}

export const useInventory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ DASHBOARD
  const getDashboard = useCallback(async (): Promise<InventoryDashboard> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/dashboard');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ MÉTRICAS POR PROVEEDOR (SOLO ACTIVOS)
  const getSuppliersMetrics = useCallback(async (): Promise<SupplierMetrics[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/suppliers-metrics');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar métricas de proveedores');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ OBTENER TODOS LOS LOTES (CON FILTROS)
  const getLots = useCallback(async (filters: LotFilters = {}): Promise<ProductLot[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/lots', { params: filters });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar lotes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ OBTENER LOTE POR ID
  const getLotById = useCallback(async (id: string): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/inventory/lots/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el lote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CREAR LOTE - SIN unit
  const createLot = useCallback(async (lotData: CreateLotData): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/inventory/lots', lotData);
      return response.data.lot;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el lote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ACTUALIZAR LOTE
  const updateLot = useCallback(async (id: string, lotData: Partial<ProductLot>): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/inventory/lots/${id}`, lotData);
      return response.data.lot;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el lote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ELIMINAR LOTE
  const deleteLot = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/inventory/lots/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar el lote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CATÁLOGO POR PROVEEDOR Y ESTADO
  const getCatalogBySupplier = useCallback(async (supplierId: string, status: string): Promise<ProductLot[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/inventory/catalog/supplier/${supplierId}/status/${status}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el catálogo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CREAR LOTE PARA PRODUCTO EXISTENTE (INTEGRACIÓN CON PRODUCTOS) - SIN unit
  const createLotForProduct = useCallback(async (productData: {
    product_id: string;
    supplier_id?: string;
    lot_number: string;
    expiry_date: string;
    quantity: number;
    price: number;
    status: 'available' | 'near_expiry' | 'expired';
  }): Promise<ProductLot> => {
    try {
      setLoading(true);
      setError(null);
      
      // Primero buscar o crear la relación product_supplier
      let productSupplierId = productData.supplier_id;
      
      if (!productSupplierId) {
        // Buscar relación existente o crear una por defecto
        const supplierResponse = await api.get('/suppliers?active=true');
        const activeSuppliers = supplierResponse.data.data || [];
        
        if (activeSuppliers.length > 0) {
          productSupplierId = activeSuppliers[0].id;
        }
      }

      const lotData: CreateLotData = {
        product_supplier_id: productSupplierId!,
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
      setError(err.response?.data?.error || 'Error al crear lote para producto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    // Dashboard y métricas
    getDashboard,
    getSuppliersMetrics,
    // Gestión de lotes
    getLots,
    getLotById,
    createLot,
    updateLot,
    deleteLot,
    createLotForProduct,
    // Catálogos
    getCatalogBySupplier,
  };
};