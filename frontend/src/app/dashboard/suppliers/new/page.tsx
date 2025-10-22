'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useSuppliers } from '@/hooks/useSuppliers';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface SupplierFormData {
  name: string;
  tax_id: string;
  country: string;
  default_currency: string;
  contact_info: {
    phone: string;
    email: string;
    address: string;
    contact_person: string;
  };
}

export default function NewSupplierPage() {
  const router = useRouter();
  const { createSupplier, isCreating, createError } = useSuppliers();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>();

  const onSubmit = async (data: SupplierFormData) => {
    try {
      setError(null);
      // Limpiar campos vacíos en contact_info
      const contactInfo = Object.fromEntries(
        Object.entries(data.contact_info).filter(([_, value]) => value !== '')
      );
      await createSupplier({ ...data, contact_info: contactInfo });
      router.push('/dashboard/suppliers');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el proveedor');
      console.error('Error creating supplier:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Proveedor</h1>
          <p className="text-gray-600">Registra un nuevo proveedor de productos médicos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || createError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (createError as any)?.message || 'Error al crear el proveedor'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            label="Nombre del Proveedor *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es requerido' })}
          />

          <Input
            label="RFC / Tax ID"
            error={errors.tax_id?.message}
            {...register('tax_id')}
          />

          <Input
            label="País"
            error={errors.country?.message}
            {...register('country')}
            placeholder="Ej: MX, US"
          />

          <Select
            label="Moneda por Defecto"
            options={[
              { value: 'MXN', label: 'MXN - Peso Mexicano' },
              { value: 'USD', label: 'USD - Dólar Americano' },
            ]}
            {...register('default_currency')}
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Teléfono"
              error={errors.contact_info?.phone?.message}
              {...register('contact_info.phone')}
            />

            <Input
              label="Email"
              type="email"
              error={errors.contact_info?.email?.message}
              {...register('contact_info.email')}
            />

            <Input
              label="Persona de Contacto"
              error={errors.contact_info?.contact_person?.message}
              {...register('contact_info.contact_person')}
            />

            <Input
              label="Dirección"
              error={errors.contact_info?.address?.message}
              {...register('contact_info.address')}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isCreating}
          >
            Crear Proveedor
          </Button>
        </div>
      </form>
    </div>
  );
}