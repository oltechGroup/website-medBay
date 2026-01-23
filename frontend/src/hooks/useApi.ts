// frontend/src/hooks/useApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import Cookies from 'js-cookie';

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
      // 1. Guardamos en LocalStorage
      localStorage.setItem('medbay_token', data.token);
      localStorage.setItem('medbay_user', JSON.stringify(data.user));

      // 2. CONFIGURACIÓN ROBUSTA DE COOKIES
      // Definimos las opciones DENTRO de la función para asegurar que 'window' existe
      const isProduction = window.location.hostname.includes('medbaysupply.com');
      
      const cookieOptions: Cookies.CookieAttributes = { 
        expires: 1, // 1 día
        path: '/',
        // Importante: El punto al inicio (.medbaysupply.com) hace la cookie visible en todos los subdominios
        domain: isProduction ? '.medbaysupply.com' : undefined,
        // Seguridad para HTTPS
        secure: window.location.protocol === 'https:',
        sameSite: 'Lax'
      };

      // Guardamos las cookies con la nueva configuración blindada
      Cookies.set('medbay_token', data.token, cookieOptions);
      Cookies.set('medbay_role', data.user.verification_level, cookieOptions);

      // 3. Actualizamos estado global
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Hook para registro
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: any) => {
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
  const { isAuthenticated, token } = useAuth();

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.get('/auth/verify');
      return response.data;
    },
    enabled: isAuthenticated && !!token,
    retry: false, 
  });
};