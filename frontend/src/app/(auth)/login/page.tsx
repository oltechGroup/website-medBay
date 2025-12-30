//frontend/src/app/(auth)/login/page.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginFormData, loginSchema } from '@/lib/validations';
import { useLogin } from '@/hooks/useApi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // 1. Ejecutamos la mutación y capturamos la respuesta del backend
      const response = await loginMutation.mutateAsync(data);
      
      // 2. Extraemos el usuario de la respuesta
      const user = response.user;

      // 3. Lógica de Redirección basada en Roles
      if (user.verification_level === 'admin') {
        router.push('/dashboard');
      } else {
        // Usuarios: medical_professional, business_verified, guest, etc.
        router.push('/');
      }

    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.response?.data?.error || 'Error al iniciar sesión',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* --- SECCIÓN IZQUIERDA: VISUAL PREMIUM --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <img 
          src="/images/11.png" 
          alt="Medical Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/90 via-slate-900/40 to-transparent"></div>
        
        <div className="relative z-10 w-full p-16 flex flex-col justify-between text-white">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icons/logomedblanco.png" alt="MedBay" className="w-12 h-12 shadow-2xl" />
            <span className="text-3xl font-bold tracking-tighter">MedBay</span>
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold mb-6">
              <ShieldCheck size={14} /> ACCESO SEGURO B2B
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Plataforma de <br /> <span className="text-blue-400">Grado Clínico.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed">
              Inicie sesión para gestionar suministros médicos, trazabilidad de lotes y adquisiciones estratégicas.
            </p>
          </div>

          <p className="text-slate-500 text-sm italic">
            © 2025 MedBay Global Access to Medical Devices.
          </p>
        </div>
      </div>

      {/* --- SECCIÓN DERECHA: FORMULARIO --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
        <div className="max-w-md w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
          
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
                <img src="/icons/logomed.png" alt="Logo" className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="mt-3 text-slate-500 font-medium">
              ¿No tienes una cuenta? {' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline transition-all">
                Regístrate aquí
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <Input
                label="Correo Institucional"
                type="email"
                placeholder="ejemplo@medbay.com"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all h-12"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="relative group transition-all duration-300">
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all h-12"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Lock className="absolute right-4 top-[38px] text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
            </div>

            {errors.root && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 animate-shake">
                <p className="text-sm text-red-600 font-medium">{errors.root.message}</p>
              </div>
            )}

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-blue-600 text-white h-14 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-3 group"
              loading={loginMutation.isPending}
            >
              Iniciar Sesión
              {!loginMutation.isPending && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="pt-8 border-t border-slate-200 flex flex-col items-center gap-4">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
               Conexión Encriptada de Grado Médico
             </p>
             <div className="flex gap-6 opacity-30 grayscale">
                <img src="/icons/logomednegro.png" className="h-6 object-contain" alt="Trust Logo" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}