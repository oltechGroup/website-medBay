'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useProductLots } from '@/hooks/useProductLots';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface ProductLotFormData {
  product_supplier_id: string;
  lot_number: string;
  expiry_date: string;
  quantity: number;
  unit: string;
  price_amount: number;
  price_currency: string;
  discount_price_amount: number;
  discount_price_currency: string;
  sales_category: 'regular' | 'near_expiry' | 'expired';
  manual_discount: boolean;
  received_at: string;
  status: 'available' | 'reserved' | 'expired' | 'near_expiry' | 'quarantine';
}

export default function NewProductLotPage() {
  const router = useRouter();
  const { createProductLot, isCreating, createError } = useProductLots();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { products, isLoading: productsLoading } = useProducts();
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductLotFormData>({
    defaultValues: {
      sales_category: 'regular',
      manual_discount: false,
      status: 'available',
      price_currency: 'MXN',
      discount_price_currency: 'MXN',
      received_at: new Date().toISOString().split('T')[0],
    },
  });

  // Filtrar proveedores que ofrecen el producto seleccionado
  const productSuppliers = selectedProductId 
    ? suppliers.filter(supplier => 
        // Aquí asumimos que hay una relación entre productos y proveedores
        // En una implementación real, necesitarías un endpoint para obtener los proveedores de un producto
        true // Por ahora, mostramos todos los proveedores
      )
    : [];

  const onSubmit = async (data: ProductLotFormData) => {
    try {
      setError(null);
      await createProductLot(data);
      router.push('/dashboard/inventory');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el lote');
      console.error('Error creating product lot:', err);
    }
  };

  const salesCategory = watch('sales_category');
  const manualDiscount = watch('manual_discount');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Lote</h1>
          <p className="text-gray-600">Registra un nuevo lote en el inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || createError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (createError as any)?.message || 'Error al crear el lote'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Select
            label="Producto *"
            error={errors.product_supplier_id?.message}
            options={products.map(product => ({
              value: product.id,
              label: product.name
            }))}
            onChange={(e) => setSelectedProductId(e.target.value)}
            disabled={productsLoading}
          />

          <Select
            label="Proveedor *"
            error={errors.product_supplier_id?.message}
            options={productSuppliers.map(supplier => ({
              value: supplier.id,
              label: supplier.name
            }))}
            {...register('product_supplier_id', { required: 'El proveedor es requerido' })}
            disabled={suppliersLoading || !selectedProductId}
          />

          <Input
            label="Número de Lote *"
            error={errors.lot_number?.message}
            {...register('lot_number', { required: 'El número de lote es requerido' })}
          />

          <Input
            label="Fecha de Expiración *"
            type="date"
            error={errors.expiry_date?.message}
            {...register('expiry_date', { required: 'La fecha de expiración es requerida' })}
          />

          <Input
            label="Cantidad *"
            type="number"
            error={errors.quantity?.message}
            {...register('quantity', { 
              required: 'La cantidad es requerida',
              min: { value: 1, message: 'La cantidad debe ser mayor a 0' }
            })}
          />

          <Input
            label="Unidad *"
            error={errors.unit?.message}
            {...register('unit', { required: 'La unidad es requerida' })}
            placeholder="Ej: caja, pieza, botella"
          />

          <Input
            label="Precio *"
            type="number"
            step="0.01"
            error={errors.price_amount?.message}
            {...register('price_amount', { 
              required: 'El precio es requerido',
              min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
            })}
          />

          <Select
            label="Moneda *"
            options={[
              { value: 'MXN', label: 'MXN - Peso Mexicano' },
              { value: 'USD', label: 'USD - Dólar Americano' },
            ]}
            {...register('price_currency', { required: 'La moneda es requerida' })}
          />

          <div className="sm:col-span-2">
            <Select
              label="Categoría de Venta"
              options={[
                { value: 'regular', label: 'Regular' },
                { value: 'near_expiry', label: 'Near Expiry' },
                { value: 'expired', label: 'Expirado' },
              ]}
              {...register('sales_category')}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('manual_discount')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Aplicar descuento manual</span>
            </label>
          </div>

          {manualDiscount && (
            <>
              <Input
                label="Precio con Descuento"
                type="number"
                step="0.01"
                error={errors.discount_price_amount?.message}
                {...register('discount_price_amount', { 
                  min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
                })}
              />

              <Select
                label="Moneda Descuento"
                options={[
                  { value: 'MXN', label: 'MXN - Peso Mexicano' },
                  { value: 'USD', label: 'USD - Dólar Americano' },
                ]}
                {...register('discount_price_currency')}
              />
            </>
          )}

          <Select
            label="Estado"
            options={[
              { value: 'available', label: 'Disponible' },
              { value: 'reserved', label: 'Reservado' },
              { value: 'expired', label: 'Expirado' },
              { value: 'near_expiry', label: 'Near Expiry' },
              { value: 'quarantine', label: 'Cuarentena' },
            ]}
            {...register('status')}
          />

          <Input
            label="Fecha de Recepción"
            type="date"
            error={errors.received_at?.message}
            {...register('received_at')}
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
            loading={isCreating || suppliersLoading || productsLoading}
          >
            Crear Lote
          </Button>
        </div>
      </form>
    </div>
  );
}