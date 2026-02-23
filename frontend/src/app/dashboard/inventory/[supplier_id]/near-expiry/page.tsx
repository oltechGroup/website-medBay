// frontend/src/app/dashboard/inventory/[supplier_id]/near-expiry/page.tsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { CatalogView } from '@/components/features/inventory/CatalogView';

export default function NearExpiryCatalogPage() {
  const params = useParams();
  const supplierId = params.supplier_id as string;

  return (
    <CatalogView
      supplierId={supplierId}
      status="near_expiry"
      title="Short-Dated Lots"
      description="Lots nearing expiration from the supplier"
      colorScheme={{
        primary: 'amber',
        icon: Calendar,
        defaultSort: 'expiry'
      }}
    />
  );
}