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
  currency_code?: string; // NUEVO: Soporte para moneda
  image_column?: string; // NUEVO: Soporte para columna de imágenes
}

export interface CleanCatalogRequest {
  supplier_id: string;
  sales_category: 'regular' | 'near_expiry' | 'expired';
}

// INTERFAZ ACTUALIZADA: Agregar currency_code e image_column
export interface UploadCatalogRequest {
  supplier_id: string;
  sales_category: 'regular' | 'near_expiry' | 'expired';
  file: File;
  currency_code?: string; // NUEVO
  image_column?: string; // NUEVO
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
    imagen_url?: string; // NUEVO: Campo opcional para imágenes
  };
}

export interface PreviewData {
  success: boolean;
  preview: any[];
  available_columns: string[];
  total_preview_rows: number;
}

// INTERFAZ ACTUALIZADA: Para procesar importación
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

// NUEVAS INTERFACES PARA ESTADÍSTICAS
export interface ImportStats {
  imports_today: number;
  imports_this_month: number;
  total_imports: number;
  last_import_date: string;
  last_import_supplier: string;
  last_import_category: string;
}

export interface ImportStatsResponse {
  success: boolean;
  stats: ImportStats;
}

// NUEVA INTERFAZ: Progreso de importación en tiempo real
export interface ImportProgress {
  id: number;
  upload_id: string;
  user_id: string;
  total_rows: number;
  processed_rows: number;
  percentage: number; // Calculado
  status: 'uploaded' | 'processing' | 'completed' | 'completed_with_errors' | 'error';
  current_operation: string;
  estimated_time_remaining: number;
  estimated_time_minutes: number; // Calculado
  error_messages?: any[];
  created_at: string;
  updated_at: string;
}

export interface ImportProgressResponse {
  success: boolean;
  progress: ImportProgress;
}

// NUEVA INTERFAZ: Respuesta de upload con nuevos campos
export interface UploadResponse {
  success: boolean;
  message: string;
  upload_id: string;
  sales_category: string;
  currency_code?: string; // NUEVO
  image_column?: string; // NUEVO
  total_rows: number;
  preview_available: boolean;
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

  // NUEVA MUTATION: Upload file con soporte para moneda e imágenes
  const uploadFileMutation = useMutation({
    mutationFn: async (data: UploadCatalogRequest): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('supplier_id', data.supplier_id);
      formData.append('sales_category', data.sales_category);
      
      // NUEVO: Agregar campos opcionales si existen
      if (data.currency_code) {
        formData.append('currency_code', data.currency_code);
      }
      if (data.image_column) {
        formData.append('image_column', data.image_column);
      }

      const response = await api.post<UploadResponse>('/import/upload', formData, {
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

  // NUEVA FUNCIÓN: Obtener progreso en tiempo real
  const getImportProgress = async (uploadId: string): Promise<ImportProgress | null> => {
    try {
      const response = await api.get<ImportProgressResponse>(`/import/progress/${uploadId}`);
      
      if (response.data.success) {
        return response.data.progress;
      } else {
        console.warn('No se pudo obtener el progreso');
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      return null;
    }
  };

  // NUEVA FUNCIÓN: Polling para progreso en tiempo real
  const pollImportProgress = async (
    uploadId: string, 
    onProgress: (progress: ImportProgress) => void,
    interval: number = 2000 // 2 segundos
  ): Promise<void> => {
    let isCompleted = false;
    
    const poll = async () => {
      if (isCompleted) return;
      
      try {
        const progress = await getImportProgress(uploadId);
        
        if (progress) {
          onProgress(progress);
          
          // Detener polling si la importación está completa
          if (['completed', 'completed_with_errors', 'error'].includes(progress.status)) {
            isCompleted = true;
            return;
          }
        }
        
        // Continuar polling
        setTimeout(poll, interval);
      } catch (error) {
        console.error('Error en polling de progreso:', error);
        setTimeout(poll, interval);
      }
    };
    
    // Iniciar polling
    poll();
  };

  // FUNCIÓN: Obtener estadísticas de importación
  const getImportStats = async (): Promise<ImportStats> => {
    try {
      const response = await api.get<ImportStatsResponse>('/import/stats');
      
      if (response.data.success) {
        return response.data.stats;
      } else {
        throw new Error('Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('Error en getImportStats:', error);
      // Retornar valores por defecto en caso de error
      return {
        imports_today: 0,
        imports_this_month: 0,
        total_imports: 0,
        last_import_date: '',
        last_import_supplier: '',
        last_import_category: 'regular'
      };
    }
  };

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
    getImportStats,
    
    // NUEVAS FUNCIONES: Progreso en tiempo real
    getImportProgress,
    pollImportProgress,
    
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
    
    // NUEVO: Datos de respuesta de upload
    uploadResponse: uploadFileMutation.data,
  };
};