// frontend/src/app/dashboard/inventory/[supplier_id]/equipment/page.tsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Stethoscope } from 'lucide-react';
import { CatalogView } from '@/components/features/inventory/CatalogView';

export default function EquipmentCatalogPage() {
  const params = useParams();
  const supplierId = params.supplier_id as string;

  return (
    <CatalogView
      supplierId={supplierId}
      status="equipment"
      title="Equipment & Instruments"
      description="Medical devices and durable equipment from this supplier"
      colorScheme={{
        primary: 'blue',
        icon: Stethoscope,
        defaultSort: 'name'
      }}
    />
  );
}