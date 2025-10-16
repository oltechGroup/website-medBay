'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useProducts } from '@/hooks/useProducts';
import { useManufacturers } from '@/hooks/useManufacturers';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  manufacturer_id: string;
  global_sku: string;
  avalara_tax_code: string;
  requires_license: boolean;
  prescription_required: boolean;
  export_restricted: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isCreating, createError } = useProducts();
  const { manufacturers, isLoading: manufacturersLoading } = useManufacturers();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    defaultValues: {
      requires_license: false,
      prescription_required: false,
      export_restricted: false,
      manufacturer_id: '',
    },
  });

  const manufacturerOptions = manufacturers.map(manufacturer => ({
    value: manufacturer.id,
    label: `${manufacturer.name} (${manufacturer.country})`
  }));

  const onSubmit = async (data: ProductFormData) => {
    try {
      setError(null);
      await createProduct(data);
      router.push('/dashboard/products');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el producto');
      console.error('Error creating product:', err);
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
          <h1 className="text-2xl font-bold text-gray-900">Agregar Producto</h1>
          <p className="text-gray-600">Completa la información del nuevo producto médico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || createError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (createError as any)?.message || 'Error al crear el producto'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            label="Nombre del Producto *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es requerido' })}
          />

          <Input
            label="SKU Global"
            error={errors.global_sku?.message}
            {...register('global_sku')}
          />

          <Select
            label="Fabricante"
            error={errors.manufacturer_id?.message}
            options={manufacturerOptions}
            {...register('manufacturer_id')}
            disabled={manufacturersLoading}
          />

          {manufacturersLoading && (
            <div className="text-sm text-gray-500">Cargando fabricantes...</div>
          )}

          <Input
            label="Código de Impuestos Avalara"
            error={errors.avalara_tax_code?.message}
            {...register('avalara_tax_code')}
          />

          <div className="sm:col-span-2">
            <Input
              label="Descripción"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900">Requisitos Especiales</h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('requires_license')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Requiere licencia médica</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('prescription_required')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Requiere receta médica</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('export_restricted')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Restringido para exportación</span>
            </label>
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
            loading={isCreating || manufacturersLoading}
          >
            Crear Producto
          </Button>
        </div>
      </form>
    </div>
  );
}