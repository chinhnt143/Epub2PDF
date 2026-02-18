import React, { useCallback } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.epub')) {
            onFileSelect(file);
        } else {
            alert("Please upload an .epub file");
        }
      }
    },
    [onFileSelect, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-300' : 'border-indigo-400 hover:border-indigo-600 hover:bg-indigo-50 cursor-pointer'}
      `}
    >
      <input
        type="file"
        id="fileInput"
        accept=".epub"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-book-open text-2xl"></i>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Upload EPUB File
        </h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Drag and drop your .epub file here, or click to browse.
          <br />
          <span className="text-xs mt-2 block text-slate-400">Processed locally in your browser.</span>
        </p>
      </label>
    </div>
  );
};

export default UploadZone;