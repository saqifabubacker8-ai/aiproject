import { useCallback, useEffect, useRef, useState } from 'react';
import { shouldDispatchCommand } from '../utils/speechGuard.js';

export { shouldDispatchCommand };

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

const ERRORS = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser’s site settings and try again.',
  'service-not-allowed': 'Microphone access is blocked. Allow it in your browser’s site settings and try again.',
  'no-speech': 'I didn’t hear anything. Tap the mic and try again.',
  'audio-capture': 'No microphone was found. Connect one and try again.',
  network: 'Speech recognition needs an internet connection.',
};

// Errors that make auto-restarting pointless (it would just loop forever).
const FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture']);

export default function useSpeechRecognition({ lang = 'en-IN', onFinal }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const wantRef = useRef(false);      // does the user want the mic on?
  const handledRef = useRef(0);       // results already dispatched in this session
  const pendingRef = useRef('');      // latest not-yet-final text
  const restartTimer = useRef(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const dispatch = useCallback((text) => {
    if (shouldDispatchCommand(text)) onFinalRef.current?.(text.trim());
  }, []);

  const begin = useCallback(() => {
    if (!SR || !wantRef.current || recRef.current) return;

    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    handledRef.current = 0;
    pendingRef.current = '';

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      if (!wantRef.current) return; // stopped/cancelled: ignore late results (stop() already sent pending text)
      // Dispatch each finished phrase exactly once; show the rest as live text.
      let interim = '';
      for (let i = handledRef.current; i < e.results.length; i++) {
        const result = e.results[i];
        const t = result[0].transcript;
        if (result.isFinal) {
          handledRef.current = i + 1;
          pendingRef.current = '';
          setTranscript('');
          dispatch(t);
        } else {
          interim += t;
        }
      }
      pendingRef.current = interim.trim();
      if (interim) setTranscript(interim.trim());
    };

    rec.onerror = (e) => {
      if (e.error === 'aborted') return;
      if (e.error === 'no-speech') return; // normal in continuous mode; we just restart
      setError(ERRORS[e.error] || `Speech recognition error: ${e.error}`);
      if (FATAL.has(e.error)) wantRef.current = false;
    };

    rec.onend = () => {
      recRef.current = null;
      setTranscript('');
      // Chrome ends continuous sessions on its own every so often; restart while wanted.
      if (wantRef.current) {
        clearTimeout(restartTimer.current);
        restartTimer.current = setTimeout(begin, 300);
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
    }
  }, [lang, dispatch]);

  const start = useCallback(() => {
    if (!SR) {
      setError('Voice input isn’t supported in this browser. Use Chrome, Edge or Safari, or type your request.');
      return;
    }
    setError('');
    setTranscript('');
    wantRef.current = true;
    begin();
  }, [begin]);

  // Stop listening; anything you were still saying is sent first.
  const stop = useCallback(() => {
    wantRef.current = false;
    clearTimeout(restartTimer.current);
    const pending = pendingRef.current;
    pendingRef.current = '';
    recRef.current?.stop();
    setListening(false);
    setTranscript('');
    if (pending) dispatch(pending);
  }, [dispatch]);

  // Stop listening and throw away whatever was in progress.
  const cancel = useCallback(() => {
    wantRef.current = false;
    clearTimeout(restartTimer.current);
    pendingRef.current = '';
    recRef.current?.abort();
    setListening(false);
    setTranscript('');
  }, []);

  useEffect(() => () => {
    wantRef.current = false;
    clearTimeout(restartTimer.current);
    recRef.current?.abort();
  }, []);

  return { supported: Boolean(SR), listening, transcript, error, setError, start, stop, cancel };
}
