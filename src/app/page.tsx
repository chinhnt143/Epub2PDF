import React from 'react';
import ConverterUI from '../components/ConverterUI';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">EPUB to PDF <span className="text-indigo-600">Architect</span></h1>
        <p className="text-slate-500 mt-2">Server-side Puppeteer Rendering • Strict Fidelity • No Bloat</p>
      </div>
      <ConverterUI />
    </main>
  );
}