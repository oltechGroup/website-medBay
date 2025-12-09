//frontend/src/app/dashboard/manufacturers/page.tsx

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useManufacturers } from '@/hooks/useManufacturers';
import { ManufacturerStatsCards } from '@/components/features/manufacturers/ManufacturerStatsCards';
import ManufacturerTable from '@/components/features/manufacturers/ManufacturerTable';
import { ManufacturerFilters } from '@/components/features/manufacturers/ManufacturerFilters';
import { Plus, RefreshCw, Factory, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const itemsPerPage = 10; // Mostrar 10 fabricantes por página

  // Filtrar fabricantes con useMemo para optimización
  const filteredManufacturers = useMemo(() => {
    if (!searchTerm.trim()) {
      return manufacturers;
    }
    
    return manufacturers.filter(manufacturer =>
      manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.contact_info?.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.contact_info?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.website?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [manufacturers, searchTerm]);

  // Calcular paginación
  const totalPages = Math.max(1, Math.ceil(filteredManufacturers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedManufacturers = filteredManufacturers.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const handleSearchSubmit = () => {
    console.log('Búsqueda ejecutada:', searchTerm);
  };

  const handleRefresh = () => {
    refetch();
    setCurrentPage(1);
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
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

  // Generar números de página para mostrar (máximo 5 páginas en los controles)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Mostrar páginas alrededor de la página actual
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      // Ajustar si estamos cerca del inicio o final
      if (currentPage <= 3) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

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

      {/* Tabla de fabricantes con paginación */}
      <ManufacturerTable
        manufacturers={paginatedManufacturers}
        loading={isLoading}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Controles de paginación */}
      {filteredManufacturers.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          {/* Información de paginación */}
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{startIndex + 1}</span> -{' '}
            <span className="font-medium">
              {Math.min(endIndex, filteredManufacturers.length)}
            </span>{' '}
            de <span className="font-medium">{filteredManufacturers.length}</span> fabricantes
          </div>

          {/* Controles de navegación */}
          <div className="flex items-center space-x-2">
            {/* Botón anterior */}
            <button
              onClick={handlePrevPage}

              
              disabled={currentPage === 1 || isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Números de página */}
            <div className="flex items-center space-x-1">
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageClick(pageNum)}
                  disabled={isLoading}
                  className={`min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {pageNum}
                </button>
              ))}
              
              {/* Indicador de páginas omitidas */}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-gray-400">...</span>
                  <button
                    onClick={() => handlePageClick(totalPages)}
                    disabled={isLoading}
                    className="min-w-[2.5rem] px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Botón siguiente */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Información de resultados cuando no hay paginación */}
      {filteredManufacturers.length <= itemsPerPage && (
        <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
          {isLoading ? (
            <p>Cargando fabricantes...</p>
          ) : (
            <>
              <p>
                {searchTerm ? (
                  <>
                    Mostrando <span className="font-medium">{filteredManufacturers.length}</span> fabricantes
                    {searchTerm && (
                      <> para "<span className="font-medium">{searchTerm}</span>"</>
                    )}
                  </>
                ) : (
                  <>
                    Total de fabricantes: <span className="font-medium">{manufacturers.length}</span>
                  </>
                )}
              </p>
              {filteredManufacturers.length === 0 && searchTerm && (
                <p className="text-amber-600 mt-2">
                  No se encontraron fabricantes que coincidan con tu búsqueda.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}