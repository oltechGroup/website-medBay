'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const { categories, updateCategory, isUpdating, error: categoryError } = useCategories();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>();

  // Cargar datos de la categoría cuando estén disponibles
  useEffect(() => {
    if (categories.length > 0 && categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        reset({
          name: category.name,
          parent_id: category.parent_id || '',
          slug: category.slug || '',
          description: category.description || '',
        });
      }
    }
  }, [categories, categoryId, reset]);

  const parentCategoryOptions = categories
    .filter(c => c.id !== categoryId) // Excluir la categoría actual para evitar ciclos
    .map(category => ({
      value: category.id,
      label: category.name
    }));

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setError(null);
      const categoryData = {
        ...data,
        parent_id: data.parent_id || undefined
      };
      await updateCategory({ id: categoryId, categoryData });
      router.push('/dashboard/categories');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar la categoría');
      console.error('Error updating category:', err);
    }
  };

  const category = categories.find(c => c.id === categoryId);

  if (!category && categories.length > 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Categoría no encontrada</div>
        <Button onClick={() => router.push('/dashboard/categories')}>
          Volver a categorías
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Categoría</h1>
          <p className="text-gray-600">Actualiza la información de la categoría</p>
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
            loading={isUpdating}
          >
            Actualizar Categoría
          </Button>
        </div>
      </form>
    </div>
  );
}