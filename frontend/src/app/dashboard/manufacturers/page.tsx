// frontend/src/app/dashboard/manufacturers/page.tsx
'use client';

import { useManufacturers } from '@/hooks/useManufacturers';
import Button from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { Plus, Edit, MapPin } from 'lucide-react';

export default function ManufacturersPage() {
  const { manufacturers, isLoading, error } = useManufacturers();

  if (isLoading) return <div>Cargando fabricantes...</div>;
  if (error) return <div>Error al cargar fabricantes</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fabricantes</h1>
        <Link href="/dashboard/manufacturers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Fabricante
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fabricantes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manufacturers?.map((manufacturer) => (
                <TableRow key={manufacturer.id}>
                  <TableCell className="font-medium">{manufacturer.name}</TableCell>
                  <TableCell>
                    {manufacturer.country_name ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {manufacturer.country_name}
                        <Badge variant="secondary">{manufacturer.country_code}</Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No asignado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/manufacturers/edit/${manufacturer.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}