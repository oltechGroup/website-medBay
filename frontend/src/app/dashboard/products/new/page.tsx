// frontend/src/app/dashboard/products/new/page.tsx - UPDATED
'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductForm } from '@/components/features/products/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isCreating, createError } = useProducts();

  const handleSubmit = async (productData: any) => {
    try {
      // ✅ RETURN the created product so the Form can upload the image
      const result = await createProduct(productData);
      return result; // This is passed to the ProductForm
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete the information to add a new product to the inventory
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Back to Products
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