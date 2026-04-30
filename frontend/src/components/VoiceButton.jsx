import { useState, useRef, useEffect, useCallback } from 'react';

export default function VoiceButton({ onTranscript, disabled }) {
  const [status, setStatus] = useState('idle'); // idle | listening | processing
  const [toast, setToast] = useState(null);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Don't render if browser doesn't support
  if (!SpeechRecognition) return null;

  const showToast = (message, duration = 2000) => {
    setToast({ message, leaving: false });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => prev ? { ...prev, leaving: true } : null);
      setTimeout(() => setToast(null), 300);
    }, duration);
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus('idle');
  }, []);

  const startListening = useCallback(() => {
    if (status !== 'idle' || disabled) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    setStatus('listening');

    // 5-second silence timeout
    timeoutRef.current = setTimeout(() => {
      showToast('No speech detected, try again');
      stopListening();
    }, 5000);

    recognition.onresult = (event) => {
      // Reset silence timeout on any result
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          showToast('No speech detected, try again');
          stopListening();
        }, 5000);
      }

      const transcript = event.results[0][0].transcript;

      // Show interim results in input
      onTranscript(transcript, false);

      if (event.results[0].isFinal) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setStatus('processing');
        showToast(`Voice captured: "${transcript}"`);

        // Auto-submit after brief delay for toast visibility
        setTimeout(() => {
          onTranscript(transcript, true);
          setStatus('idle');
        }, 600);
      }
    };

    recognition.onerror = (event) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (event.error === 'not-allowed') {
        onTranscript('__MIC_DENIED__', false);
      }
      setStatus('idle');
    };

    recognition.onend = () => {
      if (status === 'listening') {
        // If it ended without a final result, just reset
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setStatus('idle');
      }
    };

    try {
      recognition.start();
    } catch (err) {
      setStatus('idle');
    }
  }, [status, disabled, SpeechRecognition, onTranscript, stopListening]);

  const handleClick = () => {
    if (status === 'idle') {
      startListening();
    } else {
      stopListening();
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 z-50 px-4 py-2 rounded-lg text-sm font-inter shadow-lg
            ${toast.leaving ? 'toast-exit' : 'toast-enter'}`}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--text-primary)',
            borderColor: 'color-mix(in srgb, var(--accent-cyan) 30%, transparent)'
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Voice Button */}
      <div className="relative group">
        {/* Tooltip */}
        {status === 'idle' && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs
            text-dt-text-muted whitespace-nowrap
            opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}
          >
            Click to speak
          </div>
        )}

        {/* Pulse rings when listening */}
        {status === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 150, 300].map((delay, i) => (
              <div
                key={i}
                className="absolute w-10 h-10 rounded-full border-2 border-red-500/50 voice-ring"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={disabled && status === 'idle'}
          className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
            ${status === 'idle'
              ? 'text-dt-text-muted border border-[var(--border-medium)] hover:border-dt-accent-cyan hover:text-dt-accent-cyan'
              : status === 'listening'
                ? 'text-red-500 border border-red-500/40 bg-red-500/10 animate-pulse'
                : 'text-dt-accent-cyan border border-[var(--accent-cyan)] bg-[var(--bg-card)]'
            }`}
          aria-label={status === 'idle' ? 'Start voice input' : status === 'listening' ? 'Stop listening' : 'Processing'}
        >
          {status === 'processing' ? (
            /* Spinning loader */
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
            </svg>
          ) : (
            /* Mic icon */
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
