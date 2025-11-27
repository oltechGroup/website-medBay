// frontend/src/app/dashboard/inventory/lots/[id]/edit/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventory } from '@/hooks/useInventory';
import { LotForm } from '@/components/features/inventory/LotForm';

export default function EditLotPage() {
  const params = useParams();
  const router = useRouter();
  const { getLotById, updateLot, loading } = useInventory();
  
  const [lot, setLot] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadLot();
  }, [params.id]);

  const loadLot = async () => {
    try {
      const lotData = await getLotById(params.id as string);
      setLot(lotData);
    } catch (error) {
      console.error('Error loading lot:', error);
      router.push('/dashboard/inventory/lots');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (lotData: any) => {
    try {
      await updateLot(params.id as string, lotData);
      router.push('/dashboard/inventory/lots');
    } catch (error) {
      console.error('Error updating lot:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/inventory/lots');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lote no encontrado</h2>
            <p className="text-gray-600 mb-8">El lote que intentas editar no existe.</p>
            <button
              onClick={() => router.push('/dashboard/inventory/lots')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver a la gestión de lotes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LotForm
          lot={lot}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}