//frontend/src/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
  reference_id?: string; // ✅ ID de la Orden (si aplica)
  
  // Datos unidos (JOINs del backend)
  user_name?: string;
  user_email?: string;
  supplier_name?: string;
}

export const useDocuments = (typeFilter: string = 'all') => {
  const queryClient = useQueryClient();

  // 1. OBTENER DOCUMENTOS
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', typeFilter],
    queryFn: async () => {
      // Nota: Tu endpoint actual devuelve todos. 
      // Idealmente, el backend filtraría, pero podemos filtrar aquí por ahora.
      const response = await api.get('/documents');
      const allDocs = response.data as Document[];
      
      if (typeFilter === 'all') return allDocs;
      return allDocs.filter(d => d.document_type === typeFilter);
    },
  });

  // 2. ACTUALIZAR ESTADO (Validar/Rechazar)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: DocStatus; notes?: string }) => {
      const response = await api.put(`/documents/${id}/status`, { status, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // 3. ELIMINAR DOCUMENTO
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents,
    isLoading,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync
  };
};