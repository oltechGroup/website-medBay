'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSuppliers } from '@/hooks/useSuppliers';
import SupplierForm from '@/components/features/suppliers/SupplierForm';
import { UpdateSupplierData } from '@/hooks/useSuppliers';
import { ArrowLeft, Building } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const { suppliers = [], updateSupplier, isUpdating } = useSuppliers();
  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState<string>('');

  useEffect(() => {
    if (suppliers && params.id) {
      const foundSupplier = suppliers.find(s => s.id === params.id);
      setSupplier(foundSupplier || null);
      setIsLoading(false);
    }
  }, [suppliers, params.id]);

  const handleSubmit = async (data: UpdateSupplierData) => {
    if (!supplier) return;
    
    setServerError('');
    try {
      await updateSupplier({ id: supplier.id, data });
      router.push('/dashboard/suppliers');
    } catch (error: any) {
      // ✅ CAPTURAR ERROR ESPECÍFICO DEL SERVIDOR
      const errorMessage = error.response?.data?.error || 'Error al actualizar el proveedor';
      setServerError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del proveedor...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proveedor no encontrado</h2>
          <p className="text-gray-600 mb-6">El proveedor que buscas no existe o fue eliminado.</p>
          <Link href="/dashboard/suppliers">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proveedores
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Editar Proveedor</h1>
          <p className="text-gray-600 mt-2">Actualiza la información de {supplier.name}</p>
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

      {/* Información actual */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Actual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Nombre:</span>
            <p className="text-gray-900">{supplier.name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">País:</span>
            <p className="text-gray-900">{supplier.country_name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Estado:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {supplier.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Fecha de creación:</span>
            <p className="text-gray-900">
              {new Date(supplier.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Editar Información</h2>
          <p className="text-gray-600 text-sm mt-1">
            Modifica los campos que necesites actualizar
          </p>
        </div>
        <div className="p-6">
          <SupplierForm
            supplier={supplier}
            onSubmit={handleSubmit}
            isLoading={isUpdating}
            error={serverError}
          />
        </div>
      </div>
    </div>
  );
}