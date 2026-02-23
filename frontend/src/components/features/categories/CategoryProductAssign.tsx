//frontend/src/components/features/categories/CategoryProductAssign.tsx
'use client';

import { useState } from 'react';
import { Category, useCategories } from '@/hooks/useCategories';
import { Product, useProducts } from '@/hooks/useProducts';

interface CategoryProductAssignProps {
  categories: Category[];
  onAssignComplete?: () => void;
}

export const CategoryProductAssign = ({ categories, onAssignComplete }: CategoryProductAssignProps) => {
  const { products } = useProducts();
  const { batchAssignProducts, isBatchAssigning } = useCategories();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchCategories, setSearchCategories] = useState('');
  const [searchProducts, setSearchProducts] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Filter categories and products based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchCategories.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchCategories.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.description.toLowerCase().includes(searchProducts.toLowerCase()) ||
    product.global_sku?.toLowerCase().includes(searchProducts.toLowerCase())
  );

  // Real statistics
  const categoriesWithProducts = categories.filter(cat => 
    products.some(p => p.category_ids?.includes(cat.id))
  );
  const categoriesWithoutProducts = categories.filter(cat => 
    !products.some(p => p.category_ids?.includes(cat.id))
  );

  const completionPercentage = categories.length > 0 
    ? Math.round((categoriesWithProducts.length / categories.length) * 100)
    : 0;

  // Bulk selection
  const toggleSelectAllCategories = () => {
    setSelectedCategories(
      selectedCategories.length === filteredCategories.length 
        ? [] 
        : filteredCategories.map(c => c.id)
    );
  };

  const toggleSelectAllProducts = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length 
        ? [] 
        : filteredProducts.map(p => p.id)
    );
  };

  // Individual toggle
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Assignment
  const handleAssign = async () => {
    if (selectedCategories.length === 0 || selectedProducts.length === 0) return;
    
    try {
      await batchAssignProducts(selectedCategories, selectedProducts);
      setSelectedCategories([]);
      setSelectedProducts([]);
      onAssignComplete?.();
    } catch (error) {
      alert('Error assigning products');
    }
  };

  // Information for the modal
  const selectedCategoryNames = categories
    .filter(cat => selectedCategories.includes(cat.id))
    .map(cat => cat.name);

  const selectedProductNames = products
    .filter(p => selectedProducts.includes(p.id))
    .map(p => p.description)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 📊 Counters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        {/* Categories with Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Products</p>
              <p className="text-2xl font-bold text-gray-900">{categoriesWithProducts.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Categories without Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Without Products</p>
              <p className="text-2xl font-bold text-gray-900">{categoriesWithoutProducts.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 🔮 Progress Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Categorization Progress</h3>
            <p className="text-gray-600 mt-1">
              {categoriesWithProducts.length} of {categories.length} categories have products assigned
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
            <div className="text-sm text-gray-500">completed</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 🎯 Control Panel */}
      {(selectedCategories.length > 0 || selectedProducts.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <p className="text-sm font-medium text-blue-800">
                🏷️ {selectedCategories.length} category(ies) selected
              </p>
              <p className="text-sm text-blue-600 mt-1">
                📦 {selectedProducts.length} product(s) selected
              </p>
            </div>
            
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={isBatchAssigning || selectedCategories.length === 0 || selectedProducts.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              {isBatchAssigning ? '🔄 Assigning...' : '✅ Assign Products'}
            </button>
          </div>
        </div>
      )}

      {/* 📦 Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Categories Column */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {selectedCategories.length} selected
              </span>
              <button
                onClick={toggleSelectAllCategories}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                {selectedCategories.length === filteredCategories.length ? 'Deselect' : 'Select'} all
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="🔍 Search categories..."
              value={searchCategories}
              onChange={(e) => setSearchCategories(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedCategories.includes(category.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                    selectedCategories.includes(category.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {selectedCategories.includes(category.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <p className="text-gray-500 text-xs mt-1">Subcategory of {category.parent_name}</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {products.filter(p => p.category_ids?.includes(category.id)).length}
                    </div>
                    <div className="text-xs text-gray-500">products</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Column */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {selectedProducts.length} selected
              </span>
              <button
                onClick={toggleSelectAllProducts}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                {selectedProducts.length === filteredProducts.length ? 'Deselect' : 'Select'} all
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchProducts}
              onChange={(e) => setSearchProducts(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedProducts.includes(product.id)
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                    selectedProducts.includes(product.id)
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {selectedProducts.includes(product.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.description}</h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        SKU: {product.global_sku || 'N/A'}
                      </span>
                      {product.manufacturer_name && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {product.manufacturer_name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {product.category_ids?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">categories</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🎭 CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white ${showDetails ? 'w-11/12 max-w-4xl' : 'w-96'}`}>
            <div className="mt-3 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              <h3 className="text-lg font-medium text-gray-900">
                {showDetails ? 'Assignment Details' : 'Assign products?'}
              </h3>
              
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  You are about to assign <strong>{selectedProducts.length} product(s)</strong> to{' '}
                  <strong>{selectedCategories.length} category(ies)</strong>.
                </p>

                {/* NORMAL VIEW */}
                {!showDetails && (
                  <>
                    {/* Selected categories preview */}
                    {selectedCategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Selected categories:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {selectedCategoryNames.slice(0, 3).map((name, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {name}
                            </span>
                          ))}
                          {selectedCategories.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{selectedCategories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selected products preview */}
                    {selectedProducts.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Selected products preview:</p>
                        <div className="text-xs text-gray-500 space-y-1 max-h-20 overflow-y-auto">
                          {selectedProductNames.slice(0, 3).map((name, index) => (
                            <p key={index} className="truncate">• {name}</p>
                          ))}
                          {selectedProducts.length > 3 && (
                            <p className="text-gray-400">... and {selectedProducts.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* DETAILED VIEW */}
                {showDetails && (
                  <div className="mt-4 space-y-4">
                    {/* Full Categories List */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        📋 All selected categories ({selectedCategories.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 text-left">
                        {selectedCategoryNames.map((name, index) => (
                          <div key={index} className="flex items-center py-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <span className="text-sm text-gray-700">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full Products List */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        📦 All selected products ({selectedProducts.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 text-left">
                        {products
                          .filter(p => selectedProducts.includes(p.id))
                          .map((product, index) => (
                            <div key={product.id} className="flex items-center py-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                              <div>
                                <span className="text-sm text-gray-700 block">{product.description}</span>
                                <span className="text-xs text-gray-500">SKU: {product.global_sku || 'N/A'}</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* Relation summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 text-center">
                        A total of <strong>{selectedCategories.length * selectedProducts.length} relations</strong> will be created
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL BUTTONS */}
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  {showDetails ? '👁️ Hide Details' : '📊 View Details'}
                </button>

                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setShowDetails(false);
                  }}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await batchAssignProducts(selectedCategories, selectedProducts);
                      setSelectedCategories([]);
                      setSelectedProducts([]);
                      setShowConfirmation(false);
                      setShowDetails(false);
                      onAssignComplete?.();
                    } catch (error) {
                      alert('Error assigning products');
                    }
                  }}
                  disabled={isBatchAssigning}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isBatchAssigning ? '🔄 Assigning...' : '✅ Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};