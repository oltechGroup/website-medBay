import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UploadSession {
  id: string;
  supplier_id?: string;
  supplier_name?: string;
  sales_category: 'regular' | 'near_expiry' | 'expired';
  file?: File;
  status: 'selecting' | 'cleaning' | 'ready' | 'uploading' | 'processing' | 'complete' | 'error';
  upload_id?: string;
  results?: any;
}

export interface CleanCatalogRequest {
  supplier_id: string;
  sales_category: 'regular' | 'near_expiry' | 'expired';
}

export interface UploadCatalogRequest {
  supplier_id: string;
  sales_category: 'regular' | 'near_expiry' | 'expired';
  file: File;
}

export interface MappingTemplate {
  supplier_id: string;
  name: string;
  mappings: {
    codigo: string;
    fabricante: string;
    descripcion: string;
    cantidad: string;
    precio: string;
    fecha_caducidad: string;
  };
}

export interface PreviewData {
  success: boolean;
  preview: any[];
  available_columns: string[];
  total_preview_rows: number;
}

export interface ProcessImportRequest {
  upload_id: string;
  mappings: any;
  supplier_id: string;
  sales_category: string;
  supplier_name: string;
}

// INTERFACE CORREGIDA: Permitir null y undefined
export interface CreateSupplierRequest {
  name: string;
  country_id?: string | null;
  currency_id?: string | null;
  contact_info?: any;
}

// INTERFACE PARA LA RESPUESTA DEL BACKEND
export interface SupplierResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    tax_id?: string;
    country_id?: string;
    currency_id?: string;
    contact_info?: any;
    created_at: string;
    updated_at: string;
  };
}

export const useImport = () => {
  const queryClient = useQueryClient();

  // MUTATION CORREGIDA: Manejar estructura de respuesta del backend
  const createSupplierMutation = useMutation({
    mutationFn: async (data: CreateSupplierRequest): Promise<SupplierResponse['data']> => {
      const response = await api.post<SupplierResponse>('/suppliers', {
        name: data.name,
        country_id: data.country_id || null,
        currency_id: data.currency_id || null,
        contact_info: data.contact_info || {}
      });
      
      // ✅ EXTRAER data DE LA RESPUESTA (según la estructura del backend)
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error creando proveedor');
      }
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: UploadCatalogRequest) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('supplier_id', data.supplier_id);
      formData.append('sales_category', data.sales_category);

      const response = await api.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
  });

  // Get preview data
  const getPreview = async (uploadId: string): Promise<PreviewData> => {
    const response = await api.get(`/import/preview/${uploadId}`);
    return response.data;
  };

  // Get mapping template
  const getMappingTemplate = async (supplierId: string, templateName: string = 'default') => {
    const response = await api.get('/import/mapping-template', {
      params: { supplier_id: supplierId, template_name: templateName }
    });
    return response.data;
  };

  // Save mapping template
  const saveMappingTemplateMutation = useMutation({
    mutationFn: async (data: { supplier_id: string; template_name?: string; mappings: any }) => {
      const response = await api.post('/import/mapping-template', data);
      return response.data;
    },
  });

  // Clean catalog mutation
  const cleanCatalogMutation = useMutation({
    mutationFn: async (data: CleanCatalogRequest) => {
      const response = await api.post('/import/clean-catalog', data);
      return response.data;
    },
  });

  // Process import mutation
  const processImportMutation = useMutation({
    mutationFn: async (data: ProcessImportRequest) => {
      const response = await api.post('/import/process', data);
      return response.data;
    },
  });

  return {
    // NUEVA FUNCIÓN: Crear proveedor
    createSupplier: createSupplierMutation.mutateAsync,
    
    // Mutations existentes
    uploadFile: uploadFileMutation.mutateAsync,
    saveMappingTemplate: saveMappingTemplateMutation.mutateAsync,
    cleanCatalog: cleanCatalogMutation.mutateAsync,
    processImport: processImportMutation.mutateAsync,
    
    // Queries
    getPreview,
    getMappingTemplate,
    
    // Loading states
    isCreatingSupplier: createSupplierMutation.isPending,
    isUploading: uploadFileMutation.isPending,
    isCleaning: cleanCatalogMutation.isPending,
    isProcessing: processImportMutation.isPending,
    isSavingTemplate: saveMappingTemplateMutation.isPending,
    
    // Errors
    createSupplierError: createSupplierMutation.error,
    uploadError: uploadFileMutation.error,
    cleanError: cleanCatalogMutation.error,
    processError: processImportMutation.error,
    templateError: saveMappingTemplateMutation.error,
  };
};