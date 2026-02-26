//frontend/src/components/features/import/ImportProgress.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader, CheckCircle, AlertCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { useImport, type ImportProgress as ImportProgressType } from '@/hooks/useImport';

interface ImportProgressProps {
  uploadId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

const STEPS = [
  { key: 'uploaded', label: 'File Uploaded', description: 'File uploaded and verified' },
  { key: 'processing', label: 'Processing Data', description: 'Creating products and lots' },
  { key: 'completed', label: 'Completed', description: 'Import finished' },
  { key: 'completed_with_errors', label: 'Completed with Errors', description: 'Import finished with warnings' },
];

export const ImportProgress: React.FC<ImportProgressProps> = ({
  uploadId,
  onComplete,
  onError,
}) => {
  const { getImportProgress } = useImport();
  const [progress, setProgress] = useState<ImportProgressType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [estimatedTime, setEstimatedTime] = useState<string>('Calculating...');

  const formatEstimatedTime = (seconds: number): string => {
    if (seconds <= 0) return 'Completing...';
    if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const calculateStats = (progressData: ImportProgressType) => {
    const totalRows = progressData.total_rows || 0;
    const processedRows = progressData.processed_rows || 0;
    const errorCount = progressData.error_messages?.errors?.length || 0;
    const successCount = Math.max(0, processedRows - errorCount);
    const percentage = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;
    
    return { totalRows, processedRows, errorCount, successCount, percentage };
  };

  useEffect(() => {
    if (!uploadId) { setError('Upload ID not provided'); setLoading(false); return; }
    let isMounted = true;
    let pollingInterval: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        const progressData = await getImportProgress(uploadId);
        if (!isMounted) return;
        if (progressData) {
          setProgress(progressData);
          setError(null);
          if (progressData.status === 'processing' && progressData.processed_rows > 0) {
             const elapsed = (Date.now() - startTimeRef.current) / 1000;
             const rate = progressData.processed_rows / elapsed;
             const remaining = progressData.total_rows - progressData.processed_rows;
             setEstimatedTime(formatEstimatedTime(rate > 0 ? remaining / rate : 0));
          }
          if (['completed', 'completed_with_errors', 'finished'].includes(progressData.status)) {
            onComplete?.(progressData);
            clearInterval(pollingInterval);
          } else if (progressData.status === 'error') {
            const errorMessage = progressData.error_messages?.errors?.[0]?.error || 'Import error';
            setError(errorMessage);
            onError?.(errorMessage);
            clearInterval(pollingInterval);
          }
        } else { setError('Could not retrieve import progress'); }
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError('Error connecting to the server');
        setLoading(false);
      }
    };
    pollingInterval = setInterval(fetchProgress, 2000);
    fetchProgress(); 
    return () => { isMounted = false; clearInterval(pollingInterval); };
  }, [uploadId, getImportProgress, onComplete, onError]);

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-blue-600" /></div>;
  if (error) return <div className="text-center p-8 text-red-600"><AlertCircle className="mx-auto mb-2"/>{error}</div>;
  if (!progress) return null;

  const { totalRows, processedRows, errorCount, successCount, percentage } = calculateStats(progress);
  let normalizedStatus = progress.status;
  if (normalizedStatus === 'finished') normalizedStatus = 'completed';

  const currentStepIndex = STEPS.findIndex(step => step.key === normalizedStatus);
  const safeStepIndex = currentStepIndex !== -1 ? currentStepIndex : 0;
  const isFinalState = ['completed', 'finished', 'completed_with_errors', 'error'].includes(progress.status);
  const errorList = progress.error_messages?.errors || [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
           {progress.status === 'error' && '❌ Error'}
           {progress.status === 'completed_with_errors' && '⚠️ Completed with Errors'}
           {(progress.status === 'completed' || progress.status === 'finished') && '✅ Completed'}
           {progress.status === 'processing' && '🔄 Processing'}
           {progress.status === 'uploaded' && '📤 Ready'}
        </h3>
        <p className="text-gray-600 mt-1">{progress.current_operation}</p>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute top-1/2 w-full h-2 bg-gray-200 rounded-full -translate-y-1/2"></div>
            <div className="absolute top-1/2 h-2 bg-blue-600 rounded-full -translate-y-1/2 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step, index) => {
              const isCompleted = index < safeStepIndex;
              const isCurrent = index === safeStepIndex;
              if (index > safeStepIndex && !isCurrent) return null;

              return (
                <div key={step.key} className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-green-100 border-green-500 text-green-600' :
                    isCurrent ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-gray-100 border-gray-300'
                  }`}>
                    {/* Visual Fix: If finished, show Check instead of spinner */}
                    {isCompleted || (isCurrent && isFinalState) ? <CheckCircle size={20}/> : 
                     isCurrent ? <Loader size={20} className="animate-spin"/> : index + 1}
                  </div>
                  <p className="text-xs font-bold mt-2 text-gray-800">{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded text-blue-700"><b>{processedRows}/{totalRows}</b><div className="text-xs">Rows</div></div>
            <div className="bg-green-50 p-3 rounded text-green-700"><b>{successCount}</b><div className="text-xs">Successes</div></div>
            <div className="bg-red-50 p-3 rounded text-red-700"><b>{errorCount}</b><div className="text-xs">Errors</div></div>
            <div className="bg-purple-50 p-3 rounded text-purple-700"><b>{percentage}%</b><div className="text-xs">Progress</div></div>
        </div>

        {errorList.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded border border-red-200 text-sm text-red-800 max-h-32 overflow-y-auto">
                <div className="font-bold mb-2">{errorList.length} Errors:</div>
                {errorList.map((e: any, i: number) => (
                    <div key={i}>{e.error || e.message} {e.row_index && `(Row ${e.row_index})`}</div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

