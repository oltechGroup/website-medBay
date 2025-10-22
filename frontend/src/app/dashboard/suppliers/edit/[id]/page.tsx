'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Label from '@/components/ui/Label';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCountries } from '@/hooks/useCountries';
import { useCurrencies } from '@/hooks/useCurrencies';

interface ContactInfo {
  telefono?: string;
  email?: string;
  persona_contacto?: string;
  direccion?: string;
}

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { suppliers, updateSupplier, isUpdating } = useSuppliers();
  const { data: countries, isLoading: isLoadingCountries } = useCountries();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();

  // ✅ VALORES POR DEFECTO MEJORADOS
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    country_id: '',
    currency_id: '',
    contact_info: {
      telefono: '',
      email: '',
      persona_contacto: '',
      direccion: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos del proveedor - CORREGIDO
  useEffect(() => {
    if (suppliers && id) {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) {
        setFormData({
          name: supplier.name || '',
          tax_id: supplier.tax_id || '',
          country_id: supplier.country_id || '',
          currency_id: supplier.currency_id || '',
          contact_info: {
            telefono: supplier.contact_info?.telefono || '',
            email: supplier.contact_info?.email || '',
            persona_contacto: supplier.contact_info?.persona_contacto || '',
            direccion: supplier.contact_info?.direccion || ''
          }
        });
        setIsLoading(false);
      } else {
        router.push('/dashboard/suppliers');
      }
    }
  }, [suppliers, id, router]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContactInfoChange = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proveedor es requerido';
    }

    if (!formData.country_id) {
      newErrors.country_id = 'Debe seleccionar un país';
    }

    if (!formData.currency_id) {
      newErrors.currency_id = 'Debe seleccionar una moneda';
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
      await updateSupplier({
        id,
        data: {
          name: formData.name,
          tax_id: formData.tax_id || undefined,
          country_id: formData.country_id,
          currency_id: formData.currency_id,
          contact_info: Object.keys(formData.contact_info).some(key => 
            formData.contact_info[key as keyof ContactInfo]?.trim()
          ) ? formData.contact_info : undefined
        }
      });

      router.push('/dashboard/suppliers');
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Cargando proveedor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Editar Proveedor</h1>
        <p className="text-gray-600 mt-2">
          Actualice la información del proveedor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre del Proveedor *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                placeholder="Ej: Farmacias del Ahorro"
                required
              />

              <Input
                label="RFC / Tax ID"
                value={formData.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder="Ej: FDA120304ABC"
              />
            </div>

            {/* Selects de Datos Maestros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="country_id">País *</Label>
                <Select
                  value={formData.country_id}
                  onChange={(e) => handleChange('country_id', e.target.value)}
                  options={[
                    { value: '', label: 'Selecciona un país...' },
                    ...(countries?.map(country => ({
                      value: country.code,
                      label: `📍 ${country.name} - ${country.currency_name} (${country.code})`
                    })) || [])
                  ]}
                  disabled={isLoadingCountries}
                />
                {errors.country_id && (
                  <p className="text-sm text-red-600">{errors.country_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_id">Moneda Principal *</Label>
                <Select
                  value={formData.currency_id}
                  onChange={(e) => handleChange('currency_id', e.target.value)}
                  options={[
                    { value: '', label: 'Selecciona una moneda...' },
                    ...(currencies?.map(currency => ({
                      value: currency.code,
                      label: `💰 ${currency.name} - ${currency.symbol} (${currency.code})`
                    })) || [])
                  ]}
                  disabled={isLoadingCurrencies}
                />
                {errors.currency_id && (
                  <p className="text-sm text-red-600">{errors.currency_id}</p>
                )}
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Persona de Contacto"
                  value={formData.contact_info.persona_contacto}
                  onChange={(e) => handleContactInfoChange('persona_contacto', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />

                <Input
                  label="Teléfono"
                  value={formData.contact_info.telefono}
                  onChange={(e) => handleContactInfoChange('telefono', e.target.value)}
                  placeholder="Ej: +52 55 1234 5678"
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.contact_info.email}
                  onChange={(e) => handleContactInfoChange('email', e.target.value)}
                  placeholder="Ej: contacto@empresa.com"
                />

                <Input
                  label="Dirección"
                  value={formData.contact_info.direccion}
                  onChange={(e) => handleContactInfoChange('direccion', e.target.value)}
                  placeholder="Ej: Av. Insurgentes 123, CDMX"
                />
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                loading={isUpdating}
                disabled={isUpdating || isLoadingCountries || isLoadingCurrencies}
              >
                Actualizar Proveedor
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/suppliers')}
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