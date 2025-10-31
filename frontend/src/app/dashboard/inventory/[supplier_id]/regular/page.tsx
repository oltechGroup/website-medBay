'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Search, Filter, Download } from 'lucide-react';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { ProductCard } from '@/components/features/inventory/ProductCard';

export default function RegularCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const { getCatalogBySupplierAndCategory, loading, error } = useInventory();
  
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadProducts();
  }, [params.supplier_id]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy]);

  const loadProducts = async () => {
    try {
      const productsData = await getCatalogBySupplierAndCategory(params.supplier_id as string, 'regular');
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

  const totalValue = products.reduce((sum, product) => 
    sum + (product.quantity * (product.price_amount || 0)), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/inventory/${params.supplier_id}`)}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al proveedor
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Catálogo - Productos en Fecha</h1>
                <p className="text-gray-600">
                  Productos con fecha de caducidad vigente del proveedor
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Total Productos</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Stock Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {products.reduce((sum, product) => sum + (product.quantity || 0), 0)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, código o fabricante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price">Ordenar por precio</option>
                <option value="quantity">Ordenar por cantidad</option>
                <option value="expiry">Ordenar por caducidad</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Mostrando {filteredProducts.length} de {products.length} productos
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={`${product.id}-${product.lot_number}-${product.expiry_date}`} product={product} />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos en esta categoría'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Los productos en fecha aparecerán aquí una vez que sean importados'
              }
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}