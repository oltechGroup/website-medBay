'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building, 
  Package, 
  Calendar, 
  ArrowLeft,
  Tag,
  BarChart3,
  Upload,
  Eye
} from 'lucide-react';
import { useInventory, SupplierSummary } from '@/hooks/useInventory';
import Link from 'next/link';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getSuppliersSummary, loading } = useInventory();
  
  const [supplier, setSupplier] = useState<SupplierSummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSupplierData();
  }, [params.supplier_id]);

  const loadSupplierData = async () => {
    try {
      const suppliers = await getSuppliersSummary();
      const foundSupplier = suppliers.find(s => s.id === params.supplier_id);
      setSupplier(foundSupplier || null);
    } catch (error) {
      console.error('Error loading supplier data:', error);
    }
  };

  if (loading && !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Proveedor no encontrado</h3>
            <p className="text-gray-500 mb-6">El proveedor que buscas no existe o no está disponible.</p>
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inventario
            </button>
          </div>
        </div>
      </div>
    );
  }

  const catalogStats = [
    {
      title: 'Productos en Fecha',
      value: supplier.regular_products,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: Package,
      description: 'Productos con fecha vigente',
      link: `/dashboard/inventory/${supplier.id}/regular`
    },
    {
      title: 'Productos Fecha Corta',
      value: supplier.near_expiry_products,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: Calendar,
      description: 'Próximos a caducar',
      link: `/dashboard/inventory/${supplier.id}/near-expiry`
    },
    {
      title: 'Productos Caducados',
      value: supplier.expired_products,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: Tag,
      description: 'Productos vencidos',
      link: `/dashboard/inventory/${supplier.id}/expired`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/inventory')}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inventario
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{supplier.supplier_name}</h1>
                <p className="text-gray-600">
                  Gestión de catálogos y productos de este proveedor
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/import?supplier_id=${supplier.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Catálogo
              </Link>
              
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalles
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-3xl font-bold text-gray-900">{supplier.total_products}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Fecha</p>
                <p className="text-3xl font-bold text-green-600">{supplier.regular_products}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha Corta</p>
                <p className="text-3xl font-bold text-amber-600">{supplier.near_expiry_products}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Caducados</p>
                <p className="text-3xl font-bold text-red-600">{supplier.expired_products}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Tag className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Navigation */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Catálogos del Proveedor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {catalogStats.map((stat, index) => (
              <Link
                key={index}
                href={stat.link}
                className="block"
              >
                <div className={`border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${stat.bgColor} ${stat.borderColor}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{stat.title}</h3>
                      <p className="text-sm text-gray-600">{stat.description}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      Ver Catálogo
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Información del Proveedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Última importación:</p>
                  <p className="font-medium text-gray-900">
                    {supplier.last_import 
                      ? new Date(supplier.last_import).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'No hay importaciones registradas'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Estado:</p>
                  <p className="font-medium text-green-600">Activo</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}