// frontend/src/app/dashboard/categories/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryStatsCards } from '@/components/features/categories/CategoryStatsCards';
import { CategoryTable } from '@/components/features/categories/CategoryTable';
import { CategoryTree } from '@/components/features/categories/CategoryTree';
import { Category } from '@/hooks/useCategories';

export default function CategoriesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleEditCategory = (category: Category) => {
    router.push(`/dashboard/categories/edit/${category.id}`);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Organize your products into categories and subcategories
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => router.push('/dashboard/categories/assign')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Assign Products
          </button>
          <button
            onClick={() => router.push('/dashboard/categories/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Category
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <CategoryStatsCards />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Tree */}
        <div className="lg:col-span-1">
          <CategoryTree 
            onCategorySelect={handleCategorySelect}
            selectedCategoryId={selectedCategory?.id}
          />
        </div>

        {/* Category Table */}
        <div className="lg:col-span-2">
          <CategoryTable onEdit={handleEditCategory} />
        </div>
      </div>
    </div>
  );
}