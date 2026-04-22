//frontend/src/app/(auth)/reset-password/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations';
import { useResetPassword } from '@/hooks/useApi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const resetMutation = useResetPassword();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('root', { message: 'No valid security token found.' });
      return;
    }

    try {
      await resetMutation.mutateAsync({ token, newPassword: data.password });
      setIsSuccess(true);
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.response?.data?.error || 'The link has expired or is invalid. Please request a new one.',
      });
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50 relative">
      <div className="max-w-md w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 mt-10 lg:mt-0">
        
        <div className="text-center lg:text-left">
          <div className="lg:hidden flex justify-center mb-6">
              <img src="/icons/logomed.png" alt="Logo" className="w-16 h-16" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            New Password
          </h2>
          <p className="mt-3 text-slate-500 font-medium">
            {!isSuccess 
              ? "Create a secure password for your account. It must be at least 6 characters long."
              : "Your security has been updated."}
          </p>
        </div>

        {!token && !isSuccess ? (
          /* --- ERROR: NO TOKEN EN URL --- */
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Invalid Link</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Missing security token. Please ensure you clicked the full link sent to your email.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl text-sm font-bold transition-all">
                Request a new link
              </Button>
            </Link>
          </div>
        ) : !isSuccess ? (
          /* --- FORMULARIO --- */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              
              <div className="relative group transition-all duration-300">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all h-12"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Lock className="absolute right-4 top-[38px] text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>

              <div className="relative group transition-all duration-300">
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all h-12"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <Lock className="absolute right-4 top-[38px] text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>

            </div>

            {errors.root && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 animate-shake">
                <p className="text-sm text-red-600 font-medium">{errors.root.message}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-blue-600 text-white h-14 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-3 group"
              loading={resetMutation.isPending}
            >
              Save Password
              {!resetMutation.isPending && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        ) : (
          /* --- SUCCESS STATE --- */
          <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg shadow-slate-200/50 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Password Updated!</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Your password has been changed successfully. You can now access the platform with your new credentials.
            </p>
            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all">
                Go to Login
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
  );
}

export default function ResetPasswordPage() {
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
              <ShieldCheck size={14} /> SECURE CREDENTIALS
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Data <br /> <span className="text-blue-400">Protection.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed">
              MedBay passwords are stored using military-grade encryption algorithms (bcrypt) to guarantee your organization's total privacy.
            </p>
          </div>

          <p className="text-slate-500 text-sm italic">
            © 2025 MedBay Global Access to Medical Devices.
          </p>
        </div>
      </div>

      {/* --- RIGHT SECTION: WRAPPED IN SUSPENSE FOR NEXT.JS --- */}
      <Suspense fallback={
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>

    </div>
  );
}