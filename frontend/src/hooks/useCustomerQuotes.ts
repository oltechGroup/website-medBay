// frontend/src/hooks/useCustomerQuotes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

// --- INTERFACES ---

export interface QuoteRequest {
  product_name: string;
  sku: string;
  quantity_asked: number;
  notes?: string;
}

// 🚀 Definimos la interfaz del contexto para que sea reutilizable
export interface QuoteContext {
  lotId?: string;
  lotNumber?: string;
  referencePrice?: number;
  expiryDate?: string;
  stockAvailable?: number;
  supplierName?: string;
  productId?: string;
  status?: string; 
  requested_uom?: string; // 🚀 NUEVO: Agregado para que TS lo reconozca en la UI
}

export interface QuoteProposal {
  quantity_found: number;
  expiry_date: string;
  lot_type: 'in_date' | 'short_date' | 'expired' | 'equipment';
  unit_price: number;
  admin_notes?: string;
  proposal_date: string;
}

export interface CustomerQuote {
  id: string;
  status: 'pending' | 'proposal_sent' | 'accepted' | 'rejected' | 'converted_to_order';
  product_request: QuoteRequest;
  quote_context?: QuoteContext; // 🚀 MOVIDO A NIVEL PRINCIPAL: Para que quote.quote_context funcione
  admin_proposal?: QuoteProposal;
  created_at: string;
}

// --- HOOK ---

export const useCustomerQuotes = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // 1. Obtener mis cotizaciones
  const { data: quotes = [], isLoading, error } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: async (): Promise<CustomerQuote[]> => {
      const response = await api.get('/quotes/my-quotes');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // 2. Responder a una propuesta
  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accepted' | 'rejected' }) => {
      const response = await api.put(`/quotes/${id}/respond`, { action });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['client-notifications'] });
    },
  });

  // Helpers de UI
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': 
        return { label: 'Esperando Respuesta', color: 'bg-yellow-100 text-yellow-700', actionRequired: false };
      case 'proposal_sent': 
        return { label: '¡Propuesta Lista!', color: 'bg-blue-100 text-blue-700', actionRequired: true };
      case 'accepted': 
        return { label: 'Aceptada', color: 'bg-emerald-100 text-emerald-700', actionRequired: false };
      case 'rejected': 
        return { label: 'Rechazada', color: 'bg-red-50 text-red-500', actionRequired: false };
      case 'converted_to_order': 
        return { label: 'Orden Generada', color: 'bg-purple-100 text-purple-700', actionRequired: false };
      default: 
        return { label: status, color: 'bg-gray-100 text-gray-500', actionRequired: false };
    }
  };

  return {
    quotes,
    isLoading,
    error,
    respondToQuote: respondMutation.mutateAsync,
    isResponding: respondMutation.isPending,
    getStatusInfo
  };
};