// frontend/src/app/dashboard/import/components/UploadWizard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useImport, ImportProgress } from '@/hooks/useImport';
import { useSuppliersBasic } from '@/hooks/useSuppliers';
import { useCountriesBasic } from '@/hooks/useCountries';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Trash2, 
  FileText, Lock, FileSpreadsheet, Keyboard, Link as LinkIcon, ImageIcon, 
  Save, RefreshCw, ChevronDown, Database, DollarSign 
} from 'lucide-react';
import { FileUploadZone } from '@/components/features/import/FileUploadZone';
import { ColumnMapper } from '@/components/features/import/ColumnMapper';
import { ImportResults } from '@/components/features/import/ImportResults';
import { ImportProgress as ImportProgressComponent } from '@/components/features/import/ImportProgress';

const CATEGORIES = [
  { id: 'regular', label: 'In Date', color: 'bg-green-100 text-green-700 border-green-200 ring-green-500' },
  { id: 'near_expiry', label: 'Short-Dated', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 ring-yellow-500' },
  { id: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200 ring-red-500' }
];

export const UploadWizard = () => {
  const { user } = useAuth();
  const { suppliers } = useSuppliersBasic();
  const { data: countries } = useCountriesBasic();
  
  const { 
    createQuickSupplier, cleanCatalog, uploadFile, 
    getMappingTemplate, startProcessing, getActiveStatus, submitManualImport
  } = useImport();

  const isAdmin = user?.verification_level === 'admin';
  const isSupplier = user?.verification_level === 'supplier';
  const canCleanCatalog = isAdmin || isSupplier;

  // 1. Estados de Navegación
  const [step, setStep] = useState(1);
  const [importMethod, setImportMethod] = useState<'excel' | 'manual' | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  // 2. Estados de Datos
  const [supplierId, setSupplierId] = useState(isSupplier && user?.supplier_id ? user.supplier_id : '');
  const [category, setCategory] = useState('regular');
  const [uploadId, setUploadId] = useState('');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  
  // 3. Estados de Formulario Manual
  const [manualData, setManualData] = useState({
    description: '',
    sku: '',
    manufacturer: '',
    quantity: 0,
    price: 0,
    expiry_date: '',
    imageUrl: ''
  });
  const [manualImageFile, setManualImageFile] = useState<File | null>(null);
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');

  // 4. Modales y Auxiliares
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showCleanSuccessModal, setShowCleanSuccessModal] = useState(false);
  const [cleanDeletedCount, setCleanDeletedCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCountry, setNewSupplierCountry] = useState('');
  const [localSuppliers, setLocalSuppliers] = useState<any[]>([]);
  const [cleaned, setCleaned] = useState(false);
  
  // Excel Data
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any>({});

  const isFinished = progress && ['completed', 'completed_with_errors', 'finished', 'failed', 'error'].includes(progress.status);

  // AUTO-RESTORATION
  useEffect(() => {
    const checkSession = async () => {
      try {
        const active = await getActiveStatus();
        if (active && active.id) {
          setUploadId(active.id);
          if (['completed', 'completed_with_errors', 'finished', 'failed', 'error'].includes(active.status)) {
            setProgress(active);
          }
          setStep(4);
        }
      } finally {
        setRestoringSession(false);
      }
    };
    checkSession();
  }, [getActiveStatus]);

  // Si el usuario entra y el contexto carga después, nos aseguramos de setear su supplierId
  useEffect(() => {
    if (isSupplier && user?.supplier_id && !supplierId) {
      setSupplierId(user.supplier_id);
    }
  }, [isSupplier, user, supplierId]);

  // ✅ NUEVO: Escuchar cambios de categoría o proveedor para reiniciar el estado 'cleaned'
  useEffect(() => {
    setCleaned(false);
  }, [category, supplierId]);

  const activeSuppliers = [...(suppliers || []).filter((s: any) => s.is_active !== false && s.is_active !== 'f'), ...localSuppliers];
  
  // Buscar datos del proveedor actual
  const selectedSupplierData = isSupplier 
    ? { name: user?.company_name || user?.full_name } 
    : activeSuppliers.find((s:any) => s.id === supplierId);

  // --- HANDLERS ---

  const handleCreateSupplier = async () => {
    if (!newSupplierName || !newSupplierCountry) return;
    try {
      const sup = await createQuickSupplier(newSupplierName, newSupplierCountry);
      setLocalSuppliers(prev => [...prev, sup]);
      setSupplierId(sup.id);
      setShowCreateModal(false);
    } catch (e: any) { alert(e.message); }
  };

  const handleClean = async () => {
    try {
      setLoading(true);
      const count = await cleanCatalog(supplierId, category);
      setCleanDeletedCount(count);
      setCleaned(true);
      setShowCleanModal(false);
      setShowCleanSuccessModal(true);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleUploadExcel = async (uploadedFile: File) => {
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
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.description) return;
    try {
      setLoading(true);
      const res = await submitManualImport({
        supplier_id: supplierId,
        sales_category: category,
        ...manualData,
        imageFile: imageMode === 'file' ? manualImageFile : null,
        imageUrl: imageMode === 'url' ? manualData.imageUrl : ''
      });
      setUploadId(res.upload_id);
      setStep(4);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleStartExcelProcess = async (finalMappings: any) => {
    try {
      await startProcessing(uploadId, finalMappings, supplierId);
      setStep(4);
    } catch (e: any) { alert(e.message); }
  };

  const handleReset = () => {
    setStep(1);
    setImportMethod(null);
    setFile(null);
    setUploadId('');
    setProgress(null);
    setManualData({ description: '', sku: '', manufacturer: '', quantity: 0, price: 0, expiry_date: '', imageUrl: '' });
  };

  if (restoringSession) {
    return (
      <div className="p-20 text-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verifying session pulse...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* 📟 STEP INDICATOR */}
      <div className="flex justify-center mb-12">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500 border-2 ${
              step >= i ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-110' : 'bg-white border-slate-100 text-slate-300'
            }`}>
              {step > i ? <CheckCircle2 className="w-5 h-5 stroke-[3]"/> : i}
            </div>
            {i < 4 && <div className={`w-12 h-0.5 mx-2 rounded-full ${step > i ? 'bg-slate-900' : 'bg-slate-100'}`}></div>}
          </div>
        ))}
      </div>

      {/* STEP 1: SUPPLIER & CATEGORY */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                <Building className="h-4 w-4"/> Source Definition
              </h3>
              {isAdmin && (
                <button onClick={() => setShowCreateModal(true)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all">
                  + New Provider
                </button>
              )}
            </div>
            
            <div className="relative group">
              {isSupplier ? (
                <div className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 shadow-inner flex items-center">
                   <Database className="absolute left-4 h-5 w-5 text-blue-500" />
                   <span className="uppercase">{selectedSupplierData?.name || 'Loading your profile...'}</span>
                   <Lock className="absolute right-4 h-4 w-4 text-slate-400" />
                </div>
              ) : (
                <>
                  <select 
                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 appearance-none shadow-inner"
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                  >
                    <option value="">Select a supply partner...</option>
                    {activeSuppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </>
              )}
            </div>

            {supplierId && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="h-px bg-slate-100 w-full"></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Inventory Tier</h3>
                <div className="grid grid-cols-3 gap-4">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setCategory(cat.id)} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${category === cat.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="bg-orange-50 border-2 border-orange-100 rounded-[1.5rem] p-5 flex items-center justify-between group">
                  <div>
                    <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest block">Security Cleanup</span>
                    <span className="text-xs font-bold text-orange-600/80">Wipe previous stock for this tier?</span>
                  </div>
                  {cleaned ? (
                    <span className="flex items-center text-green-700 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-green-200 shadow-sm"><CheckCircle2 className="w-3 h-3 mr-2"/> Purged</span>
                  ) : (
                    canCleanCatalog ? (
                      <button onClick={() => setShowCleanModal(true)} className="flex items-center bg-white border border-orange-200 text-orange-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm active:scale-95"><Trash2 className="w-3 h-3 mr-2"/> Execute</button>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"><Lock className="w-3 h-3 inline mr-1"/> Restricted</span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button disabled={!supplierId} onClick={() => setStep(2)} className="inline-flex items-center bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30">
              Continue <ArrowRight className="ml-3 w-4 h-4 stroke-[3]"/>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: METHOD SELECTION */}
      {step === 2 && !importMethod && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
           <button onClick={() => { setImportMethod('excel'); setStep(2); }} className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] text-center hover:border-blue-500 hover:shadow-2xl transition-all group">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
                <FileSpreadsheet className="h-10 w-10 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Massive Sync</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed px-4">Upload bulk data from .XLSX or .CSV files. Ideal for large catalogs.</p>
           </button>

           <button onClick={() => setImportMethod('manual')} className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] text-center hover:border-purple-500 hover:shadow-2xl transition-all group">
              <div className="w-20 h-20 bg-purple-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-600 transition-colors">
                <Keyboard className="h-10 w-10 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Manual Entry</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed px-4">Create a single inventory item via form. Fast, precise, and direct.</p>
           </button>
           
           <div className="col-span-full flex justify-center">
              <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Back to Tier</button>
           </div>
        </div>
      )}

      {/* STEP 3: EXECUTION (EXCEL BRANCH) */}
      {step === 2 && importMethod === 'excel' && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
           <div className="bg-blue-900 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md"><FileSpreadsheet className="h-6 w-6"/></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">Bulk Mode</p>
                  <p className="text-sm font-black uppercase">{selectedSupplierData?.name}</p>
                </div>
              </div>
              <button onClick={() => setImportMethod(null)} className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">Change Method</button>
           </div>
           <FileUploadZone onFileSelect={handleUploadExcel} isUploading={loading} />
           <div className="flex justify-center"><button onClick={() => setImportMethod(null)} className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 hover:text-slate-900"><ArrowLeft className="w-4 h-4"/> Return to Selection</button></div>
        </div>
      )}

      {/* STEP 3: EXECUTION (MANUAL BRANCH) */}
      {step === 2 && importMethod === 'manual' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="bg-purple-900 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md"><Keyboard className="h-6 w-6"/></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-300">Manual Asset Registration</p>
                  <p className="text-sm font-black uppercase">{selectedSupplierData?.name}</p>
                </div>
              </div>
              <button onClick={() => setImportMethod(null)} className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">Change Method</button>
           </div>

          <form onSubmit={handleManualSubmit} className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Asset Description *</label>
                  <textarea required className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-900 text-sm shadow-inner min-h-[120px]" value={manualData.description} onChange={e => setManualData({...manualData, description: e.target.value})} placeholder="Main product name and specs..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Internal SKU</label>
                      <input className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm" value={manualData.sku} onChange={e => setManualData({...manualData, sku: e.target.value})} placeholder="Auto-gen if empty" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Manufacturer</label>
                      <input className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm" value={manualData.manufacturer} onChange={e => setManualData({...manualData, manufacturer: e.target.value})} placeholder="Brand / Lab" />
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Quantity</label>
                    <input type="number" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm" value={manualData.quantity} onChange={e => setManualData({...manualData, quantity: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Price (Source)</label>
                    <div className="relative">
                      <input type="number" step="0.01" className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm" value={manualData.price} onChange={e => setManualData({...manualData, price: parseFloat(e.target.value)})} />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Expiration Date</label>
                   <input type="date" className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm" value={manualData.expiry_date} onChange={e => setManualData({...manualData, expiry_date: e.target.value})} />
                </div>
                
                {/* SMART IMAGE SELECTOR */}
                <div className="space-y-3">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset Image</label>
                   <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                      <button type="button" onClick={() => setImageMode('url')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LinkIcon className="h-3 w-3 inline mr-1.5"/> URL</button>
                      <button type="button" onClick={() => setImageMode('file')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${imageMode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ImageIcon className="h-3 w-3 inline mr-1.5"/> File</button>
                   </div>
                   {imageMode === 'url' ? (
                     <input className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-xs shadow-inner" value={manualData.imageUrl} onChange={e => setManualData({...manualData, imageUrl: e.target.value})} placeholder="https://..." />
                   ) : (
                     <input type="file" accept="image/*" onChange={e => setManualImageFile(e.target.files?.[0] || null)} className="w-full text-xs font-bold text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer" />
                   )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t-2 border-slate-50">
              <button type="button" onClick={() => setImportMethod(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors px-6">Discard</button>
              <button type="submit" disabled={loading} className="inline-flex items-center px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-3"/> : <Save className="h-4 w-4 mr-3 stroke-[3]"/>}
                Commit Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3 (Excel Mapping) */}
      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <ColumnMapper previewData={preview} availableColumns={columns} currentMappings={mappings} onMappingsChange={setMappings} onComplete={handleStartExcelProcess} />
          <div className="mt-8 flex justify-center"><button onClick={() => setStep(2)} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft className="w-4 h-4 mr-2"/> Return to File Upload</button></div>
        </div>
      )}

      {/* STEP 4: PROCESSING & RESULTS (UNIVERSAL) */}
      {step === 4 && (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
          {!isFinished ? (
            <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm text-center">
              <ImportProgressComponent uploadId={uploadId} onComplete={(data) => setProgress(data)} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-2xl shadow-xl"><FileText className="h-5 w-5 text-white"/></div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Final Transaction Log</h2>
                </div>
                <button onClick={handleReset} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">Start New Session</button>
              </div>
              <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
                 <ImportResults progressData={progress!} onNewImport={handleReset} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] w-[450px] shadow-2xl scale-100 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6">Nexus Supplier</h3>
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Entity Name</label>
                  <input className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900" placeholder="e.g. MEDLINE" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Jurisdiction</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none" value={newSupplierCountry} onChange={e => setNewSupplierCountry(e.target.value)}>
                    <option value="">Select Region...</option>
                    {countries?.map((c: any) => <option key={c.code} value={c.code}>{c.name.toUpperCase()}</option>)}
                  </select>
               </div>
            </div>
            <div className="flex justify-end gap-4 mt-10">
              <button onClick={() => setShowCreateModal(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Abort</button>
              <button onClick={handleCreateSupplier} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95">Confirm nexus</button>
            </div>
          </div>
        </div>
      )}

      {showCleanModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[3rem] w-[450px] text-center shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="bg-red-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-red-100"><AlertTriangle className="h-12 w-12 text-red-600 stroke-[2.5]"/></div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Critical Action</h3>
            <p className="text-sm font-bold text-slate-500 leading-relaxed mb-10 px-4">This will permanently destroy <span className="text-red-600 font-black tracking-widest">ALL STOCK RECORDS</span> for this category. Are you sure?</p>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={handleClean} className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95">{loading ? 'Wiping Assets...' : 'Yes, purge tier'}</button>
              <button onClick={() => setShowCleanModal(false)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">Cancel purge</button>
            </div>
          </div>
        </div>
      )}

      {showCleanSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[3rem] w-[400px] text-center shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="bg-green-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-green-100"><Trash2 className="h-12 w-12 text-green-600 stroke-[2.5]"/></div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Tier Purged</h3>
            <p className="text-sm font-bold text-slate-500 leading-relaxed mb-10 px-4"><span className="text-slate-900 font-black">{cleanDeletedCount}</span> assets were successfully removed from the fleet.</p>
            <button onClick={() => setShowCleanSuccessModal(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200">System Ready</button>
          </div>
        </div>
      )}
    </div>
  );
};