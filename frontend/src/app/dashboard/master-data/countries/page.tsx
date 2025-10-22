'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCountries, useDeleteCountry } from '@/hooks/useCountries';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function CountriesPage() {
  const { data: countries, isLoading, error } = useCountries();
  const deleteCountry = useDeleteCountry();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = countries?.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (code: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el país "${name}"?`)) return;
    
    try {
      await deleteCountry.mutateAsync(code);
    } catch (error) {
      console.error('Error deleting country:', error);
      alert('Error al eliminar el país. Puede que esté siendo utilizado en otros registros.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando países...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error al cargar los países</p>
          <p className="text-sm mt-1">Por favor, intenta nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Países</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los países donde opera MedBay
          </p>
        </div>
        <Link href="/dashboard/master-data/countries/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            + Nuevo País
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Países</CardTitle>
          <p className="text-gray-600 text-sm">
            {filteredCountries?.length || 0} países registrados en el sistema
          </p>
          <div className="pt-4">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCountries && filteredCountries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Reglas Fiscales</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountries.map((country) => (
                    <TableRow key={country.code}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {country.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          {country.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {country.currency_name ? (
                          <div className="flex items-center gap-2">
                            <span>{country.currency_symbol}</span>
                            <span className="text-sm">{country.currency_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {country.currency_code}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No asignada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {country.tax_rules ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Configurado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            Sin configurar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(country.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/master-data/countries/edit/${country.code}`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(country.code, country.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌎</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay países registrados
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Comienza agregando los países donde opera MedBay para configurar las reglas fiscales y monedas correspondientes.
              </p>
              <Link href="/dashboard/master-data/countries/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  + Agregar primer país
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}