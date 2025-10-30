'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface InventoryItem {
  id: string;
  product_name: string;
  product_code: string;
  product_description?: string;
  manufacturer_name: string;
  supplier_name: string;
  supplier_sku: string;
  lot_number: string;
  expiry_date: string;
  quantity: number;
  price_amount: number;
  sales_category: 'regular' | 'near_expiry' | 'expired';
  status: string;
}

export interface SupplierSummary {
  id: string;
  supplier_name: string;
  regular_products: number;
  near_expiry_products: number;
  expired_products: number;
  total_products: number;
  last_import: string;
}

export interface InventoryDashboard {
  total_regular: number;
  total_near_expiry: number;
  total_expired: number;
  total_suppliers: number;
  total_products: number;
  total_value: number;
  last_import_date: string;
}

export const useInventory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener resumen de proveedores
  const getSuppliersSummary = async (): Promise<SupplierSummary[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/suppliers-summary');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar proveedores');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener catálogo por proveedor y categoría - NOMBRE CORREGIDO
  const getCatalogBySupplierAndCategory = async (
    supplierId: string, 
    salesCategory: 'regular' | 'near_expiry' | 'expired'
  ): Promise<InventoryItem[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/inventory/catalog/supplier/${supplierId}/category/${salesCategory}`
      );
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar catálogo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener dashboard de inventario
  const getInventoryDashboard = async (): Promise<InventoryDashboard> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/dashboard');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener todos los lotes (para compatibilidad)
  const getAllLots = async (): Promise<InventoryItem[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inventory/lots-complete');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar inventario');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getSuppliersSummary,
    getCatalogBySupplierAndCategory, 
    getInventoryDashboard,
    getAllLots
  };
};