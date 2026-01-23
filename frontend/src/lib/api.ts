// frontend/src/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://api.medbaysupply.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true 
});

// --- INTERCEPTOR REQUEST ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
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

// --- INTERCEPTOR RESPONSE ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Detectamos error de autenticación (401) o permisos (403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        
        // 1. REGLA DE ORO: Si es INVITADO (no tiene token), NO lo sacamos.
        // Esto permite que vean el catálogo sin estar logueados.
        const existingToken = Cookies.get('medbay_token');
        if (!existingToken) {
           return Promise.reject(error);
        }

        // 2. Si tenía token y falló, es una SESIÓN CORRUPTA.
        // Debemos limpiar TODO agresivamente para evitar el bucle infinito.
        const currentPath = window.location.pathname;
        
        // Solo redirigimos si no estamos ya en login/registro para no recargar en bucle
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          
          // --- LIMPIEZA NUCLEAR DE COOKIES ---
          // Intentamos borrar la cookie con todas las combinaciones posibles
          // para asegurar que muera, sin importar cómo se creó antes.
          
          // Opción A: Borrado simple (Path raíz)
          Cookies.remove('medbay_token', { path: '/' });
          Cookies.remove('medbay_role', { path: '/' });

          // Opción B: Borrado con dominio explícito (Para cookies creadas con dominio)
          // Esto atrapa las cookies que configuramos en los intentos anteriores
          const domain = window.location.hostname.includes('medbaysupply') ? '.medbaysupply.com' : undefined;
          if (domain) {
            Cookies.remove('medbay_token', { path: '/', domain: domain });
            Cookies.remove('medbay_role', { path: '/', domain: domain });
          }

          // Opción C: Limpieza de LocalStorage
          localStorage.removeItem('medbay_token');
          localStorage.removeItem('medbay_user');
          
          // Forzamos la redirección al login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;