// src/app/dashboard/inventory/components/InventoryTabs.tsx
interface InventoryTabsProps {
  activeTab: 'active' | 'expired';
  onTabChange: (tab: 'active' | 'expired') => void;
}

export function InventoryTabs({ activeTab, onTabChange }: InventoryTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('active')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'active'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          🟢 Stock Activo
        </button>
        <button
          onClick={() => onTabChange('expired')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'expired'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          🔴 Stock Vencido
        </button>
      </nav>
    </div>
  );
}