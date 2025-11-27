'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useManufacturers } from '@/hooks/useManufacturers';
import { ManufacturerStatsCards } from '@/components/features/manufacturers/ManufacturerStatsCards';
import ManufacturerTable from '@/components/features/manufacturers/ManufacturerTable';
import { ManufacturerFilters } from '@/components/features/manufacturers/ManufacturerFilters';
import { Plus, RefreshCw, Factory } from 'lucide-react';

export default function ManufacturersPage() {
  const { 
    manufacturers = [], 
    isLoading, 
    error, 
    deleteManufacturer,
    isDeleting,
    refetch
  } = useManufacturers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar fabricantes
  const filteredManufacturers = manufacturers.filter(manufacturer =>
    manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manufacturer.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manufacturer.contact_info?.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manufacturer.contact_info?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manufacturer.website?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredManufacturers.length / itemsPerPage);
  const paginatedManufacturers = filteredManufacturers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    // La búsqueda se hace en tiempo real, esto es para logging
    console.log('Búsqueda ejecutada:', searchTerm);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este fabricante?')) {
      try {
        await deleteManufacturer(id);
        refetch();
      } catch (error) {
        console.error('Error al eliminar fabricante:', error);
        alert('Error al eliminar el fabricante. Puede que esté siendo utilizado en productos.');
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Factory className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar fabricantes</h2>
          <p className="text-gray-600 mb-6">Ocurrió un problema al cargar la información de fabricantes.</p>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fabricantes</h1>
          <p className="text-gray-600 mt-2">Gestiona los fabricantes de productos médicos en el sistema</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
          <Link href="/dashboard/manufacturers/new" className="w-full sm:w-auto">
            <button className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Fabricante
            </button>
          </Link>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <ManufacturerStatsCards 
        totalCount={manufacturers.length} 
        isLoading={isLoading}
      />

      {/* Filtros */}
      <ManufacturerFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Tabla de fabricantes */}
      <ManufacturerTable
        manufacturers={paginatedManufacturers}
        loading={isLoading}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Información de paginación */}
      {filteredManufacturers.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Mostrando {paginatedManufacturers.length} de {filteredManufacturers.length} fabricantes
          {totalPages > 1 && ` - Página ${currentPage} de ${totalPages}`}
        </div>
      )}
    </div>
  );
}