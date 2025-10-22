'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditExpiryCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const { expiryCategories, updateExpiryCategory, isUpdating, error: categoryError } = useExpiryCategories();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpiryCategoryFormData>();

  // Cargar datos de la categoría cuando estén disponibles
  useEffect(() => {
    if (expiryCategories.length > 0 && categoryId) {
      const category = expiryCategories.find(c => c.id === categoryId);
      if (category) {
        reset({
          name: category.name,
          description: category.description || '',
          days_threshold: category.days_threshold,
          discount_percentage: category.discount_percentage,
          is_active: category.is_active,
          sort_order: category.sort_order,
        });
      }
    }
  }, [expiryCategories, categoryId, reset]);

  const onSubmit = async (data: ExpiryCategoryFormData) => {
    try {
      setError(null);
      await updateExpiryCategory({ id: categoryId, categoryData: data });
      router.push('/dashboard/inventory/expiry-settings');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar la categoría');
      console.error('Error updating expiry category:', err);
    }
  };

  const category = expiryCategories.find(c => c.id === categoryId);

  if (!category && expiryCategories.length > 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Categoría no encontrada</div>
        <Button onClick={() => router.push('/dashboard/inventory/expiry-settings')}>
          Volver a parámetros
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Categoría de Expiración</h1>
          <p className="text-gray-600">Actualiza los parámetros de caducidad</p>
          {category && (
            <p className="text-sm text-gray-500">
              Categoría: {category.name}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || categoryError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (categoryError as any)?.message || 'Error al actualizar la categoría'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Nombre de la Categoría *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es requerido' })}
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
            placeholder="Número para ordenar las categorías"
          />

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              id="is_active"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Categoría activa
            </label>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Información de la Categoría</h4>
          <p className="text-sm text-blue-700">
            Esta categoría se aplicará automáticamente a los productos cuando falten {category?.days_threshold} días para su expiración, 
            aplicando un descuento del {category?.discount_percentage}%.
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
            loading={isUpdating}
          >
            Actualizar Categoría
          </Button>
        </div>
      </form>
    </div>
  );
}