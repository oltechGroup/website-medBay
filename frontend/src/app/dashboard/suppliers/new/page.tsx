//frontend/src/app/dashboard/suppliers/new/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useSuppliers } from '@/hooks/useSuppliers';
import SupplierForm from '@/components/features/suppliers/SupplierForm';
import { CreateSupplierData } from '@/hooks/useSuppliers';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useState } from 'react';

export default function NewSupplierPage() {
  const router = useRouter();
  const { createSupplier, isCreating } = useSuppliers();
  const [serverError, setServerError] = useState<string>('');

  const handleSubmit = async (data: CreateSupplierData) => {
    setServerError('');
    try {
      await createSupplier(data);
      router.push('/dashboard/suppliers');
    } catch (error: any) {
      // ✅ CAPTURE SPECIFIC SERVER ERROR
      const errorMessage = error.response?.data?.error || 'Error creating the supplier';
      setServerError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/suppliers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Supplier</h1>
          <p className="text-gray-600 mt-2">Complete the new supplier's information</p>
        </div>
      </div>

      {/* ✅ SHOW GENERAL ERROR IF ANY */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {serverError}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Supplier Information</h2>
          <p className="text-gray-600 text-sm mt-1">
            All fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>
        <div className="p-6">
          <SupplierForm
            onSubmit={handleSubmit}
            isLoading={isCreating}
            error={serverError}
          />
        </div>
      </div>

      {/* Additional information */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Important information</h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• The <strong>supplier name</strong> is required and must be unique in the system</li>
          <li>• The <strong>country is required</strong> - it will determine the supplier's currency</li>
          <li>• If you try to create a supplier with an existing name, the system will notify you</li>
          <li>• Inactive suppliers will not appear in selection lists</li>
          <li>• You can complete the contact information later if necessary</li>
        </ul>
      </div>
    </div>
  );
}