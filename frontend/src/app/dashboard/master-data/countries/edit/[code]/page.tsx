'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useCountry, useUpdateCountry } from '@/hooks/useCountries';
import { useCurrencies } from '@/hooks/useCurrencies';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';

export default function EditCountryPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const { data: country, isLoading, error } = useCountry(code);
  const { data: currencies } = useCurrencies();
  const updateCountry = useUpdateCountry();

  const [formData, setFormData] = useState({
    name: '',
    currency_code: '',
    tax_rules: '{}'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (country) {
      setFormData({
        name: country.name || '',
        currency_code: country.currency_code || '',
        tax_rules: JSON.stringify(country.tax_rules || {})
      });
    }
  }, [country]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateCountry.mutateAsync({
        code,
        data: {
          ...formData,
          tax_rules: JSON.parse(formData.tax_rules || '{}')
        }
      });
      router.push('/dashboard/master-data/countries');
    } catch (error: any) {
      console.error('Error updating country:', error);
      alert(error.response?.data?.message || 'Error al actualizar el país');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando país...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error al cargar el país</p>
          <p className="text-sm mt-1">El país no existe o ha ocurrido un error</p>
          <Link href="/dashboard/master-data/countries">
            <Button variant="outline" className="mt-4">
              ← Volver a Países
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/master-data/countries">
          <Button variant="outline" size="sm">
            ← Volver a Países
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Editar País: {country?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información del país
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del País</CardTitle>
          <p className="text-gray-600 text-sm">
            Modifica la información del país. Todos los campos son requeridos.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  Código ISO
                  <span className="text-xs text-gray-500 font-normal">(No editable)</span>
                </Label>
                <Input
                  id="code"
                  value={code}
                  disabled
                  className="font-mono bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  El código ISO no se puede modificar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Nombre del País <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                  placeholder="Ej: México, United States, España"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_code" className="flex items-center gap-2">
                  Moneda Principal <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.currency_code} 
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('currency_code', e.target.value)}
                  options={[
                    { value: '', label: 'Selecciona una moneda' },
                    ...(currencies?.map((currency) => ({
                      value: currency.code,
                      label: `${currency.symbol} ${currency.name} (${currency.code})`
                    })) || [])
                  ]}
                  required
                />
                <p className="text-sm text-gray-500">
                  Moneda principal utilizada en este país
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rules">
                  Reglas Fiscales (JSON)
                </Label>
                <Input
                  id="tax_rules"
                  value={formData.tax_rules}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('tax_rules', e.target.value)}
                  placeholder='Ej: {"iva": 0.16, "tasa_especial": 0.08}'
                />
                <p className="text-sm text-gray-500">
                  Configuración de impuestos en formato JSON. Opcional.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar País'}
              </Button>
              <Link href="/dashboard/master-data/countries">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Información importante</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• El código ISO no se puede modificar por ser el identificador único</li>
          <li>• Los cambios en la moneda afectarán a todos los registros asociados</li>
          <li>• Las reglas fiscales deben ser un JSON válido</li>
        </ul>
      </div>
    </div>
  );
}