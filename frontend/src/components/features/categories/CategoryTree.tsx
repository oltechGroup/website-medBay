//frontend/src/components/features/categories/CategoryTree.tsx
'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/hooks/useCategories';

// Extend Category interface for the tree structure
interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

interface CategoryTreeProps {
  onCategorySelect?: (category: Category) => void;
  selectedCategoryId?: string;
}

export const CategoryTree = ({ onCategorySelect, selectedCategoryId }: CategoryTreeProps) => {
  const { categories, isLoading } = useCategories();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Build tree structure
  const buildTree = (parentId: string | null = null): CategoryWithChildren[] => {
    return categories
      .filter(category => category.parent_id === parentId)
      .map(category => ({
        ...category,
        children: buildTree(category.id)
      }));
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const renderCategory = (category: CategoryWithChildren, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="select-none">
        {/* Category Item */}
        <div
          className={`flex items-center py-2 px-3 rounded-lg transition-colors cursor-pointer group ${
            isSelected
              ? 'bg-blue-50 border border-blue-200'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleCategoryClick(category)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center mr-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              <svg
                className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Placeholder for categories without children */}
          {!hasChildren && <div className="w-5 h-5 mr-2" />}

          {/* Category Icon */}
          <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center mr-3 rounded ${
            hasChildren ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {hasChildren ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              )}
            </svg>
          </div>

          {/* Category Name and Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium truncate ${
                isSelected ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {category.name}
              </span>
            </div>
            
            {category.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {category.description}
              </p>
            )}
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <div className="flex-shrink-0 ml-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-gray-200">
            {category.children!.map((child: CategoryWithChildren) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="h-4 bg-gray-200 rounded w-3/4" style={{ marginLeft: `${(i % 3) * 20}px` }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rootCategories = buildTree(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900">Category Structure</h3>
        <p className="text-sm text-gray-500 mt-1">
          {rootCategories.length} main categories • {categories.length} total
        </p>
      </div>

      {/* Tree Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {rootCategories.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">No categories found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Start by creating your first category.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {rootCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => {
              const allIds = categories.map(cat => cat.id);
              setExpandedCategories(new Set(allIds));
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Expand all
          </button>
          
          <button
            onClick={() => setExpandedCategories(new Set())}
            className="text-gray-600 hover:text-gray-700"
          >
            Collapse all
          </button>
        </div>
      </div>
    </div>
  );
};