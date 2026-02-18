import React from 'react';
import { ProgressState, ConversionStatus } from '../types';

interface ProgressBarProps {
  progress: ProgressState;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  if (progress.status === ConversionStatus.IDLE) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700 capitalize">
          {progress.status.replace('_', ' ')}
        </span>
        <span className="text-sm font-medium text-slate-500">
          {Math.round(progress.percentage)}%
        </span>
      </div>
      
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${progress.percentage}%` }}
        >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 mt-2 text-center animate-pulse">
        {progress.message}
      </p>
    </div>
  );
};

export default ProgressBar;