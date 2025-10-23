'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Label from '@/components/ui/Label';
import { useManufacturers } from '@/hooks/useManufacturers';
import { useCountries } from '@/hooks/useCountries';

export default function NewManufacturerPage() {
  const router = useRouter();
  const { createManufacturer, isCreating } = useManufacturers();
  const { data: countries, isLoading: isLoadingCountries } = useCountries();

  const [formData, setFormData] = useState({
    name: '',
    country_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del fabricante es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createManufacturer({
        name: formData.name,
        country_id: formData.country_id || undefined,
      });

      router.push('/dashboard/manufacturers');
    } catch (error) {
      console.error('Error al crear fabricante:', error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Fabricante</h1>
        <p className="text-gray-600 mt-2">
          Complete la información del nuevo fabricante
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Fabricante</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre del Fabricante *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                placeholder="Ej: Pfizer"
                required
              />

              <div className="space-y-2">
                <Label htmlFor="country_id">País de Origen</Label>
                <Select
                  value={formData.country_id}
                  onChange={(e) => handleChange('country_id', e.target.value)}
                  options={[
                    { value: '', label: 'Selecciona un país...' },
                    ...(countries?.map(country => ({
                      value: country.code,
                      label: `📍 ${country.name} (${country.code})`
                    })) || [])
                  ]}
                  disabled={isLoadingCountries}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                loading={isCreating}
                disabled={isCreating || isLoadingCountries}
              >
                Crear Fabricante
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/manufacturers')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}