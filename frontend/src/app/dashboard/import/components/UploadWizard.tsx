// frontend/src/app/dashboard/import/components/UploadWizard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useImport, ImportProgress } from '@/hooks/useImport';
import { useSuppliersBasic } from '@/hooks/useSuppliers';
import { useCountriesBasic } from '@/hooks/useCountries';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Trash2, FileText, Lock
} from 'lucide-react';
import { FileUploadZone } from '@/components/features/import/FileUploadZone';
import { ColumnMapper } from '@/components/features/import/ColumnMapper';
import { ImportResults } from '@/components/features/import/ImportResults';
import { ImportProgress as ImportProgressComponent } from '@/components/features/import/ImportProgress';

const CATEGORIES = [
  { id: 'regular', label: 'En Fecha', color: 'bg-green-100 text-green-700 border-green-200 ring-green-500' },
  { id: 'near_expiry', label: 'Fecha Corta', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 ring-yellow-500' },
  { id: 'expired', label: 'Caducados', color: 'bg-red-100 text-red-700 border-red-200 ring-red-500' }
];

export const UploadWizard = () => {
  const { user } = useAuth();
  const { suppliers } = useSuppliersBasic();
  const { data: countries } = useCountriesBasic();
  
  const { 
    createQuickSupplier, cleanCatalog, uploadFile, 
    getMappingTemplate, startProcessing, getActiveStatus // ✅ IMPORTANTE: Agregamos getActiveStatus
  } = useImport();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showCleanSuccessModal, setShowCleanSuccessModal] = useState(false);
  const [cleanDeletedCount, setCleanDeletedCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCountry, setNewSupplierCountry] = useState('');
  const [category, setCategory] = useState('regular');
  const [cleaned, setCleaned] = useState(false);
  
  const [uploadId, setUploadId] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any>({});
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  
  const [localSuppliers, setLocalSuppliers] = useState<any[]>([]);
  
  const isAdmin = user?.verification_level === 'admin';

  // ✅ EFECTO DE AUTO-RESTAURACIÓN (MEMORIA DE SESIÓN)
  useEffect(() => {
    const checkSession = async () => {
        // Solo verificamos si estamos en el paso 1 (para no interrumpir si el usuario ya está haciendo algo)
        if (step === 1) {
            const active = await getActiveStatus();
            if (active && active.id) {
                // Si encontramos una sesión (activa o terminada recientemente)
                setUploadId(active.id);
                
                // Si ya terminó, seteamos el progreso para mostrar resultados inmediatamente
                if (['completed', 'completed_with_errors', 'finished', 'failed'].includes(active.status)) {
                    setProgress(active);
                }
                
                // Saltamos directo al paso 4
                setStep(4);
            }
        }
    };
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Se ejecuta solo al montar el componente

  useEffect(() => {
     setCleaned(false);
  }, [category, supplierId]);
  
  const activeSuppliers = [...(suppliers || []).filter((s: any) => s.is_active !== false && s.is_active !== 'f'), ...localSuppliers];

  const selectedSupplierData = activeSuppliers.find((s:any) => s.id === supplierId);
  const selectedCategoryLabel = CATEGORIES.find(c => c.id === category)?.label;

  const handleCreateSupplier = async () => {
    if (!newSupplierName || !newSupplierCountry) return;
    try {
      const sup = await createQuickSupplier(newSupplierName, newSupplierCountry);
      setLocalSuppliers(prev => [...prev, sup]);
      setSupplierId(sup.id);
      setShowCreateModal(false);
      setNewSupplierName('');
      setNewSupplierCountry('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleClean = async () => {
    try {
      setLoading(true);
      const count = await cleanCatalog(supplierId, category);
      setCleanDeletedCount(count);
      setCleaned(true);
      setShowCleanModal(false);
      setShowCleanSuccessModal(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (uploadedFile: File) => {
    try {
      setLoading(true);
      setFile(uploadedFile);
      const res = await uploadFile(uploadedFile, supplierId, category);
      setUploadId(res.upload_id);
      setColumns(res.columns);
      setPreview(res.preview);
      const template = await getMappingTemplate(supplierId);
      setMappings(template || {});
      setStep(3);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcess = async (finalMappings: any) => {
    try {
      await startProcessing(uploadId, finalMappings, supplierId);
      setStep(4);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setUploadId('');
    setProgress(null);
    setCleaned(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-center mb-10">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mx-4 transition-all duration-300 ${
            step >= i ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400 border border-gray-200'
          }`}>
            {step > i ? <CheckCircle2 className="w-6 h-6"/> : i}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center"><Building className="mr-2 h-5 w-5 text-blue-600"/> Proveedor</span>
              
              {isAdmin && (
                <button onClick={() => setShowCreateModal(true)} className="text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded-full transition-colors">
                  + Nuevo Proveedor
                </button>
              )}
            </h3>
            
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-medium"
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
            >
              <option value="" className="text-gray-400">-- Selecciona un Proveedor --</option>
              {activeSuppliers.map((s: any) => {
                 const countryInfo = countries?.find((c: any) => c.code === s.country_code);
                 const details = countryInfo ? `${countryInfo.name} - ${countryInfo.currency_code} ${countryInfo.currency_symbol}` : s.country_code;
                 return <option key={s.id} value={s.id} className="text-gray-900 py-2">{s.name} ({details})</option>;
              })}
            </select>
          </div>

          {supplierId && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Categoría</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${category === cat.id ? `${cat.color} ring-2 ring-offset-1` : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>{cat.label}</button>
                ))}
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex flex-col"><span className="text-sm text-orange-900 font-bold">Limpieza de Inventario</span><span className="text-xs text-orange-700 mt-1">¿Borrar stock anterior de esta categoría?</span></div>
                
                {cleaned ? (
                  <span className="flex items-center text-green-700 font-bold text-sm bg-green-100 px-4 py-2 rounded-lg border border-green-200 shadow-sm"><CheckCircle2 className="w-4 h-4 mr-2"/> Listo</span>
                ) : (
                  isAdmin ? (
                    <button onClick={() => setShowCleanModal(true)} className="flex items-center bg-white border border-orange-300 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors shadow-sm"><Trash2 className="w-4 h-4 mr-2"/> Limpiar Ahora</button>
                  ) : (
                    <span className="flex items-center text-gray-400 text-xs bg-gray-100 px-3 py-1 rounded border border-gray-200">
                      <Lock className="w-3 h-3 mr-1"/> Solo Admin
                    </span>
                  )
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button disabled={!supplierId} onClick={() => setStep(2)} className="flex items-center bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Siguiente <ArrowRight className="ml-2 w-5 h-5"/></button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center space-x-3">
               <div className="bg-white p-2 rounded-full shadow-sm"><FileText className="w-5 h-5 text-blue-600" /></div>
               <div><div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Importando para</div><div className="text-gray-900 font-bold">{selectedSupplierData?.name}</div></div>
             </div>
             <div className="text-right"><div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Categoría</div><div className="text-gray-900 font-bold">{selectedCategoryLabel}</div></div>
          </div>
          <FileUploadZone onFileSelect={handleUpload} isUploading={loading} />
          {loading && <div className="text-center mt-6"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div><p className="text-blue-600 font-medium">Subiendo y analizando archivo...</p></div>}
          <div className="flex justify-start"><button onClick={() => setStep(1)} disabled={loading} className="flex items-center text-gray-500 hover:text-gray-700 font-medium px-4 py-2 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Volver</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <ColumnMapper previewData={preview} availableColumns={columns} currentMappings={mappings} onMappingsChange={setMappings} onComplete={handleStartProcess} />
            <div className="mt-4"><button onClick={() => setStep(2)} className="flex items-center text-gray-500 hover:text-gray-700 font-medium px-4 py-2 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Corregir Archivo</button></div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95">
           <ImportProgressComponent uploadId={uploadId} onComplete={(data) => setProgress(data)} />
           {progress && ['completed', 'completed_with_errors', 'finished', 'failed'].includes(progress.status) && (
             <ImportResults progressData={progress} onNewImport={handleReset} />
           )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl scale-100 animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Nuevo Proveedor</h3>
            <input className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre del Proveedor" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
            <select className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={newSupplierCountry} onChange={e => setNewSupplierCountry(e.target.value)}>
              <option value="">Seleccionar País</option>
              {countries?.map((c: any) => <option key={c.code} value={c.code}>{c.name} ({c.currency_code} {c.currency_symbol})</option>)}
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
              <button onClick={handleCreateSupplier} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">Crear</button>
            </div>
          </div>
        </div>
      )}

      {showCleanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl w-96 text-center shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-8 w-8 text-red-600"/></div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">¿Estás seguro?</h3>
            <p className="text-gray-600 mb-6">Eliminarás <span className="font-bold">todo el stock</span> de esta categoría para este proveedor. Esta acción es irreversible.</p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setShowCleanModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleClean} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200">{loading ? 'Borrando...' : 'Sí, Borrar Todo'}</button>
            </div>
          </div>
        </div>
      )}

      {showCleanSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl w-80 text-center shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="h-8 w-8 text-green-600"/></div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">¡Limpieza Exitosa!</h3>
            <p className="text-gray-600 mb-6 font-medium">Se eliminaron <span className="text-gray-900 font-bold">{cleanDeletedCount}</span> registros antiguos.</p>
            <button onClick={() => setShowCleanSuccessModal(false)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};