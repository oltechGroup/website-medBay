'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { useManufacturers } from '@/hooks/useManufacturers';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Input from '@/components/ui/Input';

export default function ManufacturersPage() {
  const router = useRouter();
  const { manufacturers, isLoading, deleteManufacturer, isDeleting } = useManufacturers();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtrar fabricantes basado en la búsqueda
  const filteredManufacturers = manufacturers?.filter(manufacturer =>
    manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manufacturer.country_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteManufacturer(id);
      setDeleteId(null);
    } catch (error) {
      console.error('Error al eliminar fabricante:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Cargando fabricantes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fabricantes</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los fabricantes de productos médicos
          </p>
        </div>
        
        <Button
          onClick={() => router.push('/dashboard/manufacturers/new')}
          icon={<Plus className="h-4 w-4" />}
        >
          Nuevo Fabricante
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<Search className="h-4 w-4 text-gray-400" />}
                placeholder="Buscar por nombre o país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              {filteredManufacturers?.length || 0} de {manufacturers?.length || 0} fabricantes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de fabricantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fabricantes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredManufacturers && filteredManufacturers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManufacturers.map((manufacturer) => (
                    <TableRow key={manufacturer.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {manufacturer.name}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {manufacturer.country_name ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📍</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {manufacturer.country_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {manufacturer.country_code}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No asignado</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/manufacturers/edit/${manufacturer.id}`)}
                            icon={<Edit className="h-4 w-4" />}
                          >
                            Editar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(manufacturer.id)}
                            disabled={isDeleting}
                            icon={<Trash2 className="h-4 w-4" />}
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
              <div className="text-gray-400 text-lg mb-2">
                {searchTerm ? 'No se encontraron fabricantes' : 'No hay fabricantes registrados'}
              </div>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer fabricante'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push('/dashboard/manufacturers/new')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Agregar Primer Fabricante
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmación de eliminación */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Confirmar Eliminación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que quieres eliminar este fabricante? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteId)}
                  loading={isDeleting}
                >
                  Eliminar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}