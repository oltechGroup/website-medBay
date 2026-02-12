// frontend/src/lib/api.ts

import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://api.medbaysupply.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json', // Por defecto es JSON
  },
  withCredentials: true 
});

// --- INTERCEPTOR REQUEST ---
api.interceptors.request.use(
  (config) => {
    // 1. Inyección de Token (Lógica existente)
    if (typeof window !== 'undefined') {
      const token = Cookies.get('medbay_token') || localStorage.getItem('medbay_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 2. ✅ FIX INTELIGENTE PARA ARCHIVOS
    // Si estamos enviando FormData, eliminamos el Content-Type 'application/json'
    // para dejar que el navegador configure el 'multipart/form-data' con el boundary correcto.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR RESPONSE (Sin cambios, mantiene tu lógica de seguridad) ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        
        // 1. Si es INVITADO (no tiene token), no hacemos nada.
        const existingToken = Cookies.get('medbay_token');
        if (!existingToken) {
           return Promise.reject(error);
        }

        // 2. Si tenía token y falló, limpiamos y redirigimos
        const currentPath = window.location.pathname;
        
        // Evitamos bucles si ya está en login
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          
          // --- FIX CRÍTICO: Matar la Cookie Zombie ---
          const isProduction = window.location.hostname.includes('medbaysupply.com');
          
          const cookieOptions: Cookies.CookieAttributes = { 
            path: '/', 
            domain: isProduction ? '.medbaysupply.com' : undefined,
            secure: window.location.protocol === 'https:',
            sameSite: 'Lax'
          };

          // 1. Intentamos borrar con el dominio específico
          Cookies.remove('medbay_token', cookieOptions);
          Cookies.remove('medbay_role', cookieOptions);

          // 2. Intentamos borrar sin dominio (Backup)
          Cookies.remove('medbay_token', { path: '/' });
          Cookies.remove('medbay_role', { path: '/' });

          localStorage.removeItem('medbay_token');
          localStorage.removeItem('medbay_user');
          
          // Forzamos la recarga en el login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;