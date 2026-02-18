'use client';

import React, { useState, useCallback } from 'react';

export default function ConverterUI() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.toLowerCase().endsWith('.epub')) {
        setFile(f);
        setError(null);
        setSuccess(false);
      } else {
        setError('Only .epub files are supported.');
      }
    }
  }, [isLoading]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server Error: ${response.status}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Try to get filename from header
      const contentDisp = response.headers.get('Content-Disposition');
      let filename = file.name.replace('.epub', '.pdf');
      if (contentDisp && contentDisp.includes('filename=')) {
        const match = contentDisp.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during conversion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-8">
      
      {/* Drop Zone */}
      <div 
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          relative border-2 border-dashed rounded-lg p-10 text-center transition-all
          ${isLoading ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-300' : 'cursor-pointer hover:bg-slate-50'}
          ${error ? 'border-red-300 bg-red-50' : file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'}
        `}
      >
        <input 
          type="file" 
          accept=".epub" 
          onChange={onFileChange} 
          className="hidden" 
          id="epub-upload" 
          disabled={isLoading}
        />
        <label htmlFor="epub-upload" className="block w-full h-full cursor-pointer">
          {file ? (
            <div className="animate-in fade-in zoom-in duration-300">
               <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                 <i className="fas fa-file-invoice"></i>
               </div>
               <p className="font-semibold text-slate-800 truncate px-4">{file.name}</p>
               <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-slate-500">
              <i className="fas fa-cloud-upload-alt text-3xl mb-3 text-slate-400"></i>
              <p className="font-medium text-slate-700">Click or Drag & Drop EPUB</p>
              <p className="text-xs mt-1 text-slate-400">Strict Server-Side Processing</p>
            </div>
          )}
        </label>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}

      {/* Success Feedback */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-100 flex items-center">
          <i className="fas fa-check-circle mr-2"></i>
          Conversion successful! Download started.
        </div>
      )}

      {/* Convert Button / Spinner */}
      <button
        onClick={handleConvert}
        disabled={!file || isLoading}
        className={`
          w-full mt-6 py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
          ${!file || isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing on Server...</span>
          </>
        ) : (
          <>
            <span>Convert to PDF</span>
            <i className="fas fa-arrow-right text-sm opacity-80"></i>
          </>
        )}
      </button>

      {/* Footer Info */}
      <p className="text-center text-xs text-slate-400 mt-4">
        Powered by Puppeteer. High-fidelity rendering.
      </p>
    </div>
  );
}