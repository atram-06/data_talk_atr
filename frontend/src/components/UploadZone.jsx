import { useCallback, useState } from 'react';

export default function UploadZone({ onUpload, isUploading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }

    onUpload(file);
  }, [onUpload]);

  const handleFileInput = useCallback((e) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div className="px-4 mb-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('csv-upload-input')?.click()}
        className={`relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-300
          ${isDragging
            ? 'border-dt-accent-cyan bg-[var(--bg-card)] scale-[1.02]'
            : 'border-[var(--border-medium)] hover:border-dt-text-muted hover:bg-[var(--bg-card)]'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          id="csv-upload-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <svg className="w-6 h-6 text-dt-accent-cyan animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-dt-text-muted">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <svg className={`w-6 h-6 transition-colors ${isDragging ? 'text-dt-accent-cyan' : 'text-dt-text-muted'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m16 16-4-4-4 4" />
            </svg>
            <div>
              <span className="text-xs text-dt-text-muted">
                Drop CSV here or <span className="text-dt-accent-cyan">browse</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1.5 px-1">{error}</p>
      )}
    </div>
  );
}
