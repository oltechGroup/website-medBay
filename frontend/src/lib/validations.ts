import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  company_name: z.string().optional(),
  tax_id: z.string().optional(),
  country: z.string().min(2, 'País es requerido'),
  verification_level: z.enum(['guest', 'consumer_basic', 'business_verified', 'medical_professional', 'admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;