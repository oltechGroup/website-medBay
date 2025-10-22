// frontend/src/app/dashboard/manufacturers/edit/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useManufacturers } from '@/hooks/useManufacturers';
import { useCountries } from '@/hooks/useCountries';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Label from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function EditManufacturerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { manufacturers, updateManufacturer, isUpdating } = useManufacturers();
  const { countries, isLoading: countriesLoading } = useCountries();

  const [formData, setFormData] = useState({
    name: '',
    country_id: '',
  });

  // Buscar el fabricante actual por ID
  const currentManufacturer = manufacturers?.find(m => m.id === id);

  useEffect(() => {
    if (currentManufacturer) {
      setFormData({
        name: currentManufacturer.name,
        country_id: currentManufacturer.country_id || '',
      });
    }
  }, [currentManufacturer]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateManufacturer({ id, data: formData });
      router.push('/dashboard/manufacturers');
    } catch (error) {
      console.error('Error updating manufacturer:', error);
    }
  };

  // Preparar opciones para el Select
  const countryOptions = countries?.map(country => ({
    value: country.code,
    label: country.name
  })) || [];

  if (!currentManufacturer) {
    return <div>Cargando fabricante...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Fabricante</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Fabricante</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                placeholder="Ingresa el nombre del fabricante"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_id">País de Origen</Label>
              <Select
                options={countryOptions}
                value={formData.country_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('country_id', e.target.value)}
                disabled={countriesLoading}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Actualizando...' : 'Actualizar Fabricante'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}