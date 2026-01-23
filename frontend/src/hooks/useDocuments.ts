// frontend/src/hooks/useDocuments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth'; // Necesitamos saber quién es el usuario

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

// Agregamos parámetro 'mode' para diferenciar vista de Admin vs Usuario
export const useDocuments = (typeFilter: string = 'all', mode: 'admin' | 'my' = 'my') => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Detectamos si es Staff para validaciones extra, pero confiamos en el parámetro 'mode'
  const isStaff = user?.verification_level === 'admin' || user?.verification_level === 'sales_agent';
  
  // 🧠 LÓGICA CORREGIDA:
  // Si estoy en modo 'admin' Y soy staff, pido TODOS (/documents).
  // Si no, pido SOLO LOS MÍOS (/documents/my-documents).
  // Esto evita el Error 403 en el perfil.
  const endpoint = (mode === 'admin' && isStaff) ? '/documents' : '/documents/my-documents';

  // 1. OBTENER DOCUMENTOS
  const { data: documents = [], isLoading, error } = useQuery({
    // La key incluye el 'mode' para no mezclar cachés
    queryKey: ['documents', mode, typeFilter],
    queryFn: async () => {
      const response = await api.get(endpoint);
      const allDocs = response.data as Document[];
      
      if (typeFilter === 'all') return allDocs;
      return allDocs.filter(d => d.document_type === typeFilter);
    },
    // Solo ejecutamos si hay usuario autenticado
    enabled: !!user,
    retry: 1 // Si falla (403/401), no insistir tanto
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
    isError: !!error,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync
  };
};