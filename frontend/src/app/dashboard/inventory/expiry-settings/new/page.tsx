'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useExpiryCategories } from '@/hooks/useExpiryCategories';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface ExpiryCategoryFormData {
  name: string;
  description: string;
  days_threshold: number;
  discount_percentage: number;
  is_active: boolean;
  sort_order: number;
}

export default function NewExpiryCategoryPage() {
  const router = useRouter();
  const { createExpiryCategory, isCreating, createError } = useExpiryCategories();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpiryCategoryFormData>({
    defaultValues: {
      is_active: true,
      sort_order: 0,
      days_threshold: 30,
      discount_percentage: 20,
    },
  });

  const onSubmit = async (data: ExpiryCategoryFormData) => {
    try {
      setError(null);
      await createExpiryCategory(data);
      router.push('/dashboard/inventory/expiry-settings');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la categoría');
      console.error('Error creating expiry category:', err);
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
          <h1 className="text-2xl font-bold text-gray-900">Agregar Categoría de Expiración</h1>
          <p className="text-gray-600">Crea una nueva categoría para productos near expiry o expirados</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || createError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (createError as any)?.message || 'Error al crear la categoría'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Nombre de la Categoría *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es requerido' })}
            placeholder="Ej: Near Expiry, Short Dated, Expired"
          />

          <Input
            label="Descripción"
            error={errors.description?.message}
            {...register('description')}
            placeholder="Describe el propósito de esta categoría"
          />

          <Input
            label="Umbral en Días *"
            type="number"
            error={errors.days_threshold?.message}
            {...register('days_threshold', { 
              required: 'El umbral es requerido',
              min: { value: 0, message: 'El umbral debe ser mayor o igual a 0' }
            })}
            placeholder="Ej: 30 para 30 días antes de la expiración"
          />

          <Input
            label="Porcentaje de Descuento *"
            type="number"
            step="0.01"
            error={errors.discount_percentage?.message}
            {...register('discount_percentage', { 
              required: 'El porcentaje de descuento es requerido',
              min: { value: 0, message: 'El descuento debe ser mayor o igual a 0' },
              max: { value: 100, message: 'El descuento no puede ser mayor a 100%' }
            })}
            placeholder="Ej: 25.5 para 25.5% de descuento"
          />

          <Input
            label="Orden de Clasificación"
            type="number"
            error={errors.sort_order?.message}
            {...register('sort_order', { 
              min: { value: 0, message: 'El orden debe ser mayor o igual a 0' }
            })}
            placeholder="Número para ordenar las categorías (menor = primero)"
          />

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              id="is_active"
              defaultChecked
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Categoría activa
            </label>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">¿Cómo funciona?</h4>
          <p className="text-sm text-blue-700">
            Cuando un producto esté a X días de su fecha de expiración (donde X es el umbral que configures), 
            se moverá automáticamente a esta categoría y se aplicará el descuento especificado.
          </p>
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
            Crear Categoría
          </Button>
        </div>
      </form>
    </div>
  );
}