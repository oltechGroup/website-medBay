// src/app/dashboard/inventory/components/AdjustInventoryModal.tsx
import { useState } from 'react';
import { ProductLot, InventoryAdjustment } from '@/hooks/useInventory';

interface AdjustInventoryModalProps {
  lot: ProductLot | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjust: (adjustment: InventoryAdjustment) => Promise<void>;
  isAdjusting: boolean;
}

export default function AdjustInventoryModal({ 
  lot, 
  isOpen, 
  onClose, 
  onAdjust, 
  isAdjusting 
}: AdjustInventoryModalProps) {
  const [adjustment, setAdjustment] = useState('');
  const [reason, setReason] = useState('');

  // Si no hay lote seleccionado, no renderizar el modal
  if (!isOpen || !lot) {
    return null;
  }

  // Ahora podemos acceder a lot de forma segura - USANDO LOS NUEVOS CAMPOS
  const currentQuantity = lot.quantity_on_hand || 0;
  const adjustmentValue = parseInt(adjustment) || 0;
  const newQuantity = currentQuantity + adjustmentValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adjustmentValue === 0) {
      alert('El ajuste no puede ser cero');
      return;
    }

    if (newQuantity < 0) {
      alert('La cantidad resultante no puede ser negativa');
      return;
    }

    await onAdjust({
      lot_id: lot.id,
      adjustment: adjustmentValue,
      reason,
      adjusted_by: 'admin'
    });

    // Reset form
    setAdjustment('');
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setAdjustment('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">
          Ajustar Inventario - {lot.product_name || 'Producto'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información actual */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-700">Lote:</label>
              <p className="text-gray-900">{lot.lot_number || 'N/A'}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Stock Actual:</label>
              <p className="text-gray-900">{currentQuantity} unidades</p>
            </div>
          </div>

          {lot.product_code && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Código:</label>
                <p className="text-gray-900">{lot.product_code}</p>
              </div>
              {lot.manufacturer_name && (
                <div>
                  <label className="font-medium text-gray-700">Fabricante:</label>
                  <p className="text-gray-900">{lot.manufacturer_name}</p>
                </div>
              )}
            </div>
          )}

          {/* Ajuste */}
          <div>
            <label htmlFor="adjustment" className="block text-sm font-medium text-gray-700">
              Ajuste (positivo para agregar, negativo para restar)
            </label>
            <input
              type="number"
              id="adjustment"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: +10 o -5"
              required
            />
          </div>

          {/* Nueva cantidad */}
          {adjustment && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700">
                Nueva cantidad: <span className={newQuantity < 10 ? 'text-red-600' : 'text-green-600'}>
                  {newQuantity} unidades
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Actual: {currentQuantity} + Ajuste: {adjustmentValue} = Nuevo: {newQuantity}
              </p>
            </div>
          )}

          {/* Razón */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Razón del ajuste
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecciona una razón</option>
              <option value="incoming_shipment">Llegada de mercancía</option>
              <option value="damaged">Producto dañado</option>
              <option value="lost">Producto perdido</option>
              <option value="donation">Donación</option>
              <option value="sample">Muestra/Regalo</option>
              <option value="count_error">Error en conteo</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Información adicional si el producto está vencido */}
          {lot.status === 'expired' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">
                  Producto Vencido - Uso Educativo
                </span>
              </div>
              {lot.discount_price_amount && (
                <p className="text-sm text-yellow-700 mt-1">
                  Precio con descuento: ${lot.discount_price_amount}
                </p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isAdjusting || !adjustment || !reason}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isAdjusting ? 'Ajustando...' : 'Ajustar Inventario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}