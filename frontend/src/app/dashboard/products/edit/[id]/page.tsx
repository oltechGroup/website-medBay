// frontend/src/app/dashboard/products/edit/[id]/page.tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductForm } from '@/components/features/products/ProductForm';
import { api } from '@/lib/api'; // ✅ Importamos api para la carga directa

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { updateProduct, isUpdating, updateError } = useProducts();
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NUEVA LÓGICA: Carga directa desde la API
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      
      try {
        setIsLoadingProduct(true);
        // Solicitamos el producto específico al backend para evitar depender de la lista paginada
        const response = await api.get(`/products/${productId}`);
        setCurrentProduct(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error loading product details:', err);
        setError('Could not load product information.');
      } finally {
        setIsLoadingProduct(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleSubmit = async (productData: any) => {
    try {
      const result = await updateProduct({ id: productId, productData });
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  // Estado de carga
  if (isLoadingProduct) {
    return (
      <div className="min-h-96 flex justify-center items-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-600 tracking-wide uppercase">Fetching product data...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !currentProduct) {
    return (
      <div className="min-h-96 flex justify-center items-center">
        <div className="text-center bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Product not found</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">{error || "The product you're trying to edit doesn't exist or has been removed."}</p>
          <button 
            onClick={() => router.push('/dashboard/products')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Return to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Edit Product</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Modify details and manage image gallery
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
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