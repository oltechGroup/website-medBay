import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout: storeLogout, updateUser } = useAuthStore();
  const router = useRouter();

  // --- LOGOUT MEJORADO ---
  const logout = () => {
    // 1. Limpiar Cookies (Con el mismo path que se crearon)
    Cookies.remove('medbay_token', { path: '/' });
    Cookies.remove('medbay_role', { path: '/' });

    // 2. Limpiar LocalStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('medbay_token');
        localStorage.removeItem('medbay_user');
    }

    // 3. Limpiar Estado Global
    storeLogout();

    // 4. Redirigir
    router.replace('/login');
    router.refresh();
  };

  // --- REFRESH USER ---
  const refreshUser = async () => {
    try {
      if (!user?.id) return;
      const { data } = await api.get(`/users/${user.id}`);
      updateUser(data);
    } catch (error) {
      console.error("Error al refrescar información del usuario:", error);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };
};