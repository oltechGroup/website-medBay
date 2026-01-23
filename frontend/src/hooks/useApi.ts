// frontend/src/hooks/useApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import Cookies from 'js-cookie';

// --- CONFIGURACIÓN DE COOKIES BLINDADA ---
// Usamos el dominio con punto (.) para que funcione en www y sin www
const COOKIE_OPTIONS = {
  expires: 1, // 1 día
  path: '/',
  domain: window.location.hostname.includes('medbaysupply.com') ? '.medbaysupply.com' : undefined,
  secure: window.location.protocol === 'https:',
  sameSite: 'Lax' as const
};

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
      // 1. Guardamos en LocalStorage (Respaldo)
      localStorage.setItem('medbay_token', data.token);
      localStorage.setItem('medbay_user', JSON.stringify(data.user));

      // 2. Guardamos en COOKIES (Con configuración Global)
      Cookies.set('medbay_token', data.token, COOKIE_OPTIONS);
      Cookies.set('medbay_role', data.user.verification_level, COOKIE_OPTIONS);

      // 3. Actualizamos estado
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Hook para registro (Sin cambios)
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

// Hook para usuario actual
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