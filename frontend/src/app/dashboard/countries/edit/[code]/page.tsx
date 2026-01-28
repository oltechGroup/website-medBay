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

  // Cargar datos del país cuando estén disponibles
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

  const manufacturerOptions = [
    { value: '', label: 'Selecciona una moneda común' },
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
      setErrorMessage(err.response?.data?.error || 'Error al actualizar el país');
      console.error('Error updating country:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando país...</div>
      </div>
    );
  }

  if (error || !countryResponse) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-red-800">Error al cargar el país: {error?.message || 'País no encontrado'}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
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
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar País</h1>
          <p className="text-gray-600">Actualiza la información del país y su configuración de moneda.</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        {(errorMessage || updateError) && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {errorMessage || (updateError as any)?.message || 'Error al actualizar el país'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Código del País (solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código del País
            </label>
            <input
              type="text"
              value={code}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500">El código del país no se puede modificar</p>
          </div>

          {/* Nombre del País */}
          <Input
            label="Nombre del País *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre del país es requerido' })}
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
            label="Código de Moneda *"
            error={errors.currency_code?.message}
            {...register('currency_code', { 
              required: 'El código de moneda es requerido',
              pattern: {
                value: /^[A-Z]{3}$/,
                message: 'El código debe ser exactamente 3 letras mayúsculas'
              }
            })}
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
          />

          {/* Símbolo de la Moneda */}
          <Input
            label="Símbolo de la Moneda *"
            error={errors.currency_symbol?.message}
            {...register('currency_symbol', { required: 'El símbolo de la moneda es requerido' })}
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

          {/* Tasa de Cambio vs USD - SECCIÓN IMPORTANTE */}
          <div className="sm:col-span-2">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">
                    Actualización Automática Activada
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Esta tasa se actualiza automáticamente todos los días a las 02:00 AM. 
                    Incluye un margen de seguridad del 2% sobre el valor real del mercado.
                  </p>
                  <p className="text-xs text-blue-500 mt-2 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Solo edita este valor manualmente si necesitas una tasa personalizada urgente.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                <p className="mt-1 text-sm text-gray-500 font-medium">
                  1 USD = {currentExchangeRate || 0} {currentCurrencyCode || ''}
                </p>
              </div>
            </div>
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
            loading={isUpdating}
          >
            Actualizar País
          </Button>
        </div>
      </form>
    </div>
  );
}