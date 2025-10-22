'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateAvalaraTaxCode } from '@/hooks/useAvalaraTaxCodes';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';

export default function NewTaxCodePage() {
  const router = useRouter();
  const createTaxCode = useCreateAvalaraTaxCode();
  
  const [formData, setFormData] = useState({
    code: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createTaxCode.mutateAsync(formData);
      router.push('/dashboard/master-data/tax-codes');
    } catch (error: any) {
      console.error('Error creating tax code:', error);
      alert(error.response?.data?.message || 'Error al crear el código fiscal');
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
        <Link href="/dashboard/master-data/tax-codes">
          <Button variant="outline" size="sm">
            ← Volver a Códigos Fiscales
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nuevo Código Fiscal</h1>
          <p className="text-gray-600 mt-2">
            Agrega un nuevo código fiscal para integración con Avalara
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Código Fiscal</CardTitle>
          <p className="text-gray-600 text-sm">
            Completa la información del nuevo código fiscal. El código es requerido.
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
                {isSubmitting ? 'Creando...' : 'Crear Código Fiscal'}
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
          <li>• Los códigos fiscales se utilizan para la integración con Avalara</li>
          <li>• Cada producto médico debe tener asignado un código fiscal</li>
          <li>• La descripción ayuda a identificar el propósito del código</li>
        </ul>
      </div>
    </div>
  );
}