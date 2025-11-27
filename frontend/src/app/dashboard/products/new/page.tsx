// frontend/src/app/dashboard/products/new/page.tsx - ACTUALIZADO
'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductForm } from '@/components/features/products/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isCreating, createError } = useProducts();

  const handleSubmit = async (productData: any) => {
    try {
      // ✅ DEVOLVER el producto creado para que el Form pueda subir la imagen
      const result = await createProduct(productData);
      return result; // Esto se pasa al ProductForm
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Producto</h1>
          <p className="mt-1 text-sm text-gray-600">
            Completa la información para agregar un nuevo producto al inventario
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Volver a Productos
        </button>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        isSubmitting={isCreating}
        submitError={createError?.message}
        mode="create"
      />
    </div>
  );
}