// frontend/src/hooks/useAuth.ts

import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout: storeLogout, updateUser } = useAuthStore();
  const router = useRouter();

  // --- LOGOUT MEJORADO ---
  const logout = () => {
    // Configuración para asegurar que borramos la cookie correcta
    const cookieOptions = {
        path: '/',
        domain: window.location.hostname.includes('medbaysupply.com') ? '.medbaysupply.com' : undefined
    };

    // 1. Limpiar Cookies (Especificando dominio)
    Cookies.remove('medbay_token', cookieOptions);
    Cookies.remove('medbay_role', cookieOptions);

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