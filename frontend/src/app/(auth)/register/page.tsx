//frontend/src/app/(auth)/register/page.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterFormData, registerSchema } from '@/lib/validations';
import { useRegister } from '@/hooks/useApi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ShieldCheck, UserPlus, ArrowLeft, Building2, ClipboardCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type');
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      verification_level: userType === 'supplier' ? 'business_verified' : 'consumer_basic',
      country: 'MX',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...userData } = data;
      await registerMutation.mutateAsync(userData);
      router.push('/login?message=registered');
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.response?.data?.error || 'Error al crear la cuenta',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* --- SECCIÓN IZQUIERDA: VISUAL PREMIUM --- */}
      <div className="hidden lg:flex lg:w-1/3 relative overflow-hidden bg-slate-900">
        <img 
          src="/images/7.png" 
          alt="Medical Professionals" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay scale-110"
        />
        {/* Gradiente ajustado para más transparencia */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-slate-900/80 to-slate-900/95"></div>
        
        <div className="relative z-10 w-full p-12 flex flex-col justify-between text-white">
          <Link href="/" className="flex items-center gap-3 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform text-blue-400" />
            <span className="text-sm font-bold tracking-widest uppercase">Volver al inicio</span>
          </Link>

          <div>
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/40">
                <UserPlus className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-black leading-tight mb-6">
              Únete a la red <br /> <span className="text-blue-400">MedBay.</span>
            </h1>
            <ul className="space-y-4">
                {[
                    {icon: <ShieldCheck size={18}/>, text: "Acceso a productos certificados ISO"},
                    {icon: <Building2 size={18}/>, text: "Precios mayoristas B2B directos"},
                    {icon: <ClipboardCheck size={18}/>, text: "Trazabilidad completa de lotes"}
                ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-200 font-medium">
                        <span className="text-blue-400">{item.icon}</span>
                        {item.text}
                    </li>
                ))}
            </ul>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma diseñada para el sector salud con los más altos estándares de seguridad y logística masiva.
            </p>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DERECHA: FORMULARIO --- */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-6 sm:p-12 bg-slate-50 overflow-y-auto">
        <div className="max-w-2xl w-full space-y-8 animate-in fade-in duration-700">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Crear cuenta profesional</h2>
            <p className="mt-2 text-slate-500">
                ¿Ya eres miembro? {' '}
                <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                    Inicia sesión aquí
                </Link>
            </p>
          </div>

          <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Información de Usuario</p>
              </div>

              <Input
                label="Nombre Completo"
                placeholder="Ej. Dr. Juan Pérez"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-11 transition-all"
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="juan.perez@hospital.com"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-11 transition-all"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="md:col-span-2 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Datos Fiscales</p>
              </div>

              <Input
                label="Institución o Empresa"
                placeholder="Nombre de la clínica"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-11 transition-all"
                error={errors.company_name?.message}
                {...register('company_name')}
              />

              <Input
                label="RFC / TAX ID"
                placeholder="Registro fiscal"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-11 transition-all"
                error={errors.tax_id?.message}
                {...register('tax_id')}
              />

              <div className="md:col-span-2 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Seguridad</p>
              </div>

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-11 transition-all"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="••••••••"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-11 transition-all"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <input type="hidden" {...register('verification_level')} />
              <input type="hidden" {...register('country')} />
            </div>

            {errors.root && (
              <div className="mt-6 rounded-xl bg-red-50 border border-red-100 p-4">
                <p className="text-sm text-red-600 font-medium">{errors.root.message}</p>
              </div>
            )}

            <div className="mt-10">
              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-blue-600 text-white h-14 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-3 group"
                loading={registerMutation.isPending}
              >
                Crear mi cuenta profesional
                {!registerMutation.isPending && <UserPlus size={20} className="group-hover:scale-110 transition-transform" />}
              </Button>
              <p className="mt-4 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                Protección de datos bajo estándares internacionales
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}