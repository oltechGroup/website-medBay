// frontend/src/hooks/useImport.ts

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// --- INTERFACES ---

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

// Interfaz para la entrada manual
export interface ManualImportData {
  supplier_id: string;
  sales_category: string;
  description: string;
  sku?: string;
  manufacturer?: string;
  quantity: number;
  price: number;
  expiry_date?: string;
  imageFile?: File | null;
  imageUrl?: string;
}

// --- HOOK PRINCIPAL ---

export const useImport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Proveedor Rápido
  const createQuickSupplier = async (name: string, country_code: string) => {
    try {
      setLoading(true);
      const res = await api.post('/import/quick-supplier', { name, country_code });
      return res.data.supplier;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Error creating supplier');
    } finally {
      setLoading(false);
    }
  };

  // 2. Limpieza de Catálogo
  const cleanCatalog = async (supplier_id: string, sales_category: string) => {
    try {
      setLoading(true);
      const res = await api.post('/import/clean-catalog', { supplier_id, sales_category });
      return res.data.deleted; 
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Error cleaning catalog');
    } finally {
      setLoading(false);
    }
  };

  // 3. Subida de Archivo Excel
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
      throw new Error(err.response?.data?.error || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 4. NUEVA FUNCIÓN: ENTRADA MANUAL (CIRUGÍA DE PRECISIÓN)
  const submitManualImport = async (data: ManualImportData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Mapeo de campos básicos
      formData.append('supplier_id', data.supplier_id);
      formData.append('sales_category', data.sales_category);
      formData.append('description', data.description);
      formData.append('sku', data.sku || '');
      formData.append('manufacturer', data.manufacturer || '');
      formData.append('quantity', data.quantity.toString());
      formData.append('price', data.price.toString());
      formData.append('expiry_date', data.expiry_date || '');

      // Lógica de Imagen: Si hay archivo, se envía como 'image'. Si hay URL, como 'image_url'
      if (data.imageFile) {
        formData.append('image', data.imageFile);
      }
      if (data.imageUrl) {
        formData.append('image_url', data.imageUrl);
      }

      const res = await api.post('/import/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return res.data; // Retorna { success, upload_id }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Error submitting manual entry');
    } finally {
      setLoading(false);
    }
  };

  // 5. Plantillas y Procesamiento Excel
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

  // 6. Estado Global (Restauración de Sesión)
  const getActiveStatus = useCallback(async (): Promise<ImportProgress | null> => {
    try {
        const res = await api.get('/import/active-status');
        return res.data.activeImport;
    } catch (err) {
        return null;
    }
  }, []);

  const getHistory = useCallback(async () => {
    try {
        const res = await api.get('/import/history');
        return res.data;
    } catch (err) {
        console.error("Error fetching history:", err);
        return [];
    }
  }, []);

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
    submitManualImport, // ✅ Exportado para el nuevo formulario
    getMappingTemplate,
    startProcessing,
    getImportProgress,
    getHistory,
    getStats,
    getActiveStatus 
  };
};