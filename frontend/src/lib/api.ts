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
      // Priorizamos la Cookie que es lo que el Middleware y el Servidor ven
      const token = Cookies.get('medbay_token') || localStorage.getItem('medbay_token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTOR RESPONSE (Cirugía aquí) ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // 1. Manejo de 401 (No autorizado - Token expirado o inválido)
    if (status === 401) {
      if (typeof window !== 'undefined') {
        const token = Cookies.get('medbay_token');
        
        // Solo redirigimos si realmente HABÍA un token y el servidor lo rechazó.
        // Si no hay token, es un invitado y no hay nada que limpiar.
        if (token && !currentPath.includes('/login')) {
          handleForceLogout();
        }
      }
    }

    // 2. Manejo de 403 (Prohibido - Cuenta pendiente, suspendida o sin permisos)
    // ¡OJO!: Aquí no limpiamos la sesión, porque el usuario sigue siendo válido, 
    // pero su estatus (account_status) le impide ver esa data.
    if (status === 403) {
      console.warn("Acceso restringido: El usuario no tiene permisos o su cuenta no está activa.");
      
      // Si el error viene del backend con el mensaje de "cuenta no activa", 
      // podrías redirigir a una página de "espera" en lugar de login.
      // Por ahora, solo dejamos que el componente maneje el error sin borrar la sesión.
    }

    return Promise.reject(error);
  }
);

/**
 * Función auxiliar para limpiar sesión de forma segura sin dejar rastro
 */
function handleForceLogout() {
  const isProduction = window.location.hostname.includes('medbaysupply.com');
  const cookieOptions = { 
    path: '/', 
    domain: isProduction ? '.medbaysupply.com' : undefined,
    secure: window.location.protocol === 'https:',
    sameSite: 'Lax' as const
  };

  // Limpieza total
  Cookies.remove('medbay_token', cookieOptions);
  Cookies.remove('medbay_role', cookieOptions);
  Cookies.remove('medbay_token', { path: '/' }); // Backup sin dominio
  
  localStorage.removeItem('medbay_token');
  localStorage.removeItem('medbay_user');

  // Redirigir conservando la ruta a la que quería ir (callbackUrl)
  const currentPath = window.location.pathname;
  window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
}

export default api;