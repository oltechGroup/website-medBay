'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditProductLotPage() {
  const router = useRouter();
  const params = useParams();
  const lotId = params.id as string;
  
  const { productLots, updateProductLot, isUpdating, error: lotError } = useProductLots();
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
    reset,
  } = useForm<ProductLotFormData>();

  // Cargar datos del lote cuando estén disponibles
  useEffect(() => {
    if (productLots.length > 0 && lotId) {
      const lot = productLots.find(l => l.id === lotId);
      if (lot) {
        reset({
          product_supplier_id: lot.product_supplier_id,
          lot_number: lot.lot_number,
          expiry_date: lot.expiry_date.split('T')[0],
          quantity: lot.quantity,
          unit: lot.unit,
          price_amount: lot.price_amount,
          price_currency: lot.price_currency,
          discount_price_amount: lot.discount_price_amount || 0,
          discount_price_currency: lot.discount_price_currency || 'MXN',
          sales_category: lot.sales_category,
          manual_discount: lot.manual_discount,
          received_at: lot.received_at ? lot.received_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: lot.status,
        });
        // También podrías establecer el producto seleccionado basado en el lote
        setSelectedProductId(lot.product_supplier_id); // Esto es una simplificación
      }
    }
  }, [productLots, lotId, reset]);

  const productSuppliers = selectedProductId 
    ? suppliers.filter(supplier => true) // Misma lógica que en new
    : [];

  const onSubmit = async (data: ProductLotFormData) => {
    try {
      setError(null);
      await updateProductLot({ id: lotId, lotData: data });
      router.push('/dashboard/inventory');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el lote');
      console.error('Error updating product lot:', err);
    }
  };

  const salesCategory = watch('sales_category');
  const manualDiscount = watch('manual_discount');
  const lot = productLots.find(l => l.id === lotId);

  if (!lot && productLots.length > 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Lote no encontrado</div>
        <Button onClick={() => router.push('/dashboard/inventory')}>
          Volver a inventario
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Lote</h1>
          <p className="text-gray-600">Actualiza la información del lote de inventario</p>
          {lot && (
            <p className="text-sm text-gray-500">
              Producto: {lot.product_name} • Lote: {lot.lot_number}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || lotError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (lotError as any)?.message || 'Error al actualizar el lote'}
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
            loading={isUpdating || suppliersLoading || productsLoading}
          >
            Actualizar Lote
          </Button>
        </div>
      </form>
    </div>
  );
}