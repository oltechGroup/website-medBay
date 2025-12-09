//frontend/src/app/dashboard/manufacturers/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useManufacturers } from '@/hooks/useManufacturers';
import { ManufacturerStatsCards } from '@/components/features/manufacturers/ManufacturerStatsCards';
import ManufacturerTable from '@/components/features/manufacturers/ManufacturerTable';
import { ManufacturerFilters } from '@/components/features/manufacturers/ManufacturerFilters';
import { Plus, RefreshCw, Factory, ChevronLeft, ChevronRight, AlertTriangle, X, CheckCircle } from 'lucide-react';

export default function ManufacturersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Estado para Modales
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<string | null>(null);

  const { 
    manufacturers, 
    pagination, 
    isLoading, 
    error, 
    deleteManufacturer,
    isDeleting,
    refetch
  } = useManufacturers(page, 10, search);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); 
  };

  // Abre el modal de confirmación
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  // Ejecuta la eliminación real
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteManufacturer(deleteId);
      setDeleteId(null);
      setSuccessModal('El fabricante ha sido eliminado correctamente.');
      refetch();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      setDeleteId(null); // Cerramos el de confirmación
      // Mostramos el de error con el mensaje del backend o uno genérico
      const msg = error.response?.data?.error || 'No se pudo eliminar el fabricante. Verifique que no tenga productos asociados.';
      setErrorModal(msg);
    }
  };

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      if (currentPage <= 3) { startPage = 1; endPage = maxVisiblePages; } 
      else if (currentPage >= totalPages - 2) { startPage = totalPages - maxVisiblePages + 1; endPage = totalPages; }
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }
    return pageNumbers;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Factory className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
          <button onClick={() => refetch()} className="px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fabricantes</h1>
          <p className="text-gray-600 mt-2">Gestión optimizada de fabricantes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} disabled={isLoading} className="flex items-center px-4 py-2 border bg-white border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <Link href="/dashboard/manufacturers/new">
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all">
              <Plus className="h-4 w-4 mr-2" /> Nuevo Fabricante
            </button>
          </Link>
        </div>
      </div>

      <ManufacturerStatsCards totalCount={pagination.total} isLoading={isLoading} />
      <ManufacturerFilters searchTerm={search} onSearchChange={handleSearchChange} onSearchSubmit={() => {}} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <ManufacturerTable 
            manufacturers={manufacturers} 
            loading={isLoading} 
            onDelete={handleDeleteClick} 
            isDeleting={isDeleting} 
         />
         
         <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t bg-gray-50/50">
            <span className="text-sm text-gray-600 mb-2 sm:mb-0">
               Mostrando <span className="font-medium">{(page - 1) * 10 + 1}</span> a <span className="font-medium">{Math.min(page * 10, pagination.total)}</span> de <span className="font-medium">{pagination.total}</span>
            </span>
            <div className="flex items-center gap-1">
               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 shadow-sm transition-all mx-1"><ChevronLeft className="h-4 w-4 text-gray-600" /></button>
               {getPageNumbers().map((pageNum) => (
                 <button key={pageNum} onClick={() => setPage(pageNum)} disabled={isLoading} className={`min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm ${page === pageNum ? 'bg-blue-600 text-white border border-blue-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{pageNum}</button>
               ))}
               {pagination.totalPages > 5 && page < pagination.totalPages - 2 && (<><span className="px-2 text-gray-400">...</span><button onClick={() => setPage(pagination.totalPages)} className="min-w-[2.5rem] px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 shadow-sm">{pagination.totalPages}</button></>)}
               <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages || isLoading} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 shadow-sm transition-all mx-1"><ChevronRight className="h-4 w-4 text-gray-600" /></button>
            </div>
         </div>
      </div>

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in zoom-in-95">
             <button onClick={() => setDeleteId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
             <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Fabricante?</h3>
                <p className="text-gray-500 mb-6">Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este registro permanentemente?</p>
                <div className="flex gap-3 w-full">
                   <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                   <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all">{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL DE ERROR */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in zoom-in-95">
             <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No se pudo eliminar</h3>
                <p className="text-gray-500 mb-6">{errorModal}</p>
                <button onClick={() => setErrorModal(null)} className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">Entendido</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in zoom-in-95">
             <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Eliminado!</h3>
                <p className="text-gray-500 mb-6">{successModal}</p>
                <button onClick={() => setSuccessModal(null)} className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors">Aceptar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}