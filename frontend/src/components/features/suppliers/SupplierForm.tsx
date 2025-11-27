'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Supplier, CreateSupplierData, UpdateSupplierData } from '@/hooks/useSuppliers';
import { useCountriesBasic } from '@/hooks/useCountries';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: CreateSupplierData | UpdateSupplierData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

interface SupplierFormData {
  name: string;
  country_code: string;
  contact_info: {
    telefono?: string;
    email?: string;
    persona_contacto?: string;
    direccion?: string;
    website?: string;
    notas?: string;
  };
  is_active: boolean;
}

export default function SupplierForm({ supplier, onSubmit, isLoading, error }: SupplierFormProps) {
  const { data: countries, isLoading: isLoadingCountries } = useCountriesBasic();
  const [isActive, setIsActive] = useState(supplier?.is_active ?? true);
  const [serverError, setServerError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SupplierFormData>({
    defaultValues: {
      name: supplier?.name || '',
      country_code: supplier?.country_code || '',
      contact_info: {
        telefono: supplier?.contact_info?.telefono || '',
        email: supplier?.contact_info?.email || '',
        persona_contacto: supplier?.contact_info?.persona_contacto || '',
        direccion: supplier?.contact_info?.direccion || '',
        website: supplier?.contact_info?.website || '',
        notas: supplier?.contact_info?.notas || '',
      },
      is_active: supplier?.is_active ?? true,
    },
  });

  const handleFormSubmit = async (data: SupplierFormData) => {
    setServerError('');
    try {
      await onSubmit({
        ...data,
        is_active: isActive,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al procesar la solicitud';
      setServerError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* MOSTRAR ERRORES DEL SERVIDOR */}
      {(serverError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {serverError || error}
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Información Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ✅ NOMBRE DEL PROVEEDOR - CON ASTERISCO ROJO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del proveedor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'El nombre es requerido',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                }
              })}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Proveedores Médicos S.A."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* ✅ PAÍS OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País <span className="text-red-500">*</span>
            </label>
            <select
              {...register('country_code', { 
                required: 'El país es requerido' 
              })}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                errors.country_code ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona un país</option>
              {countries?.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.currency_code} - {country.currency_symbol})
                </option>
              ))}
            </select>
            {errors.country_code && (
              <p className="mt-1 text-sm text-red-600">{errors.country_code.message}</p>
            )}
          </div>
        </div>

        {/* Estado activo/inactivo */}
        <div className="mt-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">Proveedor activo</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Los proveedores inactivos no estarán disponibles en las listas de selección.
          </p>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Información de Contacto</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              {...register('contact_info.telefono')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Ej: +52 55 1234 5678"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('contact_info.email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Ej: contacto@proveedor.com"
            />
          </div>

          {/* Persona de contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Persona de contacto
            </label>
            <input
              type="text"
              {...register('contact_info.persona_contacto')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          {/* Sitio web */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sitio web
            </label>
            <input
              type="text"
              {...register('contact_info.website')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Ej: https://proveedor.com"
            />
          </div>
        </div>

        {/* Dirección */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <textarea
            {...register('contact_info.direccion')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Ej: Av. Principal #123, Col. Centro, Ciudad de México"
          />
        </div>

        {/* Notas adicionales */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales
          </label>
          <textarea
            {...register('contact_info.notas')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Información adicional sobre el proveedor..."
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          {supplier ? 'Actualizar proveedor' : 'Crear proveedor'}
        </Button>
      </div>
    </form>
  );
}