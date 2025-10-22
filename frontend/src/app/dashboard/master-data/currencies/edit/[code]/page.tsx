'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrency, useUpdateCurrency } from '@/hooks/useCurrencies';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';

export default function EditCurrencyPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const { data: currency, isLoading, error } = useCurrency(code);
  const updateCurrency = useUpdateCurrency();

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 2
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currency) {
      setFormData({
        name: currency.name || '',
        symbol: currency.symbol || '',
        decimals: currency.decimals || 2
      });
    }
  }, [currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateCurrency.mutateAsync({
        code,
        data: {
          ...formData,
          decimals: Number(formData.decimals)
        }
      });
      router.push('/dashboard/master-data/currencies');
    } catch (error: any) {
      console.error('Error updating currency:', error);
      alert(error.response?.data?.message || 'Error al actualizar la moneda');
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
          <p className="text-gray-600 mt-2">Cargando moneda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error al cargar la moneda</p>
          <p className="text-sm mt-1">La moneda no existe o ha ocurrido un error</p>
          <Link href="/dashboard/master-data/currencies">
            <Button variant="outline" className="mt-4">
              ← Volver a Monedas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/master-data/currencies">
          <Button variant="outline" size="sm">
            ← Volver a Monedas
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Editar Moneda: {currency?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información de la moneda
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Moneda</CardTitle>
          <p className="text-gray-600 text-sm">
            Modifica la información de la moneda. Todos los campos son requeridos.
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
                {isSubmitting ? 'Actualizando...' : 'Actualizar Moneda'}
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
          <li>• El código ISO no se puede modificar por ser el identificador único</li>
          <li>• Los cambios se reflejarán en todos los países que usen esta moneda</li>
          <li>• Asegúrate de que el símbolo sea el correcto para esta moneda</li>
        </ul>
      </div>
    </div>
  );
}