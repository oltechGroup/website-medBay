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
    // 1. CONFIGURACIÓN DE LIMPIEZA DE COOKIES
    // Debe coincidir EXACTAMENTE con la configuración de creación (useApi.ts)
    // o el navegador no la borrará.
    const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('medbaysupply.com');
    
    const cookieOptions: Cookies.CookieAttributes = { 
        path: '/', 
        domain: isProduction ? '.medbaysupply.com' : undefined,
        secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        sameSite: 'Lax'
    };

    // 2. Ejecutar limpieza con las opciones correctas
    Cookies.remove('medbay_token', cookieOptions);
    Cookies.remove('medbay_role', cookieOptions);

    // 3. Limpiar LocalStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('medbay_token');
        localStorage.removeItem('medbay_user');
    }

    // 4. Limpiar Estado Global (Zustand)
    storeLogout();

    // 5. Redirigir y Refrescar
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