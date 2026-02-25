// frontend/src/app/dashboard/categories/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryStatsCards } from '@/components/features/categories/CategoryStatsCards';
import { CategoryTable } from '@/components/features/categories/CategoryTable';
import { CategoryTree } from '@/components/features/categories/CategoryTree';
import { Category } from '@/hooks/useCategories';
import { Plus, LayoutGrid, ListTree } from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ======= HEADER ======= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Category Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Organize your visual catalog and product hierarchies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/categories/new')}
            className="inline-flex items-center px-6 py-2.5 border border-transparent shadow-lg shadow-blue-900/20 text-sm font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2 stroke-[3]" />
            New Category
          </button>
        </div>
      </div>

      {/* ======= STATS ======= */}
      <CategoryStatsCards />

      {/* ======= MAIN CONTENT ======= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Category Tree Structure */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ListTree className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Hierarchical Tree</h2>
          </div>
          <CategoryTree 
            onCategorySelect={handleCategorySelect}
            selectedCategoryId={selectedCategory?.id}
          />
        </div>

        {/* RIGHT COLUMN: Management Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <LayoutGrid className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Management Table</h2>
          </div>
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <CategoryTable onEdit={handleEditCategory} />
          </div>
        </div>

      </div>
    </div>
  );
}