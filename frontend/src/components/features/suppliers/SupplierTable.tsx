'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building, 
  FileText,
  Calendar,
  Clock
} from 'lucide-react';
import { Supplier } from '@/hooks/useSuppliers';
import Button from '@/components/ui/Button';

interface SupplierTableProps {
  suppliers: Supplier[];
  loading?: boolean;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export default function SupplierTable({ 
  suppliers, 
  loading, 
  onDelete, 
  isDeleting,
  pagination 
}: SupplierTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const handleEdit = (supplier: Supplier) => {
    router.push(`/dashboard/suppliers/edit/${supplier.id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el proveedor "${name}"?`)) return;
    
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleNotes = (supplierId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proveedores</h3>
        <p className="text-gray-500 mb-6">Comienza agregando tu primer proveedor al sistema.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header de la tabla */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Proveedores ({suppliers.length})
          </h3>
        </div>
      </div>

      {/* Lista de proveedores */}
      <div className="divide-y divide-gray-200">
        {suppliers.map((supplier) => {
          const showNotes = expandedNotes.has(supplier.id);
          const notes = supplier.contact_info?.notas;
          const hasNotes = notes && notes.length > 0;
          const notesPreview = hasNotes && notes.length > 100 ? `${notes.substring(0, 100)}...` : notes;

          return (
            <div key={supplier.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                {/* Información principal */}
                <div className="flex-1">
                  {/* Header con nombre y estado */}
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{supplier.name}</h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {supplier.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Información de contacto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    {/* País y moneda - ✅ SIEMPRE VISIBLE AHORA */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {supplier.country_name} 
                          {supplier.currency_symbol && ` (${supplier.currency_symbol})`}
                        </span>
                      </div>
                      
                      {supplier.contact_info?.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a 
                            href={supplier.contact_info.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {supplier.contact_info.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Contacto */}
                    <div className="space-y-2">
                      {supplier.contact_info?.telefono && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{supplier.contact_info.telefono}</span>
                        </div>
                      )}
                      
                      {supplier.contact_info?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a 
                            href={`mailto:${supplier.contact_info.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {supplier.contact_info.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-3">
                    {/* Persona de contacto y dirección */}
                    {(supplier.contact_info?.persona_contacto || supplier.contact_info?.direccion) && (
                      <div className="text-sm text-gray-600 space-y-1">
                        {supplier.contact_info.persona_contacto && (
                          <p><strong>Contacto:</strong> {supplier.contact_info.persona_contacto}</p>
                        )}
                        {supplier.contact_info.direccion && (
                          <p><strong>Dirección:</strong> {supplier.contact_info.direccion}</p>
                        )}
                      </div>
                    )}

                    {/* Notas adicionales */}
                    {hasNotes && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Notas adicionales</span>
                          </div>
                          {notes && notes.length > 100 && (
                            <button
                              onClick={() => toggleNotes(supplier.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {showNotes ? 'Ver menos' : 'Ver más'}
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {showNotes ? notes : notesPreview}
                        </p>
                      </div>
                    )}

                    {/* Fechas detalladas */}
                    <div className="flex items-center space-x-6 text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          <strong>Creado:</strong> {formatDate(supplier.created_at)}
                        </span>
                      </div>
                      {supplier.updated_at !== supplier.created_at && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            <strong>Actualizado:</strong> {formatDate(supplier.updated_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplier.id, supplier.name)}
                    disabled={isDeleting && deletingId === supplier.id}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}