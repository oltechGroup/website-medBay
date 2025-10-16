// src/app/dashboard/inventory/components/ExpiredStockTable.tsx
import { useState } from 'react';
import { ProductLot, useInventory } from '@/hooks/useInventory';
import AdjustInventoryModal from './AdjustInventoryModal';

interface ExpiredStockTableProps {
  lots: ProductLot[];
}

export function ExpiredStockTable({ lots }: ExpiredStockTableProps) {
  const [adjustingLot, setAdjustingLot] = useState<ProductLot | null>(null);
  const { adjustInventory, isAdjusting } = useInventory();

  // Función para ajuste rápido
  const handleQuickAdd = async (lot: ProductLot, amount: number) => {
    try {
      await adjustInventory({
        lot_id: lot.id,
        adjustment: amount,
        reason: 'quick_addition',
        adjusted_by: 'admin'
      });
    } catch (error) {
      console.error('Error in quick add:', error);
    }
  };

  // Función para determinar el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'quarantine':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para mostrar el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'expired':
        return 'Uso Educativo';
      case 'quarantine':
        return 'En Cuarentena';
      default:
        return status;
    }
  };

  // Calcular días desde expiración
  const getDaysSinceExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = today.getTime() - expiry.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              📚 Stock Vencido - Uso Educativo ({lots.length} lotes)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Estos productos están vencidos pero pueden ser vendidos para fines educativos y de investigación
            </p>
          </div>
          <div className="text-sm text-gray-600">
            {lots.filter(lot => (lot.quantity_on_hand || 0) === 0).length > 0 && (
              <span className="text-orange-600 font-medium">
                {lots.filter(lot => (lot.quantity_on_hand || 0) === 0).length} lotes sin stock
              </span>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ajustes Rápidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Vencido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio con Descuento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lots.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No hay lotes vencidos en el inventario
                  </td>
                </tr>
              ) : (
                lots.map((lot) => {
                  const daysSinceExpiry = getDaysSinceExpiry(lot.expiry_date);
                  const currentQuantity = lot.quantity_on_hand || 0;
                  const isZeroStock = currentQuantity === 0;
                  
                  return (
                    <tr key={lot.id} className={`hover:bg-gray-50 ${isZeroStock ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lot.product_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lot.product_code || 'Sin código'}
                        </div>
                        {lot.manufacturer_name && (
                          <div className="text-xs text-gray-400">
                            {lot.manufacturer_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lot.lot_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${
                          isZeroStock ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {currentQuantity} unidades
                        </div>
                        {isZeroStock && (
                          <div className="text-xs text-red-500 font-medium">¡SIN STOCK!</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleQuickAdd(lot, 1)}
                            className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Agregar 1 unidad"
                            disabled={isAdjusting}
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleQuickAdd(lot, -1)}
                            className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Restar 1 unidad"
                            disabled={isAdjusting || currentQuantity <= 0}
                          >
                            -1
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(lot.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          daysSinceExpiry <= 30 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {daysSinceExpiry} días
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lot.discount_price_amount ? (
                          <span className="text-green-600 font-semibold">
                            ${lot.discount_price_amount}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin descuento</span>
                        )}
                        {lot.expiry_category_name && (
                          <div className="text-xs text-gray-500">
                            {lot.expiry_category_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lot.status)}`}>
                          {getStatusText(lot.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setAdjustingLot(lot)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isAdjusting}
                        >
                          {isAdjusting ? '...' : 'Ajustar Stock'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Información adicional sobre venta educativa */}
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Información sobre venta educativa
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Los productos vencidos pueden ser vendidos a instituciones educativas 
                  para fines de investigación y práctica. Los precios con descuento se aplican
                  automáticamente según las categorías de expiración configuradas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para ajustar inventario */}
      <AdjustInventoryModal
        lot={adjustingLot}
        isOpen={!!adjustingLot}
        onClose={() => setAdjustingLot(null)}
        onAdjust={adjustInventory}
        isAdjusting={isAdjusting}
      />
    </>
  );
}