import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  };
};