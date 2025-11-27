// frontend/src/app/dashboard/products/edit/[id]/page.tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductForm } from '@/components/features/products/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { products, updateProduct, isUpdating, updateError } = useProducts();
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  useEffect(() => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentProduct(product);
    }
  }, [products, productId]);

  const handleSubmit = async (productData: any) => {
    try {
      const result = await updateProduct({ id: productId, productData });
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  if (!currentProduct) {
    return (
      <div className="min-h-96 flex justify-center items-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="mt-1 text-sm text-gray-600">
            Actualiza la información del producto
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
        product={currentProduct}
        onSubmit={handleSubmit}
        isSubmitting={isUpdating}
        submitError={updateError?.message}
        mode="edit"
      />
    </div>
  );
}