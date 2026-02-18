import React from 'react';
import { ParsedEpub, ConverterOptions } from '../types';

interface PreviewContainerProps {
  data: ParsedEpub | null;
  options: ConverterOptions;
  aiSummary: string | null;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ data, options, aiSummary }) => {
  if (!data) return null;

  return (
    <div 
      id="print-area" 
      className="print-content max-w-[210mm] mx-auto bg-white shadow-xl min-h-screen p-[20mm] text-slate-900"
      style={{
        fontSize: `${options.fontSize}pt`,
        lineHeight: options.lineHeight
      }}
    >
      {/* Cover Page */}
      <div className="flex flex-col items-center justify-center min-h-[900px] text-center border-b-2 border-slate-100 mb-12 print-break-before">
        <h1 className="text-5xl font-bold mb-8 leading-tight">{data.metadata.title}</h1>
        <h2 className="text-2xl text-slate-600 italic mb-12">by {data.metadata.creator}</h2>
        <div className="w-32 h-1 bg-slate-900 mb-12"></div>
        <p className="text-sm text-slate-400 uppercase tracking-widest">Converted to PDF</p>
      </div>

      {/* AI Summary Section */}
      {aiSummary && (
        <div className="mb-16 print-break-before">
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-8 rounded-r-lg">
                <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center">
                    <i className="fas fa-sparkles mr-3"></i> AI Executive Summary
                </h2>
                <div 
                    className="prose prose-indigo max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: aiSummary }}
                />
            </div>
        </div>
      )}

      {/* Chapters */}
      <div className="space-y-12">
        {data.chapters.map((chapter, index) => (
          <article key={chapter.id} className="chapter mb-12 print-break-before">
             {/* We rely on the chapter content's internal headers, but if missing, we could inject one
             <h3 className="text-xl font-bold text-slate-400 mb-4 uppercase tracking-wider text-xs">Chapter {index + 1}</h3>
             */}
             <div 
                className="prose max-w-none text-justify"
                dangerouslySetInnerHTML={{ __html: chapter.content }}
             />
          </article>
        ))}
      </div>
    </div>
  );
};

export default PreviewContainer;