import { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { useDataset } from './hooks/useDataset';
import ChatPanel from './components/ChatPanel';
import DashboardCanvas from './components/DashboardCanvas';
import UploadZone from './components/UploadZone';
import DataPreview from './components/DataPreview';

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-14 h-7 rounded-full transition-all duration-400 ease-in-out
        border border-[var(--border-medium)] overflow-hidden group"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #0d1526, #1a2744)'
          : 'linear-gradient(135deg, #87CEEB, #E0F0FF)'
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Stars (dark mode) */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute w-1 h-1 bg-white/60 rounded-full top-1.5 left-2" />
        <div className="absolute w-0.5 h-0.5 bg-white/40 rounded-full top-4 left-4" />
        <div className="absolute w-0.5 h-0.5 bg-white/50 rounded-full top-2 right-4" />
      </div>

      {/* Clouds (light mode) */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute w-4 h-2 bg-white/50 rounded-full bottom-1 right-2" />
        <div className="absolute w-3 h-1.5 bg-white/40 rounded-full bottom-2 right-5" />
      </div>

      {/* Knob: Moon/Sun */}
      <div
        className="absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-400 ease-in-out flex items-center justify-center"
        style={{
          left: theme === 'dark' ? '2px' : 'calc(100% - 26px)',
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #c8cdd5, #e8edf5)'
            : 'linear-gradient(135deg, #FFD700, #FFA500)',
          boxShadow: theme === 'dark'
            ? '0 0 8px rgba(200,205,213,0.3)'
            : '0 0 12px rgba(255,165,0,0.5), 0 0 24px rgba(255,215,0,0.2)'
        }}
      >
        {/* Moon craters */}
        {theme === 'dark' && (
          <>
            <div className="absolute w-1.5 h-1.5 bg-gray-400/30 rounded-full top-1 right-1.5" />
            <div className="absolute w-1 h-1 bg-gray-400/20 rounded-full bottom-1.5 left-1.5" />
          </>
        )}
        {/* Sun rays */}
        {theme === 'light' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-yellow-300/40" />
          </div>
        )}
      </div>
    </button>
  );
}

export default function App() {
  const { messages, charts, isLoading, sendMessage } = useChat();
  const { schema, isUploading, uploadResult, datasetName, uploadCSV } = useDataset();
  const [showUpload, setShowUpload] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  // Theme state — persisted in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dt-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dt-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleUpload = async (file) => {
    try {
      await uploadCSV(file);
      setShowUpload(false);
    } catch (err) {
      // Error is handled in useDataset
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ─── Top Bar ─── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] backdrop-blur-xl z-20 transition-colors duration-300">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dt-accent-cyan to-dt-accent-green flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-sora font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Data<span style={{ color: 'var(--accent-cyan)' }}>Talk</span>
          </h1>

          {/* Dataset badge */}
          <div className="ml-3 px-3 py-1 rounded-full text-xs font-mono" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
            {datasetName}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          {/* Schema toggle */}
          <button
            onClick={() => { setShowSchema(!showSchema); setShowUpload(false); }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showSchema ? 'bg-[var(--accent-cyan)]/10 text-dt-accent-cyan' : 'text-dt-text-muted hover:text-dt-text-primary hover:bg-[var(--bg-card)]'
            }`}
            title="View schema"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5V19A9 3 0 0 0 21 19V5" />
              <path d="M3 12A9 3 0 0 0 21 12" />
            </svg>
          </button>

          {/* Upload toggle */}
          <button
            onClick={() => { setShowUpload(!showUpload); setShowSchema(false); }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showUpload ? 'bg-[var(--accent-green)]/10 text-dt-accent-green' : 'text-dt-text-muted hover:text-dt-text-primary hover:bg-[var(--bg-card)]'
            }`}
            title="Upload CSV"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" /><path d="m16 16-4-4-4 4" />
            </svg>
          </button>

          {/* Settings */}
          <button className="p-2 rounded-lg text-dt-text-muted hover:text-dt-text-primary hover:bg-[var(--bg-card)] transition-all duration-200">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Chat */}
        <div className="w-[35%] min-w-[320px] max-w-[480px] flex flex-col" style={{ borderRight: '1px solid var(--border-subtle)' }}>
          {/* Upload zone (conditional) */}
          {showUpload && (
            <UploadZone onUpload={handleUpload} isUploading={isUploading} />
          )}
          {/* Schema preview (conditional) */}
          {showSchema && (
            <DataPreview schema={schema} uploadResult={uploadResult} />
          )}
          {/* Chat */}
          <div className="flex-1 min-h-0">
            <ChatPanel
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Panel: Dashboard */}
        <div className="flex-1 bg-[var(--bg-secondary)] transition-colors duration-300">
          <DashboardCanvas charts={charts} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
