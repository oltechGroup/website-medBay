// frontend/src/hooks/useApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation'; // ✅ Importamos el router de Next.js

// Hook para login
export const useLogin = () => {
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter(); // ✅ Inicializamos el router

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // 1. Guardamos en LocalStorage
      localStorage.setItem('medbay_token', data.token);
      localStorage.setItem('medbay_user', JSON.stringify(data.user));

      // 2. CONFIGURACIÓN ROBUSTA DE COOKIES
      const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('medbaysupply.com');
      
      const cookieOptions: Cookies.CookieAttributes = { 
        expires: 1, 
        path: '/',
        domain: isProduction ? '.medbaysupply.com' : undefined,
        secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        sameSite: 'Lax'
      };

      // Guardamos las cookies
      Cookies.set('medbay_token', data.token, cookieOptions);
      Cookies.set('medbay_role', data.user.verification_level, cookieOptions);

      // 3. Actualizamos estado global de Zustand
      login(data.token, data.user);
      
      // 4. Limpiamos cache de React Query
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // ✅ EL CAMBIO MAESTRO:
      // Forzamos a Next.js a que refresque sus datos internos y reconozca las cookies nuevas.
      // Esto hace que el Middleware se entere DE INMEDIATO que ya hay una sesión.
      router.refresh();
    },
  });
};

// Hook para registro (Sin cambios en tu lógica)
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

// ==========================================
// 🔐 HOOKS DE RECUPERACIÓN DE CONTRASEÑA
// ==========================================

// Hook para solicitar el correo de recuperación
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await api.post('/auth/request-password-reset', data);
      return response.data;
    },
  });
};

// Hook para guardar la nueva contraseña
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    },
  });
};