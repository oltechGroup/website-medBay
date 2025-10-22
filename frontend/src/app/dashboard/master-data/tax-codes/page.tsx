'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAvalaraTaxCodes, useDeleteAvalaraTaxCode } from '@/hooks/useAvalaraTaxCodes';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function TaxCodesPage() {
  const { data: taxCodes, isLoading, error } = useAvalaraTaxCodes();
  const deleteTaxCode = useDeleteAvalaraTaxCode();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTaxCodes = taxCodes?.filter(taxCode =>
    taxCode.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taxCode.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el código fiscal "${code}"?`)) return;
    
    try {
      await deleteTaxCode.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting tax code:', error);
      alert('Error al eliminar el código fiscal.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando códigos fiscales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error al cargar los códigos fiscales</p>
          <p className="text-sm mt-1">Por favor, intenta nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Códigos Fiscales</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los códigos de impuestos para integración con Avalara
          </p>
        </div>
        <Link href="/dashboard/master-data/tax-codes/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            + Nuevo Código
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Códigos Fiscales</CardTitle>
          <p className="text-gray-600 text-sm">
            {filteredTaxCodes?.length || 0} códigos fiscales registrados en el sistema
          </p>
          <div className="pt-4">
            <Input
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTaxCodes && filteredTaxCodes.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxCodes.map((taxCode) => (
                    <TableRow key={taxCode.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>📑</span>
                          <Badge variant="outline" className="font-mono">
                            {taxCode.code}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {taxCode.description || (
                          <span className="text-gray-400 text-sm">Sin descripción</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(taxCode.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/master-data/tax-codes/edit/${taxCode.id}`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(taxCode.id, taxCode.code)}
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
              <div className="text-6xl mb-4">📑</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay códigos fiscales registrados
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Comienza agregando los códigos fiscales para la integración con Avalara y el cumplimiento tributario.
              </p>
              <Link href="/dashboard/master-data/tax-codes/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  + Agregar primer código
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}