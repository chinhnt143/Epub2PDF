'use client';

import React, { useState, useCallback } from 'react';

export default function ConverterUI() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (status === 'processing' || status === 'uploading') return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.toLowerCase().endsWith('.epub')) {
        setFile(f);
        setStatus('idle');
      } else {
        setErrorMessage('Only .epub files are allowed');
        setStatus('error');
      }
    }
  }, [status]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setStatus('uploading'); // UI feedback: Uploading
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      setStatus('processing'); // UI feedback: Server working
      
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Conversion failed on server');
      }

      // Handle File Download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Get filename from header or fallback
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = file.name.replace('.epub', '.pdf');
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
            fileName = match[1];
        }
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-slate-200">
      
      {/* 1. UPLOAD ZONE */}
      {!file && (
        <div 
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <input type="file" accept=".epub" onChange={onFileChange} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <p className="text-lg font-medium text-slate-700">Click or Drag EPUB here</p>
            <p className="text-sm text-slate-400 mt-2">Server-side High Fidelity Conversion</p>
          </label>
        </div>
      )}

      {/* 2. FILE SELECTED & ACTIONS */}
      {file && status !== 'success' && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-indigo-50 rounded-lg text-indigo-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span className="font-semibold">{file.name}</span>
            <button onClick={() => {setFile(null); setStatus('idle');}} className="ml-2 text-indigo-400 hover:text-indigo-700">×</button>
          </div>

          {status === 'processing' || status === 'uploading' ? (
             <button disabled className="w-full py-3 bg-indigo-400 text-white rounded-lg font-bold flex items-center justify-center gap-2 cursor-wait">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               {status === 'uploading' ? 'Uploading...' : 'Rendering PDF...'}
             </button>
          ) : (
            <button onClick={handleConvert} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all">
              Convert to PDF
            </button>
          )}
          
          {status === 'error' && (
            <div className="mt-4 text-red-600 bg-red-50 p-3 rounded border border-red-200 text-sm">
              Error: {errorMessage}
            </div>
          )}
        </div>
      )}

      {/* 3. SUCCESS STATE */}
      {status === 'success' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Conversion Complete!</h3>
          <p className="text-slate-500 mb-6">Your PDF has been downloaded automatically.</p>
          <button 
            onClick={() => {setFile(null); setStatus('idle');}}
            className="text-indigo-600 font-medium hover:underline"
          >
            Convert another file
          </button>
        </div>
      )}
    </div>
  );
}