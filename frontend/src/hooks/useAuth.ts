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
    // 1. ✅ CORRECCIÓN CRÍTICA: Limpiar Cookies con path: '/'
    // Si no especificamos el path, la cookie global NO se borra.
    Cookies.remove('medbay_token', { path: '/' });
    Cookies.remove('medbay_role', { path: '/' });

    // 2. Limpiar LocalStorage
    // Usamos removeItem para asegurar limpieza total
    if (typeof window !== 'undefined') {
        localStorage.removeItem('medbay_token');
        localStorage.removeItem('medbay_user');
    }

    // 3. Limpiar Estado Global (Zustand)
    storeLogout();

    // 4. Redirigir
    // Usamos replace en lugar de push para que no puedan volver atrás con el botón "Atrás" del navegador
    router.replace('/login');
    router.refresh();
  };

  // --- REFRESH USER ---
  const refreshUser = async () => {
    try {
      if (!user?.id) return;

      const { data } = await api.get(`/users/${user.id}`);
      
      // Actualizamos el estado global
      updateUser(data);
      
      // Opcional: Si el rol cambió, actualizamos también la cookie
      Cookies.set('medbay_role', data.verification_level, { expires: 1, path: '/' });
      
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