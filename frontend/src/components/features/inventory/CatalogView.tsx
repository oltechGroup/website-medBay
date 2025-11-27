// frontend/src/components/features/inventory/CatalogView.txs

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Filter, Download, 
  DollarSign, Box, BarChart3 
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

  useEffect(() => {
    loadProducts();
  }, [supplierId, status]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy]);

  const loadProducts = async () => {
    try {
      const productsData = await getCatalogBySupplier(supplierId, status);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
    }
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
  const getColorClasses = (type: 'bg' | 'text' | 'border' | 'ring') => {
    const colorMap = {
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200',
        ring: 'ring-green-500'
      },
      amber: {
        bg: 'bg-amber-100',
        text: 'text-amber-600',
        border: 'border-amber-200',
        ring: 'ring-amber-500'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        border: 'border-red-200',
        ring: 'ring-red-500'
      }
    };
    return colorMap[colorScheme.primary][type];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalValue = products.reduce((sum, product) => 
    sum + ((product.quantity || 0) * (product.price || 0)), 0
  );

  const totalUnits = products.reduce((sum, product) => sum + (product.quantity || 0), 0);

  const Icon = colorScheme.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/inventory/${supplierId}`)}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 hover:underline transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al proveedor
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className={`p-3 ${getColorClasses('bg')} rounded-lg`}>
                <Icon className={`h-8 w-8 ${getColorClasses('text')}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600">{description}</p>
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div className={`p-3 ${getColorClasses('bg')} rounded-lg`}>
                <Box className={`h-6 w-6 ${getColorClasses('text')}`} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</p>
              </div>
              <div className={`p-3 ${getColorClasses('bg')} rounded-lg`}>
                <Box className={`h-6 w-6 ${getColorClasses('text')}`} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <div className={`p-3 ${getColorClasses('bg')} rounded-lg`}>
                <DollarSign className={`h-6 w-6 ${getColorClasses('text')}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${getColorClasses('ring')} focus:border-${colorScheme.primary}-500`}
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 ${getColorClasses('ring')} focus:border-${colorScheme.primary}-500`}
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price">Ordenar por precio</option>
                <option value="quantity">Ordenar por cantidad</option>
                <option value="expiry">Ordenar por caducidad</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex items-center justify-between mb-6">
          <div className={`${getColorClasses('bg')} ${getColorClasses('border')} rounded-lg px-4 py-2`}>
            <p className={`text-sm font-medium ${getColorClasses('text')}`}>
              Mostrando {filteredProducts.length} de {products.length} lotes
            </p>
          </div>
        </div>

        {/* Grid de Productos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
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
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <div className={`p-4 ${getColorClasses('bg')} rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center`}>
              <Icon className={`h-12 w-12 ${getColorClasses('text')}`} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No se encontraron lotes' : `No hay lotes en ${title.toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda.'
                : 'Los lotes aparecerán aquí cuando sean importados.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};