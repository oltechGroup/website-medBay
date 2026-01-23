// frontend/src/lib/api.ts

import axios from 'axios';
import Cookies from 'js-cookie';

// Usa la URL directa para evitar problemas de variables de entorno por ahora
const API_BASE_URL = 'https://api.medbaysupply.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Habilitamos credenciales para el manejo de Cookies
  withCredentials: true 
});

// --- INTERCEPTOR DE REQUEST ---
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

// --- INTERCEPTOR DE RESPONSE (AQUÍ ESTÁ LA CORRECCIÓN) ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido)
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        
        // 1. VERIFICAMOS SI REALMENTE HABÍA UNA SESIÓN
        // Si no hay token en las cookies, significa que es un INVITADO navegando.
        // En ese caso, NO redirigimos. Dejamos que falle la petición (ej. cargar carrito) 
        // para que la web siga funcionando en modo "solo lectura".
        const existingToken = Cookies.get('medbay_token');
        
        if (!existingToken) {
           // Es un invitado, no hacemos nada. Retornamos el error para que React Query lo maneje silenciosamente.
           return Promise.reject(error);
        }

        // 2. SI HABÍA TOKEN Y FALLÓ -> SESIÓN EXPIRADA
        // Solo aquí ejecutamos la limpieza y redirección
        const currentPath = window.location.pathname;

        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          
          // Limpieza total
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