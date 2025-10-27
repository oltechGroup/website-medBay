'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useProducts } from '@/hooks/useProducts';
import { useManufacturers } from '@/hooks/useManufacturers';
import { useCategories } from '@/hooks/useCategories';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

// ✅ CORREGIDO: Usar UpdateProductData del hook
interface ProductFormData {
  name: string;
  description: string;
  manufacturer_id: string;
  global_sku: string;
  avalara_tax_code: string;
  requires_license: boolean;
  prescription_required: boolean;
  export_restricted: boolean;
  category_ids: string[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { products, updateProduct, isUpdating, updateError } = useProducts();
  const { manufacturers, isLoading: manufacturersLoading } = useManufacturers();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    defaultValues: {
      requires_license: false,
      prescription_required: false,
      export_restricted: false,
      manufacturer_id: '',
      category_ids: [],
    },
  });

  const manufacturerOptions = manufacturers?.map(manufacturer => ({
    value: manufacturer.id,
    label: `${manufacturer.name} (${manufacturer.country_name || 'País no especificado'})`
  })) || [];

  const categoryOptions = categories?.map(category => ({
    value: category.id,
    label: category.name
  })) || [];

  const selectedCategories = watch('category_ids', []);

  // Cargar datos del producto - CORREGIDO
  useEffect(() => {
    if (products && id && categories) {
      const product = products.find(p => p.id === id);
      if (product) {
        setValue('name', product.name);
        setValue('description', product.description || '');
        setValue('manufacturer_id', product.manufacturer_id || '');
        setValue('global_sku', product.global_sku || '');
        setValue('avalara_tax_code', product.avalara_tax_code || '');
        setValue('requires_license', product.requires_license || false);
        setValue('prescription_required', product.prescription_required || false);
        setValue('export_restricted', product.export_restricted || false);
        
        // ✅ CORREGIDO: Si el producto viene con category_ids, usarlos directamente
        // Si no, intentar mapear desde categories (nombres) a IDs
        let categoryIds: string[] = [];
        
        if (product.category_ids) {
          // Si el backend ya devuelve category_ids
          categoryIds = product.category_ids;
        } else if (product.categories && categories) {
          // Mapear nombres de categorías a IDs
          categoryIds = product.categories
            .map(categoryName => {
              const category = categories.find(cat => cat.name === categoryName);
              return category?.id;
            })
            .filter((id): id is string => id !== undefined);
        }
        
        setValue('category_ids', categoryIds);
        setIsLoading(false);
      } else {
        router.push('/dashboard/products');
      }
    }
  }, [products, id, categories, router, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setError(null);
      
      // ✅ CORREGIDO: Usar UpdateProductData correctamente
      await updateProduct({
        id,
        productData: {
          name: data.name,
          description: data.description,
          manufacturer_id: data.manufacturer_id,
          global_sku: data.global_sku,
          avalara_tax_code: data.avalara_tax_code,
          requires_license: data.requires_license,
          prescription_required: data.prescription_required,
          export_restricted: data.export_restricted,
          category_ids: data.category_ids
        }
      });
      
      router.push('/dashboard/products');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el producto');
      console.error('Error updating product:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editando Producto</h1>
            <p className="text-gray-600">Cargando información del producto...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Cargando producto...</div>
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="text-gray-600">Actualiza la información del producto médico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || updateError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (updateError as any)?.message || 'Error al actualizar el producto'}
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

          <div className="sm:col-span-2">
            <MultiSelect
              label="Categorías"
              options={categoryOptions}
              value={selectedCategories}
              onChange={(value) => setValue('category_ids', value)}
              placeholder="Seleccionar categorías..."
            />
            {categoriesLoading && (
              <div className="text-sm text-gray-500 mt-1">Cargando categorías...</div>
            )}
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
            loading={isUpdating || manufacturersLoading || categoriesLoading}
          >
            Actualizar Producto
          </Button>
        </div>
      </form>
    </div>
  );
}