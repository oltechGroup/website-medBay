// src/app/dashboard/inventory/page.tsx
'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { StockMetrics } from '@/components/features/inventory/StockMetrics';
import { InventoryTabs } from './components/InventoryTabs';
import { ActiveStockTable } from './components/ActiveStockTable';
import { ExpiredStockTable } from './components/ExpiredStockTable';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');
  const { activeLots, expiredLots, isLoading, error } = useInventory();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Cargando inventario...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">Error al cargar el inventario</div>
            <div className="text-red-700 text-sm mt-1">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu stock activo y productos vencidos para uso educativo
          </p>
        </div>

        {/* Métricas */}
        <StockMetrics activeLots={activeLots} expiredLots={expiredLots} />

        {/* Pestañas */}
        <InventoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Contenido de las pestañas */}
        <div className="mt-6">
          {activeTab === 'active' ? (
            <ActiveStockTable lots={activeLots} />
          ) : (
            <ExpiredStockTable lots={expiredLots} />
          )}
        </div>
      </div>
    </div>
  );
}