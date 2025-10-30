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

export const useImport = () => {
  const queryClient = useQueryClient();

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
    // Mutations
    uploadFile: uploadFileMutation.mutateAsync,
    saveMappingTemplate: saveMappingTemplateMutation.mutateAsync,
    cleanCatalog: cleanCatalogMutation.mutateAsync,
    processImport: processImportMutation.mutateAsync,
    
    // Queries
    getPreview,
    getMappingTemplate,
    
    // Loading states
    isUploading: uploadFileMutation.isPending,
    isCleaning: cleanCatalogMutation.isPending,
    isProcessing: processImportMutation.isPending,
    isSavingTemplate: saveMappingTemplateMutation.isPending,
    
    // Errors
    uploadError: uploadFileMutation.error,
    cleanError: cleanCatalogMutation.error,
    processError: processImportMutation.error,
    templateError: saveMappingTemplateMutation.error,
  };
};