// frontend/src/lib/api.ts

import axios from 'axios';
import Cookies from 'js-cookie';

// Usa variables de entorno si es posible, si no, usa el string directo
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.medbaysupply.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR DE REQUEST ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Prioridad absoluta a la Cookie. 
      // El LocalStorage queda solo como respaldo secundario.
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
        // Si ya estamos en login o registro, NO hacemos nada (dejamos que el usuario vea el error en el formulario)
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          
          // 🧹 LIMPIEZA PROFUNDA (CORREGIDA)
          // Importante: Usar path: '/' para asegurar que borramos la cookie global
          Cookies.remove('medbay_token', { path: '/' });
          Cookies.remove('medbay_role', { path: '/' });
          
          localStorage.removeItem('medbay_token');
          localStorage.removeItem('medbay_user');
          
          // Redirigir al login
          // Usamos window.location para un hard refresh y limpiar estados de memoria de React
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;