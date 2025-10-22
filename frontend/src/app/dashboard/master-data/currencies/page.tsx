'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCurrencies, useDeleteCurrency } from '@/hooks/useCurrencies';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function CurrenciesPage() {
  const { data: currencies, isLoading, error } = useCurrencies();
  const deleteCurrency = useDeleteCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCurrencies = currencies?.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (code: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la moneda "${name}"?`)) return;
    
    try {
      await deleteCurrency.mutateAsync(code);
    } catch (error) {
      console.error('Error deleting currency:', error);
      alert('Error al eliminar la moneda. Puede que esté siendo utilizada en otros registros.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando monedas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error al cargar las monedas</p>
          <p className="text-sm mt-1">Por favor, intenta nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Monedas</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las monedas soportadas en el sistema
          </p>
        </div>
        <Link href="/dashboard/master-data/currencies/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            + Nueva Moneda
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Monedas</CardTitle>
          <p className="text-gray-600 text-sm">
            {filteredCurrencies?.length || 0} monedas registradas en el sistema
          </p>
          <div className="pt-4">
            <Input
              placeholder="Buscar por nombre, código o símbolo..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCurrencies && filteredCurrencies.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Símbolo</TableHead>
                    <TableHead>Decimales</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCurrencies.map((currency) => (
                    <TableRow key={currency.code}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {currency.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>💰</span>
                          {currency.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{currency.symbol}</span>
                          <span className="text-sm text-gray-500">({currency.symbol})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {currency.decimals} decimales
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(currency.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/master-data/currencies/edit/${currency.code}`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(currency.code, currency.name)}
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
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay monedas registradas
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Comienza agregando las monedas que serán utilizadas en el sistema para precios y conversiones.
              </p>
              <Link href="/dashboard/master-data/currencies/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  + Agregar primera moneda
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}