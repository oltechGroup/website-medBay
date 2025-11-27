'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ManufacturerForm } from '@/components/features/manufacturers/ManufacturerForm';
import { useManufacturers, UpdateManufacturerData } from '@/hooks/useManufacturers';

export default function EditManufacturerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { 
    manufacturers, 
    updateManufacturer, 
    isUpdating 
  } = useManufacturers();
  
  const [manufacturer, setManufacturer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar el fabricante por ID
  useEffect(() => {
    if (manufacturers.length > 0) {
      const foundManufacturer = manufacturers.find(m => m.id === id);
      if (foundManufacturer) {
        setManufacturer(foundManufacturer);
      } else {
        setError('Fabricante no encontrado');
      }
      setIsLoading(false);
    }
  }, [manufacturers, id]);

  const handleSubmit = async (data: UpdateManufacturerData) => {
    try {
      setError(null);
      await updateManufacturer({ id, data });
      // Redirigir a la lista después de actualizar exitosamente
      router.push('/dashboard/manufacturers');
    } catch (err: any) {
      console.error('Error al actualizar fabricante:', err);
      setError(
        err.response?.data?.error || 
        'Error al actualizar el fabricante. Por favor, intenta de nuevo.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !manufacturer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Fabricante no encontrado</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard/manufacturers')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Volver a Fabricantes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mostrar error general */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <ManufacturerForm
          manufacturer={manufacturer}
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
        />
      </div>
    </div>
  );
}