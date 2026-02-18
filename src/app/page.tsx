import React from 'react';
import ConverterUI from '../components/ConverterUI';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <div className="text-center mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            Local PDF Engine
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          EPUB to PDF <span className="text-indigo-600">Converter</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Transform your eBooks into professionally formatted, print-ready PDF documents using our local Puppeteer rendering engine.
        </p>
      </div>
      
      {/* Main UI */}
      <div className="w-full animate-in fade-in zoom-in duration-500 delay-150">
        <ConverterUI />
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-slate-400 text-sm">
        <div className="flex items-center justify-center gap-6 mb-4">
             <div className="flex items-center gap-2">
                 <i className="fas fa-shield-alt"></i>
                 <span>Secure Processing</span>
             </div>
             <div className="flex items-center gap-2">
                 <i className="fas fa-print"></i>
                 <span>A4 Layout</span>
             </div>
        </div>
        <p>&copy; {new Date().getFullYear()} AI-Enhanced Converter. All rights reserved.</p>
      </footer>
    </main>
  );
}