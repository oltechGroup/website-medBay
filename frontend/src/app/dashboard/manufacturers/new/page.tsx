'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ManufacturerForm } from '@/components/features/manufacturers/ManufacturerForm';
import { useManufacturers, CreateManufacturerData } from '@/hooks/useManufacturers';

export default function NewManufacturerPage() {
  const router = useRouter();
  const { createManufacturer, isCreating } = useManufacturers();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateManufacturerData) => {
    try {
      setError(null);
      await createManufacturer(data);
      // Redirigir a la lista después de crear exitosamente
      router.push('/dashboard/manufacturers');
    } catch (err: any) {
      console.error('Error al crear fabricante:', err);
      setError(
        err.response?.data?.error || 
        'Error al crear el fabricante. Por favor, intenta de nuevo.'
      );
    }
  };

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
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
        />
      </div>
    </div>
  );
}