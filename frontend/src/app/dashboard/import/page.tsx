// frontend/src/app/dashboard/import/page.tsx

'use client';

import { useState } from 'react';
import { UploadWizard } from './components/UploadWizard';
import { ImportHistory } from './components/ImportHistory';
import { FileInput, History, RefreshCw, Zap } from 'lucide-react'; // ✅ Corregido: Eliminado 'database' inexistente

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');

  // Estilo común para los botones del Tab Switcher - GROSOR ELITE
  const getTabClass = (isActive: boolean) => `
    flex items-center px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
    ${isActive 
      ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 translate-y-[-1px]' 
      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
  `;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      
      {/* 🚀 HEADER SECTION - ADN MEDBAY ELITE */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Data Engine v2.0</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Inventory Ingestion</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">
            High-volume stock synchronization & manual asset entry.
          </p>
        </div>
        
        {/* 🎚️ MODE SWITCHER */}
        <div className="flex bg-white border-2 border-slate-100 rounded-[1.5rem] p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('import')}
            className={getTabClass(activeTab === 'import')}
          >
            <FileInput className="w-4 h-4 mr-2 stroke-[3]" />
            Control Center
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={getTabClass(activeTab === 'history')}
          >
            <History className="w-4 h-4 mr-2 stroke-[3]" />
            Audit Logs
          </button>
        </div>
      </div>

      {/* 🔮 MAIN WORKSPACE */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-slate-100">
        {activeTab === 'import' ? (
          <div className="animate-in slide-in-from-left-4 duration-500">
            <UploadWizard />
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <ImportHistory />
          </div>
        )}
      </div>

      {/* ℹ️ SYSTEM FOOTER */}
      <div className="flex items-center justify-center gap-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          Server Status: Operational
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
          Engine: Asynchronous Batching
        </div>
      </div>
    </div>
  );
}