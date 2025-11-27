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
  User,
  Calendar,
  Clock
} from 'lucide-react';
import { Manufacturer } from '@/hooks/useManufacturers';

interface ManufacturerTableProps {
  manufacturers: Manufacturer[];
  loading?: boolean;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export default function ManufacturerTable({ 
  manufacturers, 
  loading, 
  onDelete, 
  isDeleting 
}: ManufacturerTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (manufacturer: Manufacturer) => {
    router.push(`/dashboard/manufacturers/edit/${manufacturer.id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el fabricante "${name}"?`)) return;
    
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
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

  if (!manufacturers || manufacturers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay fabricantes</h3>
        <p className="text-gray-500 mb-6">Comienza agregando tu primer fabricante al sistema.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header de la tabla */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Fabricantes ({manufacturers.length})
          </h3>
        </div>
      </div>

      {/* Lista de fabricantes */}
      <div className="divide-y divide-gray-200">
        {manufacturers.map((manufacturer) => (
          <div key={manufacturer.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              {/* Información principal */}
              <div className="flex-1">
                {/* Header con nombre */}
                <div className="flex items-center space-x-3 mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">{manufacturer.name}</h4>
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  {/* Columna 1: Website y Contacto */}
                  <div className="space-y-2">
                    {manufacturer.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a 
                          href={manufacturer.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {manufacturer.website}
                        </a>
                      </div>
                    )}
                    
                    {manufacturer.contact_info?.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${manufacturer.contact_info.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {manufacturer.contact_info.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Columna 2: Teléfono y Persona de Contacto */}
                  <div className="space-y-2">
                    {manufacturer.contact_info?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{manufacturer.contact_info.phone}</span>
                      </div>
                    )}
                    
                    {manufacturer.contact_info?.contact_person && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{manufacturer.contact_info.contact_person}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-3">
                  {/* Dirección */}
                  {manufacturer.contact_info?.address && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-gray-700 block mb-1">Dirección</span>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {manufacturer.contact_info.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fechas detalladas */}
                  <div className="flex items-center space-x-6 text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        <strong>Creado:</strong> {formatDate(manufacturer.created_at)}
                      </span>
                    </div>
                    {manufacturer.updated_at && manufacturer.updated_at !== manufacturer.created_at && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          <strong>Actualizado:</strong> {formatDate(manufacturer.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(manufacturer)}
                  className="flex items-center justify-center p-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  title="Editar fabricante"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(manufacturer.id, manufacturer.name)}
                  disabled={isDeleting && deletingId === manufacturer.id}
                  className="flex items-center justify-center p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                  title="Eliminar fabricante"
                >
                  {isDeleting && deletingId === manufacturer.id ? (
                    <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}