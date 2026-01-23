// frontend/src/hooks/useAuth.ts

import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api'; // ✅ NUEVO: Importamos la API para consultar datos frescos

export const useAuth = () => {
  // ✅ NUEVO: Extraemos 'updateUser' del store para poder guardar los cambios
  const { user, token, isAuthenticated, login, logout: storeLogout, updateUser } = useAuthStore();
  const router = useRouter();

  // --- LOGOUT MEJORADO ---
  const logout = () => {
    // 1. Limpiar Cookies
    Cookies.remove('medbay_token');
    Cookies.remove('medbay_role');

    // 2. Limpiar LocalStorage
    localStorage.removeItem('medbay_token');
    localStorage.removeItem('medbay_user');

    // 3. Limpiar Estado Global
    storeLogout();

    // 4. Redirigir
    router.push('/login');
    router.refresh();
  };

  // --- ✅ NUEVA FUNCIÓN: REFRESH USER ---
  // Esta función pide los datos más recientes del usuario a la BD y actualiza el frontend
  const refreshUser = async () => {
    try {
      if (!user?.id) return;

      // Hacemos la petición al backend para obtener los datos frescos
      const { data } = await api.get(`/users/${user.id}`);
      
      // Guardamos los nuevos datos en el estado global (Zustand)
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
    refreshUser, // 👈 Exportamos la función para usarla en ProfilePage
  };
};