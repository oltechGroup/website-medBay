'use client';

import { useState } from 'react';
import { useImport } from '@/hooks/useImport';
import { Supplier } from '@/hooks/useSuppliers';
import { FileUploadZone } from '@/components/features/import/FileUploadZone';
import { ColumnMapper } from '@/components/features/import/ColumnMapper';
import { ImportProgress } from '@/components/features/import/ImportProgress';
import { ImportResults } from '@/components/features/import/ImportResults';
import { 
  Building, 
  Package, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Upload,
  Map,
  FileCheck,
  Sparkles,
  Currency,
  Image
} from 'lucide-react';

interface UploadWizardProps {
  session: any;
  setSession: (session: any) => void;
  suppliers: Supplier[];
  suppliersLoading: boolean;
}

// Opciones de moneda (basadas en la tabla countries)
const currencyOptions = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
];

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
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [imageColumn, setImageColumn] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [mappings, setMappings] = useState<any>(null);
  const [newlyCreatedSuppliers, setNewlyCreatedSuppliers] = useState<Supplier[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [importProgress, setImportProgress] = useState<any>(null);

  const {
    uploadFile,
    cleanCatalog,
    processImport,
    getPreview,
    getMappingTemplate,
    saveMappingTemplate,
    createSupplier,
    pollImportProgress,
    isUploading,
    isCleaning,
    isProcessing,
    isCreatingSupplier,
  } = useImport();

  // Combinar proveedores existentes con nuevos creados
  const allSuppliers = [...suppliers, ...newlyCreatedSuppliers];

  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setNewSupplierName('');
    setSession({ ...session, supplier_id: supplierId });
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    
    try {
      const newSupplier = await createSupplier({
        name: newSupplierName.trim(),
        country_id: undefined,
        currency_id: undefined,
        contact_info: undefined
      });
      
      setNewlyCreatedSuppliers(prev => [...prev, newSupplier]);
      setSelectedSupplierId(newSupplier.id);
      setSession({ 
        ...session, 
        supplier_id: newSupplier.id, 
        supplier_name: newSupplier.name 
      });
      setNewSupplierName('');
    } catch (error) {
      console.error('❌ Error creando proveedor:', error);
      // CORRECCIÓN 1: Manejo seguro de errores
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el proveedor';
      alert(`Error al crear el proveedor: ${errorMessage}`);
    }
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
      // CORRECCIÓN 2: Manejo seguro de errores
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al limpiar el catálogo';
      alert(`Error al limpiar el catálogo: ${errorMessage}`);
    }
  };

  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedSupplierId) return;
    
    setFile(selectedFile);
    try {
      const result = await uploadFile({
        supplier_id: selectedSupplierId,
        sales_category: salesCategory,
        file: selectedFile,
        currency_code: currencyCode,
        image_column: imageColumn || undefined
      });
      
      setUploadId(result.upload_id);
      setTotalRows(result.total_rows);
      
      const preview = await getPreview(result.upload_id);
      setPreviewData(preview);
      
      const template = await getMappingTemplate(selectedSupplierId);
      setMappings(template.template.mappings);
      
      setStep(3);
    } catch (error) {
      console.error('Error en upload:', error);
      // CORRECCIÓN 3: Manejo seguro de errores
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir el archivo';
      alert(`Error al subir el archivo: ${errorMessage}`);
    }
  };

  const handleMappingComplete = async (finalMappings: any) => {
    if (!uploadId || !selectedSupplierId) return;
    
    try {
      await saveMappingTemplate({
        supplier_id: selectedSupplierId,
        mappings: finalMappings
      });
      
      const supplier = allSuppliers.find(s => s.id === selectedSupplierId);
      
      // Iniciar procesamiento
      await processImport({
        upload_id: uploadId,
        mappings: finalMappings,
        supplier_id: selectedSupplierId,
        sales_category: salesCategory,
        supplier_name: supplier?.name || 'Proveedor'
      });
      
      // Iniciar monitoreo de progreso en tiempo real
      setSession({ 
        ...session, 
        status: 'processing'
      });
      setStep(4);
      
      // Iniciar polling para progreso
      pollImportProgress(uploadId, (progress) => {
        setImportProgress(progress);
        
        // Si la importación terminó, actualizar estado
        if (progress && ['completed', 'completed_with_errors', 'error'].includes(progress.status)) {
          setSession({ 
            ...session, 
            status: 'complete',
            results: {
              total_rows: progress.total_rows,
              successful_lots: progress.processed_rows,
              errors_count: progress.error_messages?.length || 0
            }
          });
        }
      });
      
    } catch (error) {
      console.error('Error en procesamiento:', error);
      // CORRECCIÓN 4: Manejo seguro de errores
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar la importación';
      setSession({ 
        ...session, 
        status: 'error',
        error: errorMessage 
      });
    }
  };

  const handleNewImport = () => {
    setStep(1);
    setSelectedSupplierId('');
    setNewSupplierName('');
    setSalesCategory('regular');
    setCurrencyCode('USD');
    setImageColumn('');
    setFile(null);
    setUploadId('');
    setPreviewData(null);
    setMappings(null);
    setTotalRows(0);
    setNewlyCreatedSuppliers([]);
    setImportProgress(null);
    setSession({
      id: '1',
      status: 'selecting',
      sales_category: 'regular',
    });
  };

  // Configuración de pasos para el indicador
  const steps = [
    { number: 1, title: 'Configuración', icon: Building, status: step >= 1 ? 'completed' : 'current' },
    { number: 2, title: 'Subir Archivo', icon: Upload, status: step >= 2 ? 'completed' : step === 2 ? 'current' : 'upcoming' },
    { number: 3, title: 'Mapear Columnas', icon: Map, status: step >= 3 ? 'completed' : step === 3 ? 'current' : 'upcoming' },
    { number: 4, title: 'Progreso', icon: FileCheck, status: step >= 4 ? 'completed' : step === 4 ? 'current' : 'upcoming' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
      {/* Indicador de Pasos Mejorado */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {steps.map((stepItem, index) => (
            <div key={stepItem.number} className="flex items-center flex-1">
              {/* Paso Individual */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  step > stepItem.number
                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                    : step === stepItem.number
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step > stepItem.number ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <stepItem.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`mt-3 text-sm font-medium transition-colors ${
                  step >= stepItem.number ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {stepItem.title}
                </span>
              </div>

              {/* Línea Conectora */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                  step > stepItem.number ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Paso 1: Configuración */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Configurar Importación</h3>
            <p className="text-gray-600 mt-2 text-lg">
              Selecciona el proveedor, categoría y configuración de moneda
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panel Izquierdo: Proveedor y Moneda */}
            <div className="space-y-6">
              {/* Proveedores Existentes */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span>Proveedores Existentes</span>
                </h4>
                
                <select
                  value={selectedSupplierId}
                  onChange={(e) => handleSupplierSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={suppliersLoading}
                >
                  <option value="">Selecciona un proveedor...</option>
                  {allSuppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} 
                      {supplier.country_name && ` - ${supplier.country_name}`}
                      {newlyCreatedSuppliers.some(s => s.id === supplier.id) && ' (Nuevo)'}
                    </option>
                  ))}
                </select>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Proveedor seleccionado:</span>
                  </div>
                  <p className="text-blue-900 font-semibold mt-1">
                    {selectedSupplierId 
                      ? allSuppliers.find(s => s.id === selectedSupplierId)?.name 
                      : 'Ninguno seleccionado'
                    }
                  </p>
                </div>
              </div>

              {/* Selector de Moneda */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Currency className="h-5 w-5 text-purple-600" />
                  <span>Moneda del Archivo</span>
                </h4>
                
                <div className="space-y-3">
                  {currencyOptions.map(currency => (
                    <label key={currency.code} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="currency"
                        value={currency.code}
                        checked={currencyCode === currency.code}
                        onChange={(e) => setCurrencyCode(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{currency.name}</div>
                        <div className="text-sm text-gray-600">{currency.symbol} • {currency.code}</div>
                      </div>
                      {currencyCode === currency.code && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </label>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700">
                    <strong>Nota:</strong> Los precios se convertirán automáticamente a USD usando las tasas de cambio actuales.
                  </p>
                </div>
              </div>

              {/* Crear Nuevo Proveedor */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Building className="h-5 w-5 text-green-600" />
                  <span>Crear Nuevo Proveedor</span>
                </h4>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="Ingresa el nombre del nuevo proveedor"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={isCreatingSupplier}
                  />
                  
                  <button
                    onClick={handleCreateSupplier}
                    disabled={!newSupplierName.trim() || isCreatingSupplier}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isCreatingSupplier ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Creando Proveedor...
                      </>
                    ) : (
                      <>
                        <Building className="h-5 w-5 mr-2" />
                        Crear Proveedor
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Derecho: Categoría y Configuración Avanzada */}
            <div className="space-y-6">
              {/* Categoría de Caducidad */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>Categoría de Caducidad</span>
                </h4>

                <div className="space-y-4">
                  {[
                    { 
                      value: 'regular', 
                      label: 'En Fecha', 
                      description: 'Productos con fecha vigente',
                      icon: '🟢',
                      color: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700',
                      activeColor: 'ring-2 ring-green-500 ring-offset-2 bg-green-100 border-green-300'
                    },
                    { 
                      value: 'near_expiry', 
                      label: 'Fecha Cerca', 
                      description: 'Próximos a caducar',
                      icon: '🟡',
                      color: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
                      activeColor: 'ring-2 ring-yellow-500 ring-offset-2 bg-yellow-100 border-yellow-300'
                    },
                    { 
                      value: 'expired', 
                      label: 'Caducados', 
                      description: 'Productos vencidos',
                      icon: '🔴',
                      color: 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700',
                      activeColor: 'ring-2 ring-red-500 ring-offset-2 bg-red-100 border-red-300'
                    }
                  ].map(category => (
                    <button
                      key={category.value}
                      onClick={() => setSalesCategory(category.value as any)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${category.color} ${
                        salesCategory === category.value ? category.activeColor : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{category.label}</div>
                          <div className="text-sm opacity-80">{category.description}</div>
                        </div>
                        {salesCategory === category.value && (
                          <CheckCircle2 className="h-6 w-6 text-current" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuración de Imágenes (Opcional) */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Image className="h-5 w-5 text-indigo-600" />
                  <span>Imágenes (Opcional)</span>
                </h4>
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    Si tu archivo incluye una columna con URLs de imágenes, especifica su nombre:
                  </p>
                  
                  <input
                    type="text"
                    value={imageColumn}
                    onChange={(e) => setImageColumn(e.target.value)}
                    placeholder="Ej: imagen_url, image, foto"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-700">
                      <strong>Tip:</strong> Las imágenes se procesarán de forma opcional y no detendrán la importación si hay errores.
                    </p>
                  </div>
                </div>
              </div>

              {/* Panel de Limpieza */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 text-lg">Limpieza Requerida</h4>
                    <p className="text-amber-700 mt-2">
                      Antes de subir un nuevo catálogo, debes limpiar el existente para evitar duplicados y mantener la integridad del inventario.
                    </p>
                    
                    <button
                      onClick={handleCleanCatalog}
                      disabled={!selectedSupplierId || isCleaning}
                      className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isCleaning ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Limpiando Catálogo...
                        </>
                      ) : (
                        <>
                          <Package className="h-5 w-5 mr-2" />
                          Limpiar Catálogo Anterior
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paso 2: Subir archivo */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Subir Archivo Excel</h3>
            <p className="text-gray-600 mt-2 text-lg">
              Carga el archivo Excel con el catálogo del proveedor
            </p>
          </div>

          <FileUploadZone 
            onFileSelect={handleFileUpload}
            isUploading={isUploading}
            acceptedFormats=".xlsx, .xls, .csv"
          />

          {/* Información del Contexto Actual */}
          {selectedSupplierId && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Configuración Actual</h4>
                    <p className="text-blue-700">
                      <span className="font-medium">{allSuppliers.find(s => s.id === selectedSupplierId)?.name}</span> • {
                        salesCategory === 'regular' ? '🟢 En Fecha' :
                        salesCategory === 'near_expiry' ? '🟡 Fecha Cerca' : '🔴 Caducados'
                      } • 💰 {currencyOptions.find(c => c.code === currencyCode)?.name}
                      {imageColumn && ` • 🖼️ Columna: ${imageColumn}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors font-medium"
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
        <div className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Map className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Mapear Columnas</h3>
            <p className="text-gray-600 mt-2 text-lg">
              Asigna las columnas de tu Excel a los campos del sistema
            </p>
          </div>

          {/* CORRECCIÓN 5: Quitar propiedades no soportadas por ahora */}
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
        <div className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileCheck className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {session.status === 'processing' ? 'Procesando Importación' : 'Resultados de la Importación'}
            </h3>
            <p className="text-gray-600 mt-2 text-lg">
              {session.status === 'processing' 
                ? 'Tu importación está siendo procesada...' 
                : 'Importación completada'
              }
            </p>
          </div>

          {session.status === 'processing' && (
            // CORRECCIÓN 6: Usar ImportProgress sin propiedades adicionales por ahora
            <ImportProgress />
          )}
          
          {session.status === 'complete' && session.results && (
            // CORRECCIÓN 7: Usar ImportResults sin propiedades adicionales por ahora
            <ImportResults 
              results={session.results} 
              onNewImport={handleNewImport}
            />
          )}
        </div>
      )}

      {/* Navegación entre pasos */}
      {step > 1 && step < 4 && (
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              ← Anterior
            </button>
            
            {step === 2 && file && (
              <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Archivo listo: {file.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};