// frontend/src/hooks/useApi.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
// ✅ IMPORTANTE: Importamos js-cookie
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
      // 1. Guardamos en LocalStorage (Para tu app de React actual)
      localStorage.setItem('medbay_token', data.token);
      localStorage.setItem('medbay_user', JSON.stringify(data.user));

      // 2. ✅ Guardamos en COOKIES (Para que el Middleware lo vea)
      Cookies.set('medbay_token', data.token, { expires: 1 });
      Cookies.set('medbay_role', data.user.verification_level, { expires: 1 });

      // 3. Actualizamos el estado global
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

// Hook para obtener el usuario actual (✅ AJUSTADO)
export const useCurrentUser = () => {
  // Extraemos también el 'token' para validar que exista texto
  const { isAuthenticated, token } = useAuth();

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.get('/auth/verify');
      return response.data;
    },
    // ✅ CAMBIO DE SEGURIDAD:
    // Solo ejecutamos la query si el flag es true Y además tenemos un token string.
    enabled: isAuthenticated && !!token,
    
    // ✅ EVITAR BUCLE: Si falla la verificación (401), no reintentar. 
    // Asumimos que la sesión expiró y dejamos que el interceptor actúe una sola vez.
    retry: false, 
  });
};