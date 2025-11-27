// frontend/src/app/dashboard/products/upload-images/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductImageUpload } from '@/components/features/products/ProductImageUpload';

export default function UploadImagesPage() {
  const router = useRouter();
  const { productsWithoutImages, isProductsWithoutImagesLoading } = useProducts();

  const handleUploadComplete = () => {
    // Podríamos recargar los datos o mostrar un mensaje de éxito
    console.log('Upload completed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subir Imágenes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Asigna imágenes a productos que no tienen imágenes
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Volver a Productos
        </button>
      </div>

      {isProductsWithoutImagesLoading ? (
        <div className="min-h-96 flex justify-center items-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600">Cargando productos sin imágenes...</p>
          </div>
        </div>
      ) : (
        <ProductImageUpload
          productsWithoutImages={productsWithoutImages || []}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}