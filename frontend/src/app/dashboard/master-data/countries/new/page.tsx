'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateCountry } from '@/hooks/useCountries';
import { useCurrencies } from '@/hooks/useCurrencies';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';

export default function NewCountryPage() {
  const router = useRouter();
  const { data: currencies } = useCurrencies();
  const createCountry = useCreateCountry();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    currency_code: '',
    tax_rules: '{}'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createCountry.mutateAsync({
        ...formData,
        tax_rules: JSON.parse(formData.tax_rules || '{}')
      });
      router.push('/dashboard/master-data/countries');
    } catch (error: any) {
      console.error('Error creating country:', error);
      alert(error.response?.data?.message || 'Error al crear el país');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/master-data/countries">
          <Button variant="outline" size="sm">
            ← Volver a Países
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nuevo País</h1>
          <p className="text-gray-600 mt-2">
            Agrega un nuevo país al sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del País</CardTitle>
          <p className="text-gray-600 text-sm">
            Completa la información del nuevo país. Todos los campos son requeridos.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  Código ISO <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 font-normal">(2 letras)</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="Ej: MX, US, ES"
                  maxLength={2}
                  minLength={2}
                  required
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  Código de 2 letras según el estándar ISO 3166-1
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
                {isSubmitting ? 'Creando...' : 'Crear País'}
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
          <li>• El código ISO debe ser exactamente de 2 letras (ej: MX para México)</li>
          <li>• La moneda seleccionada será la principal para este país</li>
          <li>• Las reglas fiscales son opcionales y se pueden configurar después</li>
          <li>• Una vez creado, el país estará disponible en todo el sistema</li>
        </ul>
      </div>
    </div>
  );
}