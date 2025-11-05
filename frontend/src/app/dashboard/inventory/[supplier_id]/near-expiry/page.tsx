'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Search, Filter, Download, DollarSign, Box, BarChart3, Calendar } from 'lucide-react';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { ProductCard } from '@/components/features/inventory/ProductCard';

export default function NearExpiryCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const { getCatalogBySupplierAndCategory, loading, error } = useInventory();
  
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('expiry');

  useEffect(() => {
    loadProducts();
  }, [params.supplier_id]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy]);

  const loadProducts = async () => {
    try {
      const productsData = await getCatalogBySupplierAndCategory(params.supplier_id as string, 'near_expiry');
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.product_name.localeCompare(b.product_name);
        case 'price':
          return (a.price_amount || 0) - (b.price_amount || 0);
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

  // Formatear valor monetario
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalValue = products.reduce((sum, product) => 
    sum + (product.quantity * (product.price_amount || 0)), 0
  );

  const totalUnits = products.reduce((sum, product) => sum + (product.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/inventory/${params.supplier_id}`)}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 hover:underline transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al proveedor
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Calendar className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Catálogo - Lotes Fecha Corta</h1>
                <p className="text-gray-600">
                  Lotes próximos a caducar del proveedor
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* 📊 ESTADÍSTICAS MEJORADAS - TONO NEUTRAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 📦 TOTAL DE LOTES */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lotes Fecha Corta</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-xs text-gray-500 mt-1">Lotes próximos a caducar</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Box className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* 🛒 UNIDADES EN STOCK */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalUnits.toLocaleString('es-MX')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Stock en fecha corta</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* 💰 VALOR TOTAL */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Valor de inventario</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 FILTROS Y BÚSQUEDA MEJORADOS */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar lotes por nombre, código o fabricante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              >
                <option value="expiry">Ordenar por caducidad</option>
                <option value="name">Ordenar por nombre</option>
                <option value="price">Ordenar por precio</option>
                <option value="quantity">Ordenar por cantidad</option>
              </select>
            </div>
          </div>
        </div>

        {/* 📈 RESUMEN DE RESULTADOS */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <p className="text-sm font-medium text-amber-800">
                Mostrando <span className="font-bold">{filteredProducts.length}</span> de <span className="font-bold">{products.length}</span> lotes
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                <Filter className="h-4 w-4 mr-1" />
                Limpiar filtros
              </button>
            )}
          </div>
          
          {filteredProducts.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Valor filtrado: <span className="font-semibold text-gray-900">
                  {formatCurrency(filteredProducts.reduce((sum, product) => 
                    sum + (product.quantity * (product.price_amount || 0)), 0
                  ))}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* ❌ MENSAJE DE ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 hover:shadow-md transition-shadow">
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
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={`${product.id}-${product.lot_number}-${product.expiry_date}`} 
                    product={product} 
                  />
                ))}
              </div>
            ) : (
              /* 📭 ESTADO VACÍO MEJORADO */
              <div className="text-center py-16 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="p-4 bg-amber-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchTerm ? 'No se encontraron lotes' : 'No hay lotes en fecha corta'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                  {searchTerm 
                    ? 'No se encontraron lotes que coincidan con tu búsqueda. Intenta con otros términos.'
                    : 'Los lotes con fecha próxima a caducar aparecerán aquí cuando estén disponibles.'
                  }
                </p>
                <div className="flex justify-center space-x-4">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-all"
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Limpiar búsqueda
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/import?supplier_id=${params.supplier_id}`)}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Importar Catálogo
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 📊 PIE DE PÁGINA INFORMATIVO */}
        {filteredProducts.length > 0 && (
          <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Catálogo - Fecha Corta</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600">Lotes únicos:</p>
                    <p className="font-medium text-gray-900">{new Set(filteredProducts.map(p => p.product_code)).size} productos</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stock promedio por lote:</p>
                    <p className="font-medium text-gray-900">
                      {Math.round(totalUnits / filteredProducts.length)} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor promedio por lote:</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(totalValue / filteredProducts.length)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg ml-4">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}