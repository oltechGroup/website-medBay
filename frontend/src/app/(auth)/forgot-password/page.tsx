//frontend/src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations';
import { useRequestPasswordReset } from '@/hooks/useApi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const requestResetMutation = useRequestPasswordReset();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await requestResetMutation.mutateAsync(data);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.response?.data?.error || 'Error al solicitar la recuperación. Intenta nuevamente.',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* --- LEFT SECTION: PREMIUM VISUAL --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <img 
          src="/Images/11.png" 
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
              <ShieldCheck size={14} /> SECURE ACCOUNT RECOVERY
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Restaurar <br /> <span className="text-blue-400">Acceso.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed">
              Recupera tu cuenta de manera segura para continuar gestionando suministros médicos y trazabilidad B2B.
            </p>
          </div>

          <p className="text-slate-500 text-sm italic">
            © 2025 MedBay Global Access to Medical Devices.
          </p>
        </div>
      </div>

      {/* --- RIGHT SECTION: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50 relative">
        
        {/* Back button (Mobile friendly) */}
        <Link 
          href="/login" 
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al Login
        </Link>

        <div className="max-w-md w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 mt-10 lg:mt-0">
          
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
                <img src="/icons/logomed.png" alt="Logo" className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Recuperar Contraseña
            </h2>
            <p className="mt-3 text-slate-500 font-medium">
              {!isSubmitted 
                ? "Ingresa el correo electrónico asociado a tu cuenta corporativa y te enviaremos un enlace seguro."
                : "Revisa tu bandeja de entrada."}
            </p>
          </div>

          {!isSubmitted ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5 relative group transition-all duration-300">
                <Input
                  label="Correo Corporativo"
                  type="email"
                  placeholder="ejemplo@medbay.com"
                  className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all h-12"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Mail className="absolute right-4 top-[38px] text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>

              {errors.root && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 animate-shake">
                  <p className="text-sm text-red-600 font-medium">{errors.root.message}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-blue-600 text-white h-14 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-3 group"
                loading={requestResetMutation.isPending}
              >
                Enviar Enlace
                {!requestResetMutation.isPending && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          ) : (
            /* --- SUCCESS STATE --- */
            <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg shadow-slate-200/50 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">¡Correo Enviado!</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Hemos enviado las instrucciones a <strong>{submittedEmail}</strong>. Por favor, revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <Link href="/login">
                <Button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 h-12 rounded-xl text-sm font-bold transition-all">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          )}

          <div className="pt-8 border-t border-slate-200 flex flex-col items-center gap-4">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
               Medical-Grade Encrypted Connection
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