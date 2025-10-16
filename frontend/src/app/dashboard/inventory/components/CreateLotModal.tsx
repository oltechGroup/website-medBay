// src/app/dashboard/inventory/components/CreateLotModal.tsx
import { useState, useEffect } from 'react';
import { ProductLot, useInventory } from '@/hooks/useInventory';

interface CreateLotModalProps {
  product: ProductLot | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateLotModal({ product, isOpen, onClose }: CreateLotModalProps) {
  const { createLotForProduct, isCreatingLot } = useInventory();
  const [formData, setFormData] = useState({
    lot_number: '',
    expiry_date: '',
    quantity: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        lot_number: '',
        expiry_date: '',
        quantity: 0,
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!product) {
      setError('Producto no disponible');
      return;
    }

    // Validaciones
    if (!formData.lot_number.trim()) {
      setError('El número de lote es requerido');
      return;
    }

    if (formData.quantity < 0) {
      setError('La cantidad no puede ser negativa');
      return;
    }

    try {
      await createLotForProduct({
        product_id: product.product_id,
        lot_number: formData.lot_number.trim(),
        expiry_date: formData.expiry_date || undefined,
        quantity: formData.quantity || 0,
      });
      
      setSuccess(true);
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating lot:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details || 
                          'Error al crear el lote';
      setError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Crear Lote para {product?.product_name}
          </h2>
          
          <div className="mb-4 text-sm text-gray-600">
            <p><strong>Código:</strong> {product?.product_code}</p>
            <p><strong>Fabricante:</strong> {product?.manufacturer_name || 'No especificado'}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              ✅ Lote creado exitosamente. Cerrando...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Lote *
                </label>
                <input
                  type="text"
                  name="lot_number"
                  value={formData.lot_number}
                  onChange={handleChange}
                  required
                  disabled={isCreatingLot || success}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ej: LOTE-001-2024"
                />
                <p className="text-xs text-gray-500 mt-1">Identificador único del lote</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  disabled={isCreatingLot || success}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Opcional - puede asignarse después</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Inicial *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  required
                  disabled={isCreatingLot || success}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Cantidad de unidades en stock</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreatingLot}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {success ? 'Cerrar' : 'Cancelar'}
              </button>
              
              {!success && (
                <button
                  type="submit"
                  disabled={isCreatingLot}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingLot ? 'Creando...' : 'Crear Lote'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}