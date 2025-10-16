// src/components/features/inventory/StockMetrics.tsx
import { ProductLot } from '@/hooks/useInventory';

interface StockMetricsProps {
  activeLots: ProductLot[];
  expiredLots: ProductLot[];
}

export function StockMetrics({ activeLots, expiredLots }: StockMetricsProps) {
  // Métricas para stock activo - usando quantity_on_hand del inventory
  const totalActiveItems = activeLots.reduce((sum, lot) => 
    sum + (lot.inventory?.quantity_on_hand || 0), 0
  );
  
  const nearExpiryCount = activeLots.filter(lot => 
    lot.status === 'near_expiry'
  ).length;
  
  // Low stock: lotes activos con menos de 10 unidades (no es un estado, es una condición)
  const lowStockCount = activeLots.filter(lot => 
    (lot.inventory?.quantity_on_hand || 0) < 10
  ).length;
  
  // Métricas para stock vencido
  const totalExpiredItems = expiredLots.reduce((sum, lot) => 
    sum + (lot.inventory?.quantity_on_hand || 0), 0
  );
  
  const educationalCount = expiredLots.filter(lot => 
    lot.sales_category === 'expired' && lot.status === 'expired'
  ).length;

  // Alertas críticas - CORREGIDO: eliminada la comparación con 'low_stock'
  const criticalAlerts = [
    ...activeLots.filter(lot => {
      const expiryDate = new Date(lot.expiry_date);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }),
    ...activeLots.filter(lot => 
      (lot.inventory?.quantity_on_hand || 0) <= 10
    )
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Stock Activo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">🟢</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Stock Activo</h3>
            <p className="text-2xl font-semibold text-gray-900">{totalActiveItems}</p>
            <p className="text-sm text-gray-500">{activeLots.length} lotes</p>
          </div>
        </div>
      </div>

      {/* Próximos a Vencer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-sm font-bold">🟡</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Próximos a Vencer</h3>
            <p className="text-2xl font-semibold text-gray-900">{nearExpiryCount}</p>
            <p className="text-sm text-gray-500">Lotes en alerta</p>
          </div>
        </div>
      </div>

      {/* Stock Vencido Educativo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">🔵</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Vencido Educativo</h3>
            <p className="text-2xl font-semibold text-gray-900">{educationalCount}</p>
            <p className="text-sm text-gray-500">{totalExpiredItems} unidades</p>
          </div>
        </div>
      </div>

      {/* Alertas Críticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-sm font-bold">🔴</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Alertas Críticas</h3>
            <p className="text-2xl font-semibold text-gray-900">{criticalAlerts.length}</p>
            <p className="text-sm text-gray-500">Requieren atención</p>
          </div>
        </div>
      </div>
    </div>
  );
}