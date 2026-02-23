//fronted/src/app/(auth)/login/page.tsx
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
      // 1. Execute mutation (this saves cookies and updates Zustand)
      const response = await loginMutation.mutateAsync(data);
      
      const user = response.user;

      // ✅ THE DEFINITIVE SOLUTION: 
      // We use window.location.href instead of router.push().
      // This forces a full browser reload, forcing the Middleware 
      // and all protected pages to read fresh cookies from the start.
      
      const targetPath = user.verification_level === 'admin' ? '/dashboard' : '/';

      // We add a tiny delay (100ms) to ensure the 
      // browser finished writing cookies before jumping.
      setTimeout(() => {
        window.location.href = targetPath;
      }, 100);

    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.response?.data?.error || 'Login failed',
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
              <ShieldCheck size={14} /> SECURE B2B ACCESS
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Clinical-Grade <br /> <span className="text-blue-400">Platform.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed">
              Log in to manage medical supplies, lot traceability, and strategic procurement.
            </p>
          </div>

          <p className="text-slate-500 text-sm italic">
            © 2025 MedBay Global Access to Medical Devices.
          </p>
        </div>
      </div>

      {/* --- RIGHT SECTION: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
        <div className="max-w-md w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
          
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
                <img src="/icons/logomed.png" alt="Logo" className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-slate-500 font-medium">
              Don't have an account? {' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline transition-all">
                Register here
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <Input
                label="Corporate Email"
                type="email"
                placeholder="example@medbay.com"
                className="bg-white border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-xl transition-all h-12"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="relative group transition-all duration-300">
                <Input
                  label="Password"
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
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-blue-600 text-white h-14 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-3 group"
              loading={loginMutation.isPending}
            >
              Log In
              {!loginMutation.isPending && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

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