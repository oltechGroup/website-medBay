// frontend/src/hooks/useDocuments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth'; 

export type DocumentType = 'license' | 'business_registration' | 'prescription' | 'payment_evidence';
export type DocStatus = 'uploaded' | 'under_review' | 'verified' | 'rejected';

export interface Document {
  id: string;
  owner_type: 'user' | 'supplier';
  owner_id: string;
  document_type: DocumentType;
  file_path: string;
  status: DocStatus;
  notes?: string;
  created_at: string;
  reference_id?: string; 
  
  // Datos unidos (JOINs del backend)
  user_name?: string;
  user_email?: string;
  supplier_name?: string;
  user_status?: string; 
  user_role?: string;   
}

export const useDocuments = (typeFilter: string = 'all', mode: 'admin' | 'my' = 'my') => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isStaff = user?.verification_level === 'admin' || user?.verification_level === 'sales_agent';
  
  // Lógica de endpoint
  const endpoint = (mode === 'admin' && isStaff) ? '/documents' : '/documents/my-documents';

  // 1. OBTENER DOCUMENTOS
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents', mode, typeFilter],
    queryFn: async () => {
      const response = await api.get(endpoint);
      const allDocs = response.data as Document[];
      
      if (typeFilter === 'all') return allDocs;
      return allDocs.filter(d => d.document_type === typeFilter);
    },
    enabled: !!user,
    retry: 1 
  });

  // 2. ACTUALIZAR ESTADO (Admin: Validar/Rechazar)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: DocStatus; notes?: string }) => {
      const response = await api.put(`/documents/${id}/status`, { status, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // 3. REEMPLAZAR DOCUMENTO (Usuario: Corregir rechazo) -> ¡NUEVO!
  const replaceDocumentMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      // Importante: No configuramos headers manuales, dejamos que el navegador gestione el boundary
      const response = await api.put(`/documents/${id}/replace`, formData);
      return response.data;
    },
    onSuccess: () => {
      // Esto refresca la lista automáticamente sin recargar la página
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // 4. ELIMINAR DOCUMENTO
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    // Data
    documents,
    isLoading,
    isError: !!error,
    
    // Actions
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,

    replaceDocument: replaceDocumentMutation.mutateAsync, // ✅ Nueva función expuesta
    isReplacing: replaceDocumentMutation.isPending,       // ✅ Estado de carga expuesto

    deleteDocument: deleteMutation.mutateAsync
  };
};