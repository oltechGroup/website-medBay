//frontend/src/components/features/suppliers/SupplierForm.tsx
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
      const errorMessage = error.response?.data?.error || 'Error processing the request';
      setServerError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* SHOW SERVER ERRORS */}
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
        <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ✅ SUPPLIER NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'The name must be at least 2 characters long'
                }
              })}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g.: Medical Suppliers Inc."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* ✅ COUNTRY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              {...register('country_code', { 
                required: 'Country is required' 
              })}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                errors.country_code ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a country</option>
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

        {/* ACTIVE/INACTIVE STATUS */}
        <div className="mt-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">Active supplier</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Inactive suppliers will not be available in selection lists.
          </p>
        </div>
      </div>

      {/* CONTACT INFORMATION */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PHONE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="text"
              {...register('contact_info.telefono')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="e.g.: +1 555 123 4567"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('contact_info.email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="e.g.: contact@supplier.com"
            />
          </div>

          {/* CONTACT PERSON */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact person
            </label>
            <input
              type="text"
              {...register('contact_info.persona_contacto')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="e.g.: John Doe"
            />
          </div>

          {/* WEBSITE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="text"
              {...register('contact_info.website')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="e.g.: https://supplier.com"
            />
          </div>
        </div>

        {/* ADDRESS */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            {...register('contact_info.direccion')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="e.g.: 123 Main St, Suite 400, New York, NY"
          />
        </div>

        {/* ADDITIONAL NOTES */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional notes
          </label>
          <textarea
            {...register('contact_info.notas')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Additional information about the supplier..."
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          {supplier ? 'Update supplier' : 'Create supplier'}
        </Button>
      </div>
    </form>
  );
}