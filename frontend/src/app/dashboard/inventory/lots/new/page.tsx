// frontend/src/app/dashboard/inventory/lots/new/page.tsx

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/hooks/useInventory';
import { LotForm } from '@/components/features/inventory/LotForm';

export default function NewLotPage() {
  const router = useRouter();
  const { createLot, loading } = useInventory();

  const handleSubmit = async (lotData: any) => {
    try {
      await createLot(lotData);
      router.push('/dashboard/inventory/lots');
    } catch (error) {
      console.error('Error creating lot:', error);
      throw error; // The form will handle the error
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/inventory/lots');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LotForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}