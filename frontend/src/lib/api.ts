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
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        
        // 1. Si es INVITADO (no tiene token), no hacemos nada.
        const existingToken = Cookies.get('medbay_token');
        if (!existingToken) {
           return Promise.reject(error);
        }

        // 2. Si tenía token y falló, limpiamos y redirigimos
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          
          Cookies.remove('medbay_token', { path: '/' });
          Cookies.remove('medbay_role', { path: '/' });
          localStorage.removeItem('medbay_token');
          localStorage.removeItem('medbay_user');
          
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;