// frontend/src/app/dashboard/inventory/[supplier_id]/expired/page.tsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { CatalogView } from '@/components/features/inventory/CatalogView';

export default function ExpiredCatalogPage() {
  const params = useParams();
  const supplierId = params.supplier_id as string;

  return (
    <CatalogView
      supplierId={supplierId}
      status="expired"
      title="Lotes Caducados"
      description="Lotes vencidos del proveedor"
      colorScheme={{
        primary: 'red',
        icon: Calendar,
        defaultSort: 'expiry'
      }}
    />
  );
}