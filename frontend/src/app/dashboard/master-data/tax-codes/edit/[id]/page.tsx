'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAvalaraTaxCode, useUpdateAvalaraTaxCode } from '@/hooks/useAvalaraTaxCodes';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';

export default function EditTaxCodePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: taxCode, isLoading, error } = useAvalaraTaxCode(id);
  const updateTaxCode = useUpdateAvalaraTaxCode();

  const [formData, setFormData] = useState({
    code: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taxCode) {
      setFormData({
        code: taxCode.code || '',
        description: taxCode.description || ''
      });
    }
  }, [taxCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateTaxCode.mutateAsync({
        id,
        data: formData
      });
      router.push('/dashboard/master-data/tax-codes');
    } catch (error: any) {
      console.error('Error updating tax code:', error);
      alert(error.response?.data?.message || 'Error al actualizar el código fiscal');
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
          <p className="text-gray-600 mt-2">Cargando código fiscal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error al cargar el código fiscal</p>
          <p className="text-sm mt-1">El código no existe o ha ocurrido un error</p>
          <Link href="/dashboard/master-data/tax-codes">
            <Button variant="outline" className="mt-4">
              ← Volver a Códigos Fiscales
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/master-data/tax-codes">
          <Button variant="outline" size="sm">
            ← Volver a Códigos Fiscales
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Editar Código Fiscal: {taxCode?.code}
          </h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información del código fiscal
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Código Fiscal</CardTitle>
          <p className="text-gray-600 text-sm">
            Modifica la información del código fiscal. El código es requerido.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  Código Fiscal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('code', e.target.value)}
                  placeholder="Ej: P0000000, P0010000"
                  required
                />
                <p className="text-sm text-gray-500">
                  Código único para identificación en el sistema Avalara
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('description', e.target.value)}
                  placeholder="Ej: Medical devices and equipment, Prescription drugs and medicines"
                />
                <p className="text-sm text-gray-500">
                  Descripción detallada del código fiscal (opcional)
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Código Fiscal'}
              </Button>
              <Link href="/dashboard/master-data/tax-codes">
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
          <li>• El código debe ser único en el sistema</li>
          <li>• Los cambios se reflejarán en todos los productos que usen este código</li>
          <li>• Asegúrate de que el código sea válido en el sistema Avalara</li>
        </ul>
      </div>
    </div>
  );
}