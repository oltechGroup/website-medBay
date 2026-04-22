// frontend/src/lib/validations.ts

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  // --- DATOS DE CUENTA ---
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'), // NUEVO

  // --- DATOS FISCALES (Opcionales según el rol, validados en lógica visual) ---
  company_name: z.string().optional().or(z.literal('')),
  tax_id: z.string().optional().or(z.literal('')),
  
  // --- DATOS DE DIRECCIÓN (NUEVO BLOQUE) ---
  country: z.string().min(2, 'Selecciona un país'),
  postal_code: z.string().min(4, 'Código postal inválido'),
  state: z.string().min(2, 'Estado/Provincia requerido'),
  city: z.string().min(2, 'Ciudad requerida'),
  colony: z.string().min(2, 'Colonia requerida'), // NUEVO
  street: z.string().min(2, 'Calle requerida'),
  street_number: z.string().min(1, 'Número exterior requerido'), // NUEVO
  suite_number: z.string().optional().or(z.literal('')), // Opcional
  between_streets: z.string().optional().or(z.literal('')), // Opcional
  reference_point: z.string().optional().or(z.literal('')), // Opcional

  // Rol (se llena automático)
  // ✅ MODIFICADO: Agregamos 'supplier' como un rol válido para que Zod permita el envío
  verification_level: z.enum(['medical_professional', 'business_verified', 'supplier']),

}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// ==========================================
// 🔐 ESQUEMAS DE RECUPERACIÓN DE CONTRASEÑA
// ==========================================

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;