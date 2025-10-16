// src/app/dashboard/inventory/components/ActiveStockTable.tsx - VERSIÓN CORREGIDA
import { useState } from 'react';
import { ProductLot, useInventory } from '@/hooks/useInventory';
import AdjustInventoryModal from './AdjustInventoryModal';
import CreateLotModal from './CreateLotModal';

interface ActiveStockTableProps {
  lots: ProductLot[];
}

export function ActiveStockTable({ lots }: ActiveStockTableProps) {
  const [adjustingLot, setAdjustingLot] = useState<ProductLot | null>(null);
  const [creatingLot, setCreatingLot] = useState<ProductLot | null>(null);
  const { 
    updateLotStatus, 
    updateExpiryCategory, 
    adjustInventory, 
    isAdjusting, 
    expiryCategories 
  } = useInventory();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      case 'near_expiry':
        return 'bg-orange-100 text-orange-800';
      case 'quarantine':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => { // ← Cambiado a string | null
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleStatusChange = async (lotId: string | null, newStatus: ProductLot['status']) => { // ← Cambiado a string | null
    if (!lotId) return; // ← Agregada validación para null
    try {
      await updateLotStatus({ lotId, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleExpiryCategoryChange = async (lotId: string | null, categoryId: string) => { // ← Cambiado a string | null
    if (!lotId) return; // ← Agregada validación para null
    try {
      await updateExpiryCategory({ 
        lotId, 
        expiryCategoryId: categoryId || undefined 
      });
    } catch (error) {
      console.error('Error updating expiry category:', error);
    }
  };

  const handleQuickAdd = async (lot: ProductLot, amount: number) => {
    if (!lot.id) return; // ← Agregada validación para null
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

  return (
    <>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            🟢 Stock Activo ({lots.length} registros)
          </h2>
          <div className="text-sm text-gray-600">
            {lots.filter(lot => lot.record_type === 'no_lot').length > 0 && (
              <span className="text-orange-600 font-medium">
                {lots.filter(lot => lot.record_type === 'no_lot').length} productos sin lote
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
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No hay productos en el inventario
                  </td>
                </tr>
              ) : (
                lots.map((lot) => {
                  const daysUntilExpiry = getDaysUntilExpiry(lot.expiry_date);
                  const currentQuantity = lot.quantity_on_hand || 0;
                  const isZeroStock = currentQuantity === 0;
                  const hasLot = lot.record_type === 'has_lot';
                  const noLot = lot.record_type === 'no_lot';
                  
                  // KEY ÚNICA: Combinamos id y product_id para evitar duplicados
                  const uniqueKey = hasLot && lot.id ? lot.id : `no-lot-${lot.product_id}`;
                  
                  return (
                    <tr key={uniqueKey} className={`hover:bg-gray-50 ${isZeroStock ? 'bg-red-50' : ''} ${noLot ? 'bg-yellow-50' : ''}`}>
                      {/* Producto */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lot.product_name || 'Sin nombre'}
                          {noLot && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Sin Lote
                            </span>
                          )}
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

                      {/* Lote */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lot.lot_number || 'N/A'}
                        {noLot && (
                          <div className="text-xs text-yellow-600">Por asignar</div>
                        )}
                      </td>

                      {/* Stock Actual */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${
                          isZeroStock 
                            ? 'text-red-600' 
                            : currentQuantity < 10 
                              ? 'text-orange-600' 
                              : 'text-gray-900'
                        }`}>
                          {currentQuantity} unidades
                        </div>
                        {isZeroStock && (
                          <div className="text-xs text-red-500 font-medium">¡SIN STOCK!</div>
                        )}
                        {!isZeroStock && currentQuantity < 10 && (
                          <div className="text-xs text-orange-500">Stock bajo</div>
                        )}
                      </td>

                      {/* Ajustes Rápidos */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {hasLot ? (
                            <>
                              <button
                                onClick={() => handleQuickAdd(lot, 1)}
                                className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Agregar 1 unidad"
                                disabled={isAdjusting}
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleQuickAdd(lot, 5)}
                                className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Agregar 5 unidades"
                                disabled={isAdjusting}
                              >
                                +5
                              </button>
                              <button
                                onClick={() => handleQuickAdd(lot, -1)}
                                className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Restar 1 unidad"
                                disabled={isAdjusting || currentQuantity <= 0}
                              >
                                -1
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Crear lote primero</span>
                          )}
                        </div>
                      </td>

                      {/* Expiración */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lot.expiry_date ? (
                          <>
                            <div className="text-sm text-gray-900">
                              {new Date(lot.expiry_date).toLocaleDateString()}
                            </div>
                            <div className={`text-xs font-medium ${
                              daysUntilExpiry && daysUntilExpiry <= 30 ? 'text-orange-600' : 'text-gray-500'
                            }`}>
                              {daysUntilExpiry && daysUntilExpiry > 0 
                                ? `${daysUntilExpiry} días restantes`
                                : '¡Expirado!'
                              }
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">No asignada</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasLot ? (
                          <select
                            value={lot.status}
                            onChange={(e) => handleStatusChange(lot.id, e.target.value as ProductLot['status'])}
                            className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${getStatusColor(lot.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="available">Disponible</option>
                            <option value="reserved">Reservado</option>
                            <option value="near_expiry">Próximo a Vencer</option>
                            <option value="quarantine">Cuarentena</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Categoría de Expiración */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasLot ? (
                          <select
                            value={lot.expiry_category_id || ''}
                            onChange={(e) => handleExpiryCategoryChange(lot.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Sin categoría</option>
                            {expiryCategories?.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name} ({category.discount_percentage}% desc)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {hasLot ? (
                          <button
                            onClick={() => setAdjustingLot(lot)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isAdjusting}
                          >
                            {isAdjusting ? '...' : 'Ajustar Stock'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setCreatingLot(lot)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700"
                          >
                            Crear Lote
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Información de ayuda */}
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
          <div className="flex items-center text-sm text-blue-700">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Productos amarillos</span> no tienen lotes asignados. 
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Productos rojos</span> tienen stock cero.
            </span>
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

      {/* Modal para crear lote */}
      <CreateLotModal
        product={creatingLot}
        isOpen={!!creatingLot}
        onClose={() => setCreatingLot(null)}
      />
    </>
  );
}