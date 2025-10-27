'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterFormData, registerSchema } from '@/lib/validations';
import { useRegister } from '@/hooks/useApi';
// ✅ Cambiado a componentes ui unificados
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
      // Remover confirmPassword antes de enviar
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">MB</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              inicia sesión en tu cuenta
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Nombre Completo"
              type="text"
              autoComplete="name"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Empresa (Opcional)"
              type="text"
              autoComplete="organization"
              error={errors.company_name?.message}
              {...register('company_name')}
            />
            <Input
              label="RFC/TAX ID (Opcional)"
              type="text"
              error={errors.tax_id?.message}
              {...register('tax_id')}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar Contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <input type="hidden" {...register('verification_level')} />
            <input type="hidden" {...register('country')} />
          </div>

          {errors.root && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.root.message}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={registerMutation.isPending}
          >
            Crear Cuenta
          </Button>
        </form>
      </div>
    </div>
  );
}