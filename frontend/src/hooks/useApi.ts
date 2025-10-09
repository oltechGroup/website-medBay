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
      // Guardar en localStorage también para persistencia
      localStorage.setItem('medbay_token', data.token);
      localStorage.setItem('medbay_user', JSON.stringify(data.user));
      
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Hook para registro
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await api.post('/users/register', userData);
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