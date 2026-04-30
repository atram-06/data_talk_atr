import { useState, useRef, useEffect } from 'react';
import VoiceButton from './VoiceButton';

const SUGGESTED_QUERIES = [
  'Monthly revenue trend',
  'Sales by category',
  'Most profitable region',
  'Q4 performance spike',
  'Profit vs Sales by state',
  'Top 10 sub-categories'
];

export default function ChatPanel({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    setVoiceStatus(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = (transcript, isFinal) => {
    if (transcript === '__MIC_DENIED__') {
      setVoiceStatus('denied');
      return;
    }
    setInput(transcript);
    if (isFinal) {
      setVoiceStatus(null);
      onSendMessage(transcript);
      setTimeout(() => setInput(''), 100);
    } else {
      setVoiceStatus('listening');
    }
  };

  const showSuggestions = messages.length === 0;

  return (
    <div className="flex flex-col h-full transition-colors duration-300" style={{ background: 'var(--bg-primary)' }}>
      {/* Chat header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <h2 className="text-sm font-sora font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <svg className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
          </svg>
          Chat
        </h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showSuggestions && (
          <div className="space-y-3">
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-green)]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-dt-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <h3 className="text-base font-sora font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Ask anything about your data
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                I'll generate SQL, run it, and visualize the results
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); onSendMessage(q); }}
                  className="px-3 py-1.5 text-xs rounded-full
                    hover:bg-[var(--bg-card)]
                    transition-all duration-200"
                  style={{ border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-green)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-dt-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>
            <div className="glass-card px-4 py-3 max-w-[85%]">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-dt-accent-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-dt-accent-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-dt-accent-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {voiceStatus === 'denied' && (
          <div className="glass-card px-4 py-3 text-xs text-red-400/80 border-red-500/20">
            🎤 Microphone access denied. Please type your question instead.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice status indicator */}
      {voiceStatus === 'listening' && (
        <div className="px-5 py-1.5 text-center">
          <span className="text-xs text-red-400 animate-pulse font-mono">
            ● Listening... speak now
          </span>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex gap-2 items-center glass-card px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data..."
            className="flex-1 bg-transparent text-sm outline-none font-inter"
            style={{ color: 'var(--text-primary)' }}
            disabled={isLoading}
          />

          <VoiceButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-green)]
              hover:shadow-[0_0_20px_var(--shadow-glow)]
              text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const [showSql, setShowSql] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-[var(--accent-cyan)]/30 to-[var(--accent-cyan)]/10'
          : 'bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-green)]/10'
      }`}>
        {isUser ? (
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${
        isUser
          ? 'rounded-2xl rounded-tr-md px-4 py-2.5'
          : `glass-card rounded-2xl rounded-tl-md px-4 py-2.5 ${message.isError ? 'border-red-500/20' : ''}`
      }`}
        style={isUser ? {
          background: 'var(--user-bubble-bg)',
          border: '1px solid var(--user-bubble-border)'
        } : undefined}
      >
        <p className="text-sm leading-relaxed"
          style={{ color: message.isError ? 'rgba(248,113,113,0.9)' : 'var(--text-primary)' }}>
          {message.content}
        </p>

        {/* SQL query toggle */}
        {message.sql_query && (
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => setShowSql(!showSql)}
              className="text-[10px] transition-colors flex items-center gap-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className={`w-3 h-3 transition-transform ${showSql ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              {showSql ? 'Hide' : 'Show'} SQL query
            </button>
            {showSql && (
              <pre className="mt-2 text-[10px] font-mono text-dt-accent-cyan/70 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap"
                style={{ background: 'var(--code-bg)' }}>
                {message.sql_query}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
