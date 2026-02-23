//frontend/src/app/dashboard/countries/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateCountry } from '@/hooks/useCountries';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface CountryFormData {
  code: string;
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

export default function NewCountryPage() {
  const router = useRouter();
  const { createCountry, isCreating, createError } = useCreateCountry();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CountryFormData>({
    defaultValues: {
      currency_decimals: 2,
      exchange_rate: 1.0,
    },
  });

  const currencyOptions = [
    { value: '', label: 'Select a common currency' },
    ...commonCurrencies.map(currency => ({
      value: currency.code,
      label: `${currency.name} (${currency.code}) - ${currency.symbol}`
    }))
  ];

  const onSubmit = async (data: CountryFormData) => {
    try {
      setError(null);
      await createCountry(data);
      router.push('/dashboard/countries');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating the country');
      console.error('Error creating country:', err);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Create New Country</h1>
          <p className="text-gray-600">Register a new country and configure its currency for automatic conversions.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || createError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (createError as any)?.message || 'Error creating the country'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Country Code */}
          <Input
            label="Country Code (ISO 3166-1 alpha-2) *"
            error={errors.code?.message}
            {...register('code', { 
              required: 'Country code is required',
              pattern: {
                value: /^[A-Z]{2}$/,
                message: 'Code must be exactly 2 uppercase letters (e.g.: US, MX)'
              }
            })}
            placeholder="e.g.: US, MX, ES"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
            maxLength={2}
          />

          {/* Country Name */}
          <Input
            label="Country Name *"
            error={errors.name?.message}
            {...register('name', { required: 'Country name is required' })}
            placeholder="e.g.: United States, Mexico, Spain"
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
            label="Currency Code (ISO 4217) *"
            error={errors.currency_code?.message}
            {...register('currency_code', { 
              required: 'Currency code is required',
              pattern: {
                value: /^[A-Z]{3}$/,
                message: 'Code must be exactly 3 uppercase letters (e.g.: USD, EUR)'
              }
            })}
            placeholder="e.g.: USD, EUR, MXN"
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
            placeholder="e.g.: US Dollar, Euro, Mexican Peso"
          />

          {/* Currency Symbol */}
          <Input
            label="Currency Symbol *"
            error={errors.currency_symbol?.message}
            {...register('currency_symbol', { required: 'Currency symbol is required' })}
            placeholder="e.g.: $, €, ¥"
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

          {/* Exchange Rate vs USD */}
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
            <p className="mt-1 text-sm text-gray-500">
              1 USD = {currentExchangeRate || 0} {currentCurrencyCode || ''}
            </p>
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
            loading={isCreating}
          >
            Create Country
          </Button>
        </div>
      </form>
    </div>
  );
}