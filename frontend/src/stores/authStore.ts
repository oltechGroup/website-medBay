// frontend/src/stores/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ✅ CORRECCIÓN 1: Exportamos la interfaz y agregamos los campos faltantes
export interface User {
  id: string;
  email: string;
  full_name: string;
  verification_level: string;
  
  // Campos opcionales que faltaban y causaban errores:
  company_name?: string;
  phone?: string;
  tax_id?: string;
  account_status?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  // ✅ CORRECCIÓN 2: Agregamos la acción para actualizar datos del usuario
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
      },
      
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      // ✅ Implementación de la función para refrescar datos
      updateUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);