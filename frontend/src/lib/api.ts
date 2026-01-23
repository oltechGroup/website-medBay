// frontend/src/lib/api.ts

import axios from 'axios';
import Cookies from 'js-cookie';

// 🛑 CORRECCIÓN DE EMERGENCIA:
// Tu variable de entorno (process.env.NEXT_PUBLIC_API_URL) contiene la IP insegura (http).
// La he comentado para OBLIGAR al sistema a usar la URL segura (https).
//
// NOTA: Asegúrate de que el subdominio 'api.medbaysupply.com' tenga certificado SSL.
// Si no tienes SSL en 'api.', cambia esto a 'https://www.medbaysupply.com/api'
const API_BASE_URL = 'https://api.medbaysupply.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Importante para que las cookies funcionen bien en producción
  withCredentials: true 
});

// --- INTERCEPTOR DE REQUEST ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Prioridad absoluta a la Cookie. 
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

// --- INTERCEPTOR DE RESPONSE ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido/Suspendido)
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        
        const currentPath = window.location.pathname;

        // 🛑 EVITAR BUCLE INFINITO
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          
          // 🧹 LIMPIEZA PROFUNDA
          Cookies.remove('medbay_token', { path: '/' });
          Cookies.remove('medbay_role', { path: '/' });
          
          localStorage.removeItem('medbay_token');
          localStorage.removeItem('medbay_user');
          
          // Redirigir al login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;