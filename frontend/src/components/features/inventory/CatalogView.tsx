// frontend/src/components/features/inventory/CatalogView.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Filter, Download, 
  DollarSign, Box, BarChart3, RefreshCw,
  Package, Tag
} from 'lucide-react';
import { useInventory, ProductLot } from '@/hooks/useInventory';
import { ProductCard } from '@/components/features/inventory/ProductCard';

interface CatalogViewProps {
  supplierId: string;
  status: 'available' | 'near_expiry' | 'expired';
  title: string;
  description: string;
  colorScheme: {
    primary: 'green' | 'amber' | 'red';
    icon: React.ComponentType<any>;
    defaultSort: string;
  };
}

export const CatalogView: React.FC<CatalogViewProps> = ({ 
  supplierId, 
  status, 
  title, 
  description, 
  colorScheme 
}) => {
  const router = useRouter();
  const { getCatalogBySupplier, loading, error } = useInventory();
  
  const [products, setProducts] = useState<ProductLot[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductLot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(colorScheme.defaultSort);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, status]);

  useEffect(() => {
    filterAndSortProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchTerm, sortBy]);

  const loadProducts = async () => {
    try {
      const productsData = await getCatalogBySupplier(supplierId, status);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product =>
      product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.product_name || '').localeCompare(b.product_name || '');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'quantity':
          return (b.quantity || 0) - (a.quantity || 0);
        case 'expiry':
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  // Determinar clases de color dinámicamente
  const getColorClasses = (type: 'bg' | 'text' | 'border' | 'ring' | 'badge') => {
    const colorMap = {
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        ring: 'ring-green-500',
        badge: 'bg-green-100 text-green-800 border-green-200'
      },
      amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        ring: 'ring-amber-500',
        badge: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        ring: 'ring-red-500',
        badge: 'bg-red-100 text-red-800 border-red-200'
      }
    };
    return colorMap[colorScheme.primary][type];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalValue = products.reduce((sum, product) => 
    sum + ((product.quantity || 0) * (product.price || 0)), 0
  );

  const totalUnits = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
  const uniqueProducts = new Set(products.map(p => p.product_code)).size;

  const Icon = colorScheme.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 🎯 HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/inventory/${supplierId}`)}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 hover:underline transition-all duration-200 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver al proveedor
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className={`p-3 ${getColorClasses('bg')} rounded-xl border ${getColorClasses('border')}`}>
                <Icon className={`h-8 w-8 ${getColorClasses('text')}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600">{description}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* 📊 ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-xs text-gray-500 mt-1">Lotes encontrados</p>
              </div>
              <div className={`p-3 ${getColorClasses('bg')} rounded-xl`}>
                <Package className={`h-6 w-6 ${getColorClasses('text')}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos Únicos</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueProducts}</p>
                <p className="text-xs text-gray-500 mt-1">Productos diferentes</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades Totales</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">En inventario</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Box className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Valor del catálogo</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 BÚSQUEDA Y FILTROS (CORREGIDO) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {/* ✅ FIX: Texto negro, fondo blanco y placeholder visible */}
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, código, fabricante o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${getColorClasses('ring')} focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white placeholder-gray-400`}
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              {/* ✅ FIX: Texto negro y fondo blanco */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 ${getColorClasses('ring')} focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white`}
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price">Ordenar por precio</option>
                <option value="quantity">Ordenar por cantidad</option>
                <option value="expiry">Ordenar por caducidad</option>
              </select>

              {(searchTerm || sortBy !== colorScheme.defaultSort) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy(colorScheme.defaultSort);
                  }}
                  className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 📈 RESUMEN DE RESULTADOS */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`${getColorClasses('badge')} rounded-lg px-4 py-2 border`}>
              <p className={`text-sm font-medium ${getColorClasses('text')}`}>
                Mostrando {filteredProducts.length} de {products.length} lotes
              </p>
            </div>
            
            {searchTerm && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                <p className="text-sm text-blue-800">
                  Búsqueda: "<span className="font-medium">{searchTerm}</span>"
                </p>
              </div>
            )}
          </div>
          
          {filteredProducts.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Valor filtrado: <span className="font-semibold text-gray-900">
                  {formatCurrency(filteredProducts.reduce((sum, lot) => sum + (lot.quantity * lot.price), 0))}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* ❌ MENSAJE DE ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">Error al cargar el catálogo</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 📦 GRILLA DE PRODUCTOS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* 📭 ESTADO VACÍO */
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className={`p-4 ${getColorClasses('bg')} rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border ${getColorClasses('border')}`}>
              <Icon className={`h-12 w-12 ${getColorClasses('text')}`} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No se encontraron lotes' : `No hay lotes en ${title.toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {searchTerm 
                ? 'No se encontraron lotes que coincidan con tu búsqueda. Intenta con otros términos.'
                : 'Los lotes aparecerán aquí cuando sean importados y coincidan con este estado.'
              }
            </p>
            <div className="flex justify-center space-x-4">
              {(searchTerm || sortBy !== colorScheme.defaultSort) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy(colorScheme.defaultSort);
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Limpiar filtros
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Actualizar
              </button>
            </div>
          </div>
        )}

        {/* 📊 PIE INFORMATIVO */}
        {filteredProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Resumen del Catálogo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Productos únicos:</p>
                    <p className="font-medium text-gray-900">
                      {new Set(filteredProducts.map(lot => lot.product_code)).size} productos
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Proveedores:</p>
                    <p className="font-medium text-gray-900">
                      {new Set(filteredProducts.map(lot => lot.supplier_name)).size} proveedores
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Stock promedio:</p>
                    <p className="font-medium text-gray-900">
                      {Math.round(filteredProducts.reduce((sum, lot) => sum + lot.quantity, 0) / filteredProducts.length)} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Valor promedio:</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(filteredProducts.reduce((sum, lot) => sum + (lot.quantity * lot.price), 0) / filteredProducts.length)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};