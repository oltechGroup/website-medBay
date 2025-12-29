// frontend/src/hooks/useApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

// Hook para login
export const useLogin = () => {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('medbay_token', data.token);
      localStorage.setItem('medbay_user', JSON.stringify(data.user));
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Hook para registro (ACTUALIZADO para soportar Archivos)
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      // Si es FormData, dejamos que el navegador configure el Content-Type (multipart/form-data)
      // Si es JSON, api (axios) lo maneja automático.
      
      const config = data instanceof FormData 
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};

      const response = await api.post('/users/register', data, config);
      return response.data;
    },
  });
};

// Hook para obtener el usuario actual
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.get('/auth/verify');
      return response.data;
    },
    enabled: isAuthenticated,
  });
};