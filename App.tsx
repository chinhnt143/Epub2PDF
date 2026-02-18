import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import UploadZone from './components/UploadZone';
import ProgressBar from './components/ProgressBar';
import PreviewContainer from './components/PreviewContainer';
import { parseEpub } from './services/epubService';
import { generateBookSummary } from './services/geminiService';
import { ParsedEpub, ProgressState, ConversionStatus, ConverterOptions } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [epubData, setEpubData] = useState<ParsedEpub | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    status: ConversionStatus.IDLE,
    message: '',
    percentage: 0
  });

  const [options, setOptions] = useState<ConverterOptions>({
    includeSummary: true,
    fontSize: 12,
    lineHeight: 1.6
  });

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setProgress({ status: ConversionStatus.PARSING, message: 'Parsing EPUB structure...', percentage: 10 });

    try {
      // 1. Parse EPUB
      const parsed = await parseEpub(selectedFile, (msg) => {
         setProgress(prev => ({ ...prev, message: msg, percentage: Math.min(prev.percentage + 5, 80) }));
      });

      setEpubData(parsed);
      setProgress({ status: ConversionStatus.PARSING, message: 'EPUB Parsed successfully!', percentage: 80 });

      // 2. Generate AI Summary if enabled
      if (options.includeSummary && process.env.API_KEY) {
        setProgress({ status: ConversionStatus.GENERATING_SUMMARY, message: 'Consulting Gemini AI for summary...', percentage: 90 });
        
        // Extract sample text from first few chapters
        let sampleText = "";
        for(const ch of parsed.chapters.slice(0, 3)) {
            // strip html tags for token efficiency
            const text = ch.content.replace(/<[^>]*>/g, ' ');
            sampleText += text + "\n";
            if(sampleText.length > 50000) break; 
        }

        const summary = await generateBookSummary(parsed.metadata.title, parsed.metadata.creator, sampleText);
        setAiSummary(summary);
      } else if (options.includeSummary && !process.env.API_KEY) {
          console.warn("No API Key available for AI Summary");
          setAiSummary("<p><em>AI Summary unavailable (Missing API Key)</em></p>");
      }

      setProgress({ status: ConversionStatus.READY, message: 'Ready for Printing', percentage: 100 });

    } catch (error) {
      console.error(error);
      setProgress({ status: ConversionStatus.ERROR, message: 'Error processing file. See console.', percentage: 0 });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setFile(null);
    setEpubData(null);
    setAiSummary(null);
    setProgress({ status: ConversionStatus.IDLE, message: '', percentage: 0 });
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      
      {/* Left Sidebar: Controls (Hidden on Print) */}
      <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col z-10 no-print shadow-xl overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    EP
                </div>
                <h1 className="text-xl font-bold text-slate-800">Epub<span className="text-indigo-600">Converter</span></h1>
            </div>
            <p className="text-xs text-slate-400">Client-side & AI Enhanced</p>
        </div>

        <div className="p-6 flex-1 space-y-8">
            
            {/* Status Section */}
            {progress.status === ConversionStatus.READY ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-check text-xl"></i>
                    </div>
                    <h3 className="text-green-800 font-semibold mb-1">Conversion Ready</h3>
                    <p className="text-xs text-green-600 mb-4">Your document is formatted and ready.</p>
                    <button 
                        onClick={handlePrint}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-print"></i> Save as PDF
                    </button>
                    <button 
                        onClick={handleReset}
                        className="mt-3 text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                        Convert another file
                    </button>
                </div>
            ) : progress.status !== ConversionStatus.IDLE ? (
                 <ProgressBar progress={progress} />
            ) : (
                <UploadZone 
                    onFileSelect={handleFileSelect} 
                    disabled={false} 
                />
            )}

            {/* Options */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Format Options</h3>
                
                <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm text-slate-600">
                        <span>AI Executive Summary</span>
                        <input 
                            type="checkbox" 
                            checked={options.includeSummary}
                            onChange={(e) => setOptions({...options, includeSummary: e.target.checked})}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                    </label>
                    <p className="text-[10px] text-slate-400 pl-1">
                        Uses Gemini 3 Flash to generate a study guide at the beginning of the PDF.
                    </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                    <label className="block text-sm text-slate-600 mb-1">Font Size: {options.fontSize}pt</label>
                    <input 
                        type="range" 
                        min="8" max="24" 
                        value={options.fontSize}
                        onChange={(e) => setOptions({...options, fontSize: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                 <div className="space-y-2">
                    <label className="block text-sm text-slate-600 mb-1">Line Height: {options.lineHeight}</label>
                    <input 
                        type="range" 
                        min="1" max="3" step="0.1"
                        value={options.lineHeight}
                        onChange={(e) => setOptions({...options, lineHeight: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-auto pt-8 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    <strong>Note:</strong> This tool runs entirely in your browser using JSZip. 
                    No file is uploaded to a server (except snippets sent to Gemini if AI is enabled).
                </p>
            </div>
        </div>
      </div>

      {/* Main Content: Preview Area */}
      <div className="flex-1 overflow-auto bg-slate-500 relative scroll-smooth">
         {epubData ? (
             <div className="py-12 min-h-full flex justify-center">
                 <PreviewContainer data={epubData} options={options} aiSummary={aiSummary} />
             </div>
         ) : (
             <div className="h-full flex items-center justify-center text-slate-300">
                 <div className="text-center">
                     <i className="fas fa-file-pdf text-6xl mb-4 opacity-50"></i>
                     <p className="text-lg">Preview will appear here</p>
                 </div>
             </div>
         )}
      </div>

    </div>
  );
};

export default App;