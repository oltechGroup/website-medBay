// frontend/src/hooks/useAdminQuotes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- TIPOS DE DATOS (Interfaces) ---

export interface ProductRequest {
  product_name: string;
  sku: string;
  quantity_asked: number;
  notes?: string;
  // 🚀 ACTUALIZADO: Estructura formal para el contexto inteligente
  quote_context?: {
    lotId?: string;
    lotNumber?: string;
    referencePrice?: number;
    expiryDate?: string;
    stockAvailable?: number;
    supplierName?: string;
    productId?: string; 
    status?: string;    
    requested_uom?: string; // ✅ NUEVO: La unidad que el cliente seleccionó
  };
}

export interface AdminProposal {
  quantity_found: number;
  expiry_date: string;
  lot_type: 'in_date' | 'short_date' | 'expired' | 'equipment'; 
  unit_price: number;
  admin_notes?: string;
  proposal_date: string;
}

export interface GuestInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface Quote {
  id: string;
  user_id: string | null;
  user_name?: string; 
  user_email?: string;
  user_phone?: string; 
  guest_info?: GuestInfo;
  
  product_request: ProductRequest;
  admin_proposal?: AdminProposal;
  
  status: 'pending' | 'proposal_sent' | 'accepted' | 'rejected' | 'converted_to_order';
  created_at: string;
  updated_at: string;
}

export const useAdminQuotes = () => {
  const queryClient = useQueryClient();

  // 1. OBTENER TODAS LAS COTIZACIONES
  const { data: quotes = [], isLoading, error } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: async (): Promise<Quote[]> => {
      const response = await api.get('/quotes');
      return response.data;
    },
    refetchInterval: 60000, 
  });

  // 2. ENVIAR PROPUESTA (RESPONDER)
  const sendProposalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdminProposal> }) => {
      const response = await api.put(`/quotes/${id}/proposal`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
    },
  });

  // 3. ELIMINAR COTIZACIÓN
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/quotes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
    },
  });

  // --- HELPERS PARA UI ---

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'proposal_sent': return 'Propuesta Enviada';
      case 'accepted': return 'Aceptada (Cerrar Venta)';
      case 'rejected': return 'Rechazada por Cliente';
      case 'converted_to_order': return 'Orden Generada';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'proposal_sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-500 border-red-100';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return {
    quotes,
    isLoading,
    error,
    sendProposal: sendProposalMutation.mutateAsync,
    isSending: sendProposalMutation.isPending,
    deleteQuote: deleteQuoteMutation.mutateAsync,
    isDeleting: deleteQuoteMutation.isPending,
    getStatusLabel,
    getStatusColor
  };
};