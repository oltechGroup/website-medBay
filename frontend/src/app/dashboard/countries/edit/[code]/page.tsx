//frontend/src/app/dashboard/countries/edit/[code]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCountry, useUpdateCountry } from '@/hooks/useCountries';
import { useForm } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ArrowLeft, Info, AlertTriangle } from 'lucide-react';

interface CountryFormData {
  name: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  currency_decimals: number;
  exchange_rate: number;
}

// List of common currencies for suggestions
const commonCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: 'CN¥', decimals: 2 },
];

export default function EditCountryPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const { data: countryResponse, isLoading, error } = useCountry(code);
  const { updateCountry, isUpdating, updateError } = useUpdateCountry();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CountryFormData>();

  // Load country data when available
  useEffect(() => {
    if (countryResponse?.data) {
      const country = countryResponse.data;
      setValue('name', country.name);
      setValue('currency_code', country.currency_code);
      setValue('currency_name', country.currency_name);
      setValue('currency_symbol', country.currency_symbol);
      setValue('currency_decimals', country.currency_decimals);
      setValue('exchange_rate', country.exchange_rate);
    }
  }, [countryResponse, setValue]);

  const currencyOptions = [
    { value: '', label: 'Select a common currency' },
    ...commonCurrencies.map(currency => ({
      value: currency.code,
      label: `${currency.name} (${currency.code}) - ${currency.symbol}`
    }))
  ];

  const onSubmit = async (data: CountryFormData) => {
    try {
      setErrorMessage(null);
      await updateCountry({ code, data });
      router.push('/dashboard/countries');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error updating the country');
      console.error('Error updating country:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading country...</div>
      </div>
    );
  }

  if (error || !countryResponse) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-red-800">Error loading country: {error?.message || 'Country not found'}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const currentExchangeRate = watch('exchange_rate');
  const currentCurrencyCode = watch('currency_code');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Country</h1>
          <p className="text-gray-600">Update the country information and its currency settings.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(errorMessage || updateError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {errorMessage || (updateError as any)?.message || 'Error updating the country'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Country Code (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country Code
            </label>
            <input
              type="text"
              value={code}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500">The country code cannot be modified</p>
          </div>

          {/* Country Name */}
          <Input
            label="Country Name *"
            error={errors.name?.message}
            {...register('name', { required: 'Country name is required' })}
          />

          {/* Common Currency Selection */}
          <Select
            label="Select Common Currency"
            error={errors.currency_code?.message}
            options={currencyOptions}
            {...register('currency_code')}
            onChange={(e) => {
              const selectedCode = e.target.value;
              const selectedCurrency = commonCurrencies.find(currency => currency.code === selectedCode);
              if (selectedCurrency) {
                setValue('currency_code', selectedCurrency.code);
                setValue('currency_name', selectedCurrency.name);
                setValue('currency_symbol', selectedCurrency.symbol);
                setValue('currency_decimals', selectedCurrency.decimals);
              }
            }}
          />

          {/* Currency Code */}
          <Input
            label="Currency Code *"
            error={errors.currency_code?.message}
            {...register('currency_code', { 
              required: 'Currency code is required',
              pattern: {
                value: /^[A-Z]{3}$/,
                message: 'Code must be exactly 3 uppercase letters'
              }
            })}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
            maxLength={3}
          />

          {/* Currency Name */}
          <Input
            label="Currency Name *"
            error={errors.currency_name?.message}
            {...register('currency_name', { required: 'Currency name is required' })}
          />

          {/* Currency Symbol */}
          <Input
            label="Currency Symbol *"
            error={errors.currency_symbol?.message}
            {...register('currency_symbol', { required: 'Currency symbol is required' })}
            maxLength={10}
          />

          {/* Currency Decimals */}
          <Input
            label="Currency Decimals *"
            type="number"
            error={errors.currency_decimals?.message}
            {...register('currency_decimals', { 
              required: 'Decimals are required',
              valueAsNumber: true,
              min: { value: 0, message: 'Decimals must be a positive number' },
              max: { value: 4, message: 'Maximum 4 decimals' }
            })}
          />

          {/* Exchange Rate vs USD - IMPORTANT SECTION */}
          <div className="sm:col-span-2">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">
                    Automatic Update Enabled
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    This rate is automatically updated every day at 02:00 AM. 
                    It includes a 2% safety margin over the real market value.
                  </p>
                  <p className="text-xs text-blue-500 mt-2 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Only edit this value manually if you need an urgent custom rate.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Exchange Rate vs USD *"
                  type="number"
                  step="0.0001"
                  error={errors.exchange_rate?.message}
                  {...register('exchange_rate', { 
                    required: 'Exchange rate is required',
                    valueAsNumber: true,
                    min: { value: 0.0001, message: 'Exchange rate must be a positive number' }
                  })}
                />
                <p className="mt-1 text-sm text-gray-500 font-medium">
                  1 USD = {currentExchangeRate || 0} {currentCurrencyCode || ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isUpdating}
          >
            Update Country
          </Button>
        </div>
      </form>
    </div>
  );
}