'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCategories } from '@/hooks/useCategories';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface CategoryFormData {
  name: string;
  parent_id: string;
  slug: string;
  description: string;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const { createCategory, isCreating, createError } = useCategories();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>();

  const parentCategoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setError(null);
      // Convertir empty string a undefined para parent_id
      const categoryData = {
        ...data,
        parent_id: data.parent_id || undefined
      };
      await createCategory(categoryData);
      router.push('/dashboard/categories');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la categoría');
      console.error('Error creating category:', err);
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
          <h1 className="text-2xl font-bold text-gray-900">Agregar Categoría</h1>
          <p className="text-gray-600">Registra una nueva categoría para productos médicos</p>
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
          />

          <Input
            label="Slug (URL)"
            error={errors.slug?.message}
            {...register('slug')}
            placeholder="Ej: medicamentos, equipo-medico"
          />

          <Select
            label="Categoría Padre (Opcional)"
            error={errors.parent_id?.message}
            options={[{ value: '', label: 'Ninguna (Categoría principal)' }, ...parentCategoryOptions]}
            {...register('parent_id')}
            disabled={categoriesLoading}
          />

          <Input
            label="Descripción"
            error={errors.description?.message}
            {...register('description')}
          />
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
            loading={isCreating || categoriesLoading}
          >
            Crear Categoría
          </Button>
        </div>
      </form>
    </div>
  );
}