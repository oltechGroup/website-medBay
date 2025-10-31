'use client';

import { useState } from 'react';
import { useImport } from '@/hooks/useImport';
import { useSuppliers } from '@/hooks/useSuppliers';
import { UploadWizard } from './components/UploadWizard';

export default function ImportPage() {
  const { suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const [session, setSession] = useState({
    id: '1',
    status: 'selecting' as const,
    sales_category: 'regular' as const,
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">🚀 Carga Masiva de Catálogos</h1>
        <p className="text-gray-600 mt-2">
          Sube catálogos Excel y actualiza automáticamente el inventario
        </p>
      </div>

      {/* Panel de Carga */}
      <div className="max-w-4xl mx-auto">
        <UploadWizard
          session={session}
          setSession={setSession}
          suppliers={suppliers} // ✅ Ahora siempre es un array (vacío o con datos)
          suppliersLoading={suppliersLoading}
        />
      </div>

      {/* Información del proceso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800">💡 ¿Cómo funciona?</h3>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>1. <strong>Selecciona proveedor</strong> - Existente o crea uno nuevo rápido</li>
          <li>2. <strong>Elige categoría</strong> - En fecha, Fecha corta o Caducados</li>
          <li>3. <strong>Limpia</strong> - Borra el catálogo anterior del proveedor</li>
          <li>4. <strong>Sube Excel</strong> - Procesa y crea productos automáticamente</li>
        </ul>
      </div>
    </div>
  );
}