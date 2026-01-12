//frontend/src/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie'; // ✅ Asegúrate de tener esto importado si lo usas, o usa localStorage como tenías antes para limpieza.

const API_BASE_URL = 'https://api.medbaysupply.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Intentamos leer de cookie primero (lo ideal), o fallback a localStorage
      const token = Cookies.get('medbay_token') || localStorage.getItem('medbay_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido/Suspendido)
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        
        // 🛑 CORRECCIÓN DEL BUCLE INFINITO 🛑
        // Solo redirigimos si NO estamos ya en la página de login o registro
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          
          // Limpieza total
          localStorage.removeItem('medbay_token');
          localStorage.removeItem('medbay_user');
          Cookies.remove('medbay_token');
          Cookies.remove('medbay_role');
          
          // Redirigir
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;