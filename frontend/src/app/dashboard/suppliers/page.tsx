'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Input from '@/components/ui/Input';

export default function SuppliersPage() {
  const router = useRouter();
  const { suppliers, isLoading, deleteSupplier, isDeleting } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtrar proveedores basado en la búsqueda
  const filteredSuppliers = suppliers?.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.tax_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.country_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      setDeleteId(null);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
    }
  };

  const formatContactInfo = (contactInfo: any) => {
    if (!contactInfo) return 'No disponible';
    
    const parts = [];
    if (contactInfo.persona_contacto) parts.push(contactInfo.persona_contacto);
    if (contactInfo.telefono) parts.push(contactInfo.telefono);
    if (contactInfo.email) parts.push(contactInfo.email);
    
    return parts.length > 0 ? parts.join(' • ') : 'No disponible';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Cargando proveedores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los proveedores de productos médicos
          </p>
        </div>
        
        <Button
          onClick={() => router.push('/dashboard/suppliers/new')}
          icon={<Plus className="h-4 w-4" />}
        >
          Nuevo Proveedor
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<Search className="h-4 w-4 text-gray-400" />}
                placeholder="Buscar por nombre, RFC o país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              {filteredSuppliers?.length || 0} de {suppliers?.length || 0} proveedores
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers && filteredSuppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>RFC / Tax ID</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {supplier.name}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {supplier.tax_id ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {supplier.tax_id}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No especificado</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {supplier.country_name ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📍</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {supplier.country_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {supplier.country_code}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No asignado</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {supplier.currency_name ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {supplier.currency_name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span>{supplier.currency_symbol}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {supplier.currency_id}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No asignada</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 line-clamp-2">
                            {formatContactInfo(supplier.contact_info)}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/suppliers/edit/${supplier.id}`)}
                            icon={<Edit className="h-4 w-4" />}
                          >
                            Editar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(supplier.id)}
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
                {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
              </div>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer proveedor'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push('/dashboard/suppliers/new')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Agregar Primer Proveedor
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
                ¿Estás seguro de que quieres eliminar este proveedor? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="destructive" // ✅ Ahora funciona con la variante corregida
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