//frontend/src/hooks/useImport.ts

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface ImportStats {
  created_lots: number;
  created_products: number;
  created_manufacturers: number;
}

export interface ImportProgress {
  id: string;
  status: string; 
  processed_rows: number;
  total_rows: number;
  current_operation: string;
  error_messages?: {
    stats?: ImportStats;
    errors?: any[];
  };
  created_at: string;
  updated_at?: string;
}

export interface UploadResponse {
  success: boolean;
  upload_id: string;
  preview: any[];
  columns: string[];
}

export const useImport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuickSupplier = async (name: string, country_code: string) => {
    try {
      setLoading(true);
      const res = await api.post('/import/quick-supplier', { name, country_code });
      return res.data.supplier;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Error creando proveedor');
    } finally {
      setLoading(false);
    }
  };

  const cleanCatalog = async (supplier_id: string, sales_category: string) => {
    try {
      setLoading(true);
      const res = await api.post('/import/clean-catalog', { supplier_id, sales_category });
      return res.data.deleted; 
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Error limpiando catálogo');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, supplier_id: string, sales_category: string) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('supplier_id', supplier_id);
      formData.append('sales_category', sales_category);

      const res = await api.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data as UploadResponse;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Error subiendo archivo');
    } finally {
      setLoading(false);
    }
  };

  const getMappingTemplate = async (supplier_id: string) => {
    const res = await api.get(`/import/mapping-template?supplier_id=${supplier_id}`);
    return res.data.template?.mappings || {};
  };

  const startProcessing = async (upload_id: string, mappings: any, supplier_id: string) => {
    await api.post('/import/mapping-template', { supplier_id, mappings });
    await api.post('/import/process', { upload_id, mappings });
  };

  const getImportProgress = async (upload_id: string): Promise<ImportProgress> => {
    const res = await api.get(`/import/progress/${upload_id}`);
    return res.data.progress;
  };

  // useCallback agregado para estabilidad del historial
  const getHistory = useCallback(async () => {
    try {
        const res = await api.get('/import/history');
        return res.data;
    } catch (err) {
        console.error("Error fetching history:", err);
        return [];
    }
  }, []);

  // useCallback agregado
  const getStats = useCallback(async () => {
    try {
        const res = await api.get('/import/stats');
        return res.data.stats;
    } catch (err) {
        return null;
    }
  }, []);

  return {
    loading,
    error,
    createQuickSupplier,
    cleanCatalog,
    uploadFile,
    getMappingTemplate,
    startProcessing,
    getImportProgress,
    getHistory,
    getStats
  };
};