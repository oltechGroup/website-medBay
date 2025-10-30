'use client';

import { useState } from 'react';
import { useImport } from '@/hooks/useImport';
import { Supplier } from '@/hooks/useSuppliers';
import { FileUploadZone } from '@/components/features/import/FileUploadZone';
import { ColumnMapper } from '@/components/features/import/ColumnMapper';
import { ImportProgress } from '@/components/features/import/ImportProgress';
import { ImportResults } from '@/components/features/import/ImportResults';

interface UploadWizardProps {
  session: any;
  setSession: (session: any) => void;
  suppliers: Supplier[];
  suppliersLoading: boolean;
}

export const UploadWizard: React.FC<UploadWizardProps> = ({
  session,
  setSession,
  suppliers,
  suppliersLoading,
}) => {
  const [step, setStep] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [salesCategory, setSalesCategory] = useState<'regular' | 'near_expiry' | 'expired'>('regular');
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [mappings, setMappings] = useState<any>(null);
  const [tempSuppliers, setTempSuppliers] = useState<Supplier[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);

  const {
    uploadFile,
    cleanCatalog,
    processImport,
    getPreview,
    getMappingTemplate,
    saveMappingTemplate,
    isUploading,
    isCleaning,
    isProcessing,
  } = useImport();

  // Combinar proveedores existentes con temporales
  const allSuppliers = [...suppliers, ...tempSuppliers];

  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setNewSupplierName(''); // Limpiar nuevo proveedor si se selecciona existente
    setSession({ ...session, supplier_id: supplierId });
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    
    // Crear proveedor temporal
    const newSupplier: Supplier = {
      id: `temp-${Date.now()}`,
      name: newSupplierName,
      created_at: new Date().toISOString(),
    };
    
    setTempSuppliers(prev => [...prev, newSupplier]);
    setSelectedSupplierId(newSupplier.id);
    setSession({ 
      ...session, 
      supplier_id: newSupplier.id, 
      supplier_name: newSupplier.name 
    });
    setNewSupplierName('');
  };

  const handleCleanCatalog = async () => {
    if (!selectedSupplierId) return;
    
    try {
      await cleanCatalog({
        supplier_id: selectedSupplierId,
        sales_category: salesCategory
      });
      setStep(2);
    } catch (error) {
      console.error('Error en limpieza:', error);
    }
  };

  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedSupplierId) return;
    
    setFile(selectedFile);
    try {
      const result = await uploadFile({
        supplier_id: selectedSupplierId,
        sales_category: salesCategory,
        file: selectedFile
      });
      
      setUploadId(result.upload_id);
      setTotalRows(result.total_rows); // ✅ Guardar total de filas
      
      // Obtener preview para mapeo
      const preview = await getPreview(result.upload_id);
      setPreviewData(preview);
      
      // Obtener template de mapeo
      const template = await getMappingTemplate(selectedSupplierId);
      setMappings(template.template.mappings);
      
      setStep(3);
    } catch (error) {
      console.error('Error en upload:', error);
    }
  };

  const handleMappingComplete = async (finalMappings: any) => {
    if (!uploadId || !selectedSupplierId) return;
    
    try {
      // Guardar template de mapeo
      await saveMappingTemplate({
        supplier_id: selectedSupplierId,
        mappings: finalMappings
      });
      
      // Procesar importación
      const supplier = allSuppliers.find(s => s.id === selectedSupplierId);
      const result = await processImport({
        upload_id: uploadId,
        mappings: finalMappings,
        supplier_id: selectedSupplierId,
        sales_category: salesCategory,
        supplier_name: supplier?.name || 'Proveedor'
      });
      
      setSession({ 
        ...session, 
        status: 'complete',
        results: result 
      });
      setStep(4);
    } catch (error) {
      console.error('Error en procesamiento:', error);
    }
  };

  const handleNewImport = () => {
    // Resetear todo el estado para nueva importación
    setStep(1);
    setSelectedSupplierId('');
    setNewSupplierName('');
    setSalesCategory('regular');
    setFile(null);
    setUploadId('');
    setPreviewData(null);
    setMappings(null);
    setTotalRows(0);
    setSession({
      id: '1',
      status: 'selecting',
      sales_category: 'regular',
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
      {/* Indicador de Pasos */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= stepNumber
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Paso 1: Selección de proveedor y categoría */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">🏢 Seleccionar Proveedor y Categoría</h3>
            <p className="text-gray-600 mt-1">Elige el proveedor y tipo de catálogo a importar</p>
          </div>

          {/* Proveedores existentes */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Proveedor Existente
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => handleSupplierSelect(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={suppliersLoading}
            >
              <option value="">Selecciona un proveedor existente...</option>
              {allSuppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} 
                  {supplier.country_name && ` - ${supplier.country_name}`}
                  {supplier.id.startsWith('temp-') && ' (Nuevo)'}
                </option>
              ))}
            </select>
          </div>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O</span>
            </div>
          </div>

          {/* Crear nuevo proveedor */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Crear Nuevo Proveedor (Rápido)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Ingresa el nombre del nuevo proveedor"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleCreateSupplier}
                disabled={!newSupplierName.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Crear
              </button>
            </div>
          </div>

          {/* Selección de categoría */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Categoría de Caducidad
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { 
                  value: 'regular', 
                  label: '🟢 En Fecha', 
                  description: 'Productos con fecha vigente',
                  color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                },
                { 
                  value: 'near_expiry', 
                  label: '🟡 Fecha Cerca', 
                  description: 'Próximos a caducar',
                  color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' 
                },
                { 
                  value: 'expired', 
                  label: '🔴 Caducados', 
                  description: 'Productos vencidos',
                  color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                }
              ].map(category => (
                <button
                  key={category.value}
                  onClick={() => setSalesCategory(category.value as any)}
                  className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                    salesCategory === category.value 
                      ? `${category.color} ring-2 ring-offset-2 ring-blue-500` 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold text-lg mb-1">{category.label}</div>
                  <div className="text-sm opacity-80">{category.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Botón Limpiar */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-amber-900">⚠️ Limpieza Requerida</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Antes de subir un nuevo catálogo, debes limpiar el existente para evitar duplicados.
                </p>
              </div>
              <button
                onClick={handleCleanCatalog}
                disabled={!selectedSupplierId || isCleaning}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isCleaning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Limpiando...
                  </>
                ) : (
                  '🧹 Limpiar Catálogo Anterior'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paso 2: Subir archivo */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">📤 Subir Archivo Excel</h3>
            <p className="text-gray-600 mt-1">Sube el archivo Excel con el catálogo del proveedor</p>
          </div>

          <FileUploadZone 
            onFileSelect={handleFileUpload}
            isUploading={isUploading}
            acceptedFormats=".xlsx, .xls, .csv"
          />

          {/* Información del proveedor seleccionado */}
          {selectedSupplierId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Proveedor Seleccionado</h4>
                  <p className="text-sm text-blue-700">
                    {allSuppliers.find(s => s.id === selectedSupplierId)?.name} • {
                      salesCategory === 'regular' ? '🟢 En Fecha' :
                      salesCategory === 'near_expiry' ? '🟡 Fecha Cerca' : '🔴 Caducados'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paso 3: Mapeo de columnas */}
      {step === 3 && previewData && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">🗺️ Mapear Columnas</h3>
            <p className="text-gray-600 mt-1">
              Asigna las columnas de tu Excel a los campos del sistema
            </p>
          </div>

          <ColumnMapper
            previewData={previewData.preview}
            availableColumns={previewData.available_columns}
            currentMappings={mappings}
            onMappingsChange={setMappings}
            onComplete={handleMappingComplete}
            isProcessing={isProcessing}
            totalRows={totalRows}
          />
        </div>
      )}

      {/* Paso 4: Progreso y resultados */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">📊 Resultados de la Importación</h3>
            <p className="text-gray-600 mt-1">
              {session.status === 'processing' ? 'Procesando tu importación...' : 'Importación completada'}
            </p>
          </div>

          {session.status === 'processing' && (
            <ImportProgress />
          )}
          
          {session.status === 'complete' && session.results && (
            <ImportResults 
              results={session.results} 
              onNewImport={handleNewImport}
            />
          )}
        </div>
      )}

      {/* Navegación entre pasos */}
      {step > 1 && step < 4 && (
        <div className="border-t pt-6">
          <div className="flex justify-between">
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              ← Anterior
            </button>
            
            {step === 2 && file && (
              <div className="text-sm text-gray-600 flex items-center">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  ✅ Archivo listo: {file.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};