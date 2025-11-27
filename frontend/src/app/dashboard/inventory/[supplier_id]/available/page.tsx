// frontend/src/app/dashboard/inventory/[supplier_id]/available/page.tsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Package } from 'lucide-react';
import { CatalogView } from '@/components/features/inventory/CatalogView';

export default function AvailableCatalogPage() {
  const params = useParams();
  const supplierId = params.supplier_id as string;

  return (
    <CatalogView
      supplierId={supplierId}
      status="available"
      title="Lotes en Fecha"
      description="Lotes con fecha de caducidad vigente del proveedor"
      colorScheme={{
        primary: 'green',
        icon: Package,
        defaultSort: 'name'
      }}
    />
  );
}