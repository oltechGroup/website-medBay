// frontend/src/hooks/useAuth.ts

import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie'; // ✅ Importamos Cookies
import { useRouter } from 'next/navigation'; // ✅ Para redirigir

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  // Creamos una función logout "mejorada"
  const logout = () => {
    // 1. Limpiar Cookies (Para que el Middleware sepa que saliste)
    Cookies.remove('medbay_token');
    Cookies.remove('medbay_role');

    // 2. Limpiar LocalStorage (Limpieza general)
    localStorage.removeItem('medbay_token');
    localStorage.removeItem('medbay_user');

    // 3. Limpiar Estado Global de Zustand
    storeLogout();

    // 4. Redirigir al Login o Home
    router.push('/login');
    router.refresh(); // Opcional: Refresca para asegurar que el middleware actúe
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout, // Usamos nuestra función nueva
  };
};