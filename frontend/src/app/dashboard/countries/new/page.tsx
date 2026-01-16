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

// Lista de monedas comunes para sugerencias
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

  const manufacturerOptions = [
    { value: '', label: 'Selecciona una moneda común' },
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
      setError(err.response?.data?.error || 'Error al crear el país');
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
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo País</h1>
          <p className="text-gray-600">Registra un nuevo país y configura su moneda para conversiones automáticas.</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(error || createError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || (createError as any)?.message || 'Error al crear el país'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Código del País */}
          <Input
            label="Código del País (ISO 3166-1 alpha-2) *"
            error={errors.code?.message}
            {...register('code', { 
              required: 'El código del país es requerido',
              pattern: {
                value: /^[A-Z]{2}$/,
                message: 'El código debe ser exactamente 2 letras mayúsculas (ej: US, MX)'
              }
            })}
            placeholder="Ej: US, MX, ES"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
            maxLength={2}
          />

          {/* Nombre del País */}
          <Input
            label="Nombre del País *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre del país es requerido' })}
            placeholder="Ej: Estados Unidos, México, España"
          />

          {/* Selección de Moneda Común */}
          <Select
            label="Seleccionar Moneda Común"
            error={errors.currency_code?.message}
            options={manufacturerOptions}
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

          {/* Código de Moneda */}
          <Input
            label="Código de Moneda (ISO 4217) *"
            error={errors.currency_code?.message}
            {...register('currency_code', { 
              required: 'El código de moneda es requerido',
              pattern: {
                value: /^[A-Z]{3}$/,
                message: 'El código debe ser exactamente 3 letras mayúsculas (ej: USD, EUR)'
              }
            })}
            placeholder="Ej: USD, EUR, MXN"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
            maxLength={3}
          />

          {/* Nombre de la Moneda */}
          <Input
            label="Nombre de la Moneda *"
            error={errors.currency_name?.message}
            {...register('currency_name', { required: 'El nombre de la moneda es requerido' })}
            placeholder="Ej: Dólar Americano, Euro, Peso Mexicano"
          />

          {/* Símbolo de la Moneda */}
          <Input
            label="Símbolo de la Moneda *"
            error={errors.currency_symbol?.message}
            {...register('currency_symbol', { required: 'El símbolo de la moneda es requerido' })}
            placeholder="Ej: $, €, ¥"
            maxLength={10}
          />

          {/* Decimales de la Moneda */}
          <Input
            label="Decimales de la Moneda *"
            type="number"
            error={errors.currency_decimals?.message}
            {...register('currency_decimals', { 
              required: 'Los decimales son requeridos',
              valueAsNumber: true,
              min: { value: 0, message: 'Los decimales deben ser un número positivo' },
              max: { value: 4, message: 'Máximo 4 decimales' }
            })}
          />

          {/* Tasa de Cambio vs USD */}
          <div>
            <Input
              label="Tasa de Cambio vs USD *"
              type="number"
              step="0.0001"
              error={errors.exchange_rate?.message}
              {...register('exchange_rate', { 
                required: 'La tasa de cambio es requerida',
                valueAsNumber: true,
                min: { value: 0.0001, message: 'La tasa de cambio debe ser un número positivo' }
              })}
            />
            <p className="mt-1 text-sm text-gray-500">
              1 USD = {currentExchangeRate || 0} {currentCurrencyCode || ''}
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isCreating}
          >
            Crear País
          </Button>
        </div>
      </form>
    </div>
  );
}