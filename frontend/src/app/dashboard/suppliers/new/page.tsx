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
      // ✅ CAPTURAR ERROR ESPECÍFICO DEL SERVIDOR
      const errorMessage = error.response?.data?.error || 'Error al crear el proveedor';
      setServerError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/suppliers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agregar Proveedor</h1>
          <p className="text-gray-600 mt-2">Completa la información del nuevo proveedor</p>
        </div>
      </div>

      {/* ✅ MOSTRAR ERROR GENERAL SI HAY */}
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

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Información del Proveedor</h2>
          <p className="text-gray-600 text-sm mt-1">
            Todos los campos marcados con <span className="text-red-500">*</span> son obligatorios
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

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Información importante</h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• El <strong>nombre del proveedor</strong> es obligatorio y debe ser único en el sistema</li>
          <li>• El <strong>país es obligatorio</strong> - determinará la moneda del proveedor</li>
          <li>• Si intentas crear un proveedor con un nombre ya existente, el sistema te avisará</li>
          <li>• Los proveedores inactivos no aparecerán en las listas de selección</li>
          <li>• Puedes completar la información de contacto más tarde si es necesario</li>
        </ul>
      </div>
    </div>
  );
}