//frontend/src/app/dashboard/import/page.tsx

'use client';

import { useState } from 'react';
import { UploadWizard } from './components/UploadWizard';
import { ImportHistory } from './components/ImportHistory';
import { FileInput, History, RefreshCw } from 'lucide-react';

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');

  const handleRefresh = () => {
    window.location.reload(); // The safest way to reset all state
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Import</h1>
            <p className="text-gray-600 mt-2">
              Bulk upload of drop-shipping products from Excel.
            </p>
          </div>
          
          <div className="flex space-x-3">

            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setActiveTab('import')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'import' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileInput className="w-4 h-4 mr-2" />
                Import
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <History className="w-4 h-4 mr-2" />
                History
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'import' ? <UploadWizard /> : <ImportHistory />}
        </div>

      </div>
    </div>
  );
}