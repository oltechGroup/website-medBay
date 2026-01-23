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
      // 1. Guardamos en LocalStorage (Persistencia básica para Zustand)
      localStorage.setItem('medbay_token', data.token);
      localStorage.setItem('medbay_user', JSON.stringify(data.user));

      // 2. ✅ CORRECCIÓN CRÍTICA: Guardamos en COOKIES con path: '/'
      // Sin 'path: /', la cookie solo existe en /login y el middleware no la ve en otras rutas.
      Cookies.set('medbay_token', data.token, { expires: 1, path: '/' });
      Cookies.set('medbay_role', data.user.verification_level, { expires: 1, path: '/' });

      // 3. Actualizamos el estado global
      login(data.token, data.user);
      
      // Invalidamos queries para forzar refresco de datos si existían
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Hook para registro (Sin cambios funcionales, solo limpieza)
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      // Detectamos si es FormData para configurar cabeceras
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
    // Solo ejecutamos si en teoría estamos autenticados
    enabled: isAuthenticated && !!token,
    
    // Si falla la verificación (401), no reintentar. 
    // Dejamos que el interceptor de Axios maneje la redirección si es necesario.
    retry: false, 
  });
};