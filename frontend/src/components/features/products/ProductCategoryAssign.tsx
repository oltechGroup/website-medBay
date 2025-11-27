// frontend/src/components/features/products/ProductCategoryAssign.tsx

'use client';

import { useState } from 'react';
import { Product, useProducts } from '@/hooks/useProducts';
import { Category, useCategories } from '@/hooks/useCategories';

interface ProductCategoryAssignProps {
  products: Product[];
  onAssignComplete?: () => void;
}

type ViewMode = 'without-categories' | 'all-products';

export const ProductCategoryAssign = ({ products, onAssignComplete }: ProductCategoryAssignProps) => {
  const { categories } = useCategories();
  const { batchAssignCategories, isBatchAssigning } = useProducts();
  
  const [viewMode, setViewMode] = useState<ViewMode>('without-categories');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchProducts, setSearchProducts] = useState('');
  const [searchCategories, setSearchCategories] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Filtrar productos según el modo de vista
  const filteredProductsByView = products.filter(product => {
    if (viewMode === 'without-categories') {
      return !product.category_ids || product.category_ids.length === 0;
    }
    return true; // 'all-products' muestra todos
  });

  // Filtrar productos según búsqueda Y modo de vista
  const filteredProducts = filteredProductsByView.filter(product =>
    product.description.toLowerCase().includes(searchProducts.toLowerCase()) ||
    product.global_sku?.toLowerCase().includes(searchProducts.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchCategories.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchCategories.toLowerCase())
  );

  // Estadísticas reales
  const productsWithCategories = products.filter(product => 
    product.category_ids && product.category_ids.length > 0
  );
  const productsWithoutCategories = products.filter(product => 
    !product.category_ids || product.category_ids.length === 0
  );

  const completionPercentage = products.length > 0 
    ? Math.round((productsWithCategories.length / products.length) * 100)
    : 0;

  // Selección masiva
  const toggleSelectAllProducts = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length 
        ? [] 
        : filteredProducts.map(p => p.id)
    );
  };

  const toggleSelectAllCategories = () => {
    setSelectedCategories(
      selectedCategories.length === filteredCategories.length 
        ? [] 
        : filteredCategories.map(c => c.id)
    );
  };

  // Toggle individual
  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Asignación
  const handleAssign = async () => {
    if (selectedProducts.length === 0 || selectedCategories.length === 0) return;
    
    try {
      await batchAssignCategories(selectedProducts, selectedCategories);
      setSelectedProducts([]);
      setSelectedCategories([]);
      setShowConfirmation(false);
      setShowDetails(false);
      onAssignComplete?.();
    } catch (error) {
      alert('Error al asignar categorías');
    }
  };

  // Información para el modal
  const selectedProductNames = products
    .filter(p => selectedProducts.includes(p.id))
    .map(p => p.description);

  const selectedCategoryNames = categories
    .filter(cat => selectedCategories.includes(cat.id))
    .map(cat => cat.name);

  return (
    <div className="space-y-6">
      {/* 📊 Contadores con diseño de cards bonitas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total de Productos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Productos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Productos con Categorías */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Categorías</p>
              <p className="text-2xl font-bold text-gray-900">{productsWithCategories.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Productos sin Categorías */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sin Categorías</p>
              <p className="text-2xl font-bold text-gray-900">{productsWithoutCategories.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Porcentaje de Completado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completado</p>
              <p className="text-2xl font-bold text-gray-900">{completionPercentage}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 🔮 Barra de Progreso Mejorada */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Progreso de Categorización</h3>
            <p className="text-gray-600 mt-1">
              {productsWithCategories.length} de {products.length} productos tienen categorías asignadas
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
            <div className="text-sm text-gray-500">completado</div>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 🎯 Panel de Control */}
      {(selectedProducts.length > 0 || selectedCategories.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <p className="text-sm font-medium text-blue-800">
                📦 {selectedProducts.length} producto(s) seleccionado(s)
              </p>
              <p className="text-sm text-blue-600 mt-1">
                🏷️ {selectedCategories.length} categoría(s) seleccionada(s)
              </p>
            </div>
            
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={isBatchAssigning || selectedProducts.length === 0 || selectedCategories.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              {isBatchAssigning ? '🔄 Asignando...' : '✅ Asignar Categorías'}
            </button>
          </div>
        </div>
      )}

      {/* 📦 Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Columna Productos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Productos {viewMode === 'without-categories' && '(Sin Categorías)'}
              </h3>
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              {/* 🎨 FILTRO MEJORADO - SIN ANIMACIONES MOLESTAS */}
              <div className="relative">
                <div className="flex bg-gray-50 rounded-xl p-1.5 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setViewMode('without-categories')}
                    className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      viewMode === 'without-categories'
                        ? 'text-white bg-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Sin Categorías
                  </button>
                  <button
                    onClick={() => setViewMode('all-products')}
                    className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      viewMode === 'all-products'
                        ? 'text-white bg-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Todos
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 min-w-20 text-right">
                  {selectedProducts.length}/{filteredProducts.length}
                </span>
                <button
                  onClick={toggleSelectAllProducts}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all duration-200 border border-blue-100 hover:border-blue-200"
                >
                  {selectedProducts.length === filteredProducts.length ? 'Desmarcar' : 'Marcar'} todos
                </button>
              </div>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={searchProducts}
              onChange={(e) => setSearchProducts(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Lista de Productos - SIN ANIMACIONES MOLESTAS */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedProducts.includes(product.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    selectedProducts.includes(product.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}>
                    {selectedProducts.includes(product.id) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.description}</h4>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        SKU: {product.global_sku || 'N/A'}
                      </span>
                      {product.manufacturer_name && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {product.manufacturer_name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      selectedProducts.includes(product.id) ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {product.category_ids?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">categorías</div>
                  </div>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="mb-3">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                {searchProducts 
                  ? 'No se encontraron productos que coincidan con la búsqueda' 
                  : viewMode === 'without-categories'
                    ? '🎉 ¡Todos los productos tienen categorías asignadas!'
                    : 'No hay productos disponibles'
                }
              </div>
            )}
          </div>
        </div>

        {/* Columna Categorías */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {selectedCategories.length} seleccionadas
              </span>
              <button
                onClick={toggleSelectAllCategories}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all duration-200 border border-blue-100 hover:border-blue-200"
              >
                {selectedCategories.length === filteredCategories.length ? 'Desmarcar' : 'Marcar'} todas
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="🔍 Buscar categorías..."
              value={searchCategories}
              onChange={(e) => setSearchCategories(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Lista de Categorías - SIN ANIMACIONES MOLESTAS */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedCategories.includes(category.id)
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    selectedCategories.includes(category.id)
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}>
                    {selectedCategories.includes(category.id) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    {category.description && (
                      <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                    )}
                    {category.parent_name && (
                      <p className="text-gray-500 text-xs mt-1">Subcategoría de {category.parent_name}</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      selectedCategories.includes(category.id) ? 'text-green-700' : 'text-gray-900'
                    }`}>
                      {products.filter(p => p.category_ids?.includes(category.id)).length}
                    </div>
                    <div className="text-xs text-gray-500">productos</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🎭 MODAL DE CONFIRMACIÓN MEJORADO */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white ${showDetails ? 'w-11/12 max-w-4xl' : 'w-96'}`}>
            <div className="mt-3 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              <h3 className="text-lg font-medium text-gray-900">
                {showDetails ? 'Detalles de la Asignación' : '¿Asignar categorías?'}
              </h3>
              
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Estás a punto de asignar <strong>{selectedCategories.length} categoría(s)</strong> a{' '}
                  <strong>{selectedProducts.length} producto(s)</strong>.
                </p>

                {/* VISTA NORMAL */}
                {!showDetails && (
                  <>
                    {/* Mostrar algunas categorías seleccionadas */}
                    {selectedCategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Categorías seleccionadas:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {selectedCategoryNames.slice(0, 3).map((name, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {name}
                            </span>
                          ))}
                          {selectedCategories.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{selectedCategories.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mostrar algunos productos seleccionados */}
                    {selectedProducts.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Algunos productos seleccionados:</p>
                        <div className="text-xs text-gray-500 space-y-1 max-h-20 overflow-y-auto">
                          {selectedProductNames.slice(0, 3).map((name, index) => (
                            <p key={index} className="truncate">• {name}</p>
                          ))}
                          {selectedProducts.length > 3 && (
                            <p className="text-gray-400">... y {selectedProducts.length - 3} más</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* VISTA DETALLADA */}
                {showDetails && (
                  <div className="mt-4 space-y-4">
                    {/* Productos seleccionados - Lista completa */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        📦 Todos los productos seleccionados ({selectedProducts.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                        {selectedProductNames.map((name, index) => (
                          <div key={index} className="flex items-center py-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <span className="text-sm text-gray-700">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categorías seleccionadas - Lista completa */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        📋 Todas las categorías seleccionadas ({selectedCategories.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                        {selectedCategoryNames.map((name, index) => (
                          <div key={index} className="flex items-center py-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <span className="text-sm text-gray-700">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumen de relaciones */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 text-center">
                        Se crearán <strong>{selectedCategories.length * selectedProducts.length} relaciones</strong> en total
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTONES DEL MODAL */}
              <div className="flex justify-center space-x-3 mt-4">
                {/* Botón Detalles/Ocultar */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  {showDetails ? '👁️ Ocultar Detalles' : '📊 Ver Detalles'}
                </button>

                {/* Botón Cancelar */}
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setShowDetails(false);
                  }}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                
                {/* Botón Confirmar */}
                <button
                  onClick={handleAssign}
                  disabled={isBatchAssigning}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isBatchAssigning ? '🔄 Asignando...' : '✅ Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};