// frontend/src/hooks/useAuth.ts

import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout: storeLogout, updateUser } = useAuthStore();
  const router = useRouter();

  // --- LOGOUT MEJORADO Y BLINDADO ---
  const logout = () => {
    // 1. CONFIGURACIÓN DE LIMPIEZA PRIMARIA
    // Replicamos la configuración exacta usada al crear la cookie
    const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('medbaysupply.com');
    
    const cookieOptions: Cookies.CookieAttributes = { 
        path: '/', 
        domain: isProduction ? '.medbaysupply.com' : undefined,
        secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        sameSite: 'Lax'
    };

    // 2. LIMPIEZA NIVEL 1: Borrar con la configuración de dominio
    Cookies.remove('medbay_token', cookieOptions);
    Cookies.remove('medbay_role', cookieOptions);

    // 3. LIMPIEZA NIVEL 2 (FALLBACK): Borrar sin dominio
    // Esto atrapa cookies "zombies" que pudieron quedar sin el dominio explícito
    Cookies.remove('medbay_token', { path: '/' });
    Cookies.remove('medbay_role', { path: '/' });

    // 4. Limpiar LocalStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('medbay_token');
        localStorage.removeItem('medbay_user');
    }

    // 5. Limpiar Estado Global (Zustand)
    storeLogout();

    // 6. Redirigir y Refrescar para purgar memoria
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