'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateCurrency } from '@/hooks/useCurrencies';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';

export default function NewCurrencyPage() {
  const router = useRouter();
  const createCurrency = useCreateCurrency();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    decimals: 2
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createCurrency.mutateAsync({
        ...formData,
        decimals: Number(formData.decimals)
      });
      router.push('/dashboard/master-data/currencies');
    } catch (error: any) {
      console.error('Error creating currency:', error);
      alert(error.response?.data?.message || 'Error al crear la moneda');
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
        <Link href="/dashboard/master-data/currencies">
          <Button variant="outline" size="sm">
            ← Volver a Monedas
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nueva Moneda</h1>
          <p className="text-gray-600 mt-2">
            Agrega una nueva moneda al sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Moneda</CardTitle>
          <p className="text-gray-600 text-sm">
            Completa la información de la nueva moneda. Todos los campos son requeridos.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  Código ISO <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 font-normal">(3 letras)</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="Ej: USD, EUR, MXN"
                  maxLength={3}
                  minLength={3}
                  required
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  Código de 3 letras según el estándar ISO 4217
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                  placeholder="Ej: US Dollar, Euro, Peso Mexicano"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol" className="flex items-center gap-2">
                  Símbolo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('symbol', e.target.value)}
                  placeholder="Ej: $, €, ¥"
                  required
                />
                <p className="text-sm text-gray-500">
                  Símbolo monetario utilizado para mostrar precios
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimals" className="flex items-center gap-2">
                  Decimales <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.decimals.toString()} 
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('decimals', e.target.value)}
                  options={[
                    { value: '0', label: '0 decimales (ej: 100)' },
                    { value: '1', label: '1 decimal (ej: 100.5)' },
                    { value: '2', label: '2 decimales (ej: 100.50)' },
                    { value: '3', label: '3 decimales (ej: 100.500)' },
                  ]}
                  required
                />
                <p className="text-sm text-gray-500">
                  Número de decimales para mostrar en precios
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Creando...' : 'Crear Moneda'}
              </Button>
              <Link href="/dashboard/master-data/currencies">
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
          <li>• El código ISO debe ser exactamente de 3 letras (ej: USD para Dólar Americano)</li>
          <li>• El símbolo se mostrará junto a los precios en toda la aplicación</li>
          <li>• Los decimales definen cómo se mostrarán los precios (ej: 2 para 100.50)</li>
          <li>• Una vez creada, la moneda estará disponible para asignar a países</li>
        </ul>
      </div>
    </div>
  );
}