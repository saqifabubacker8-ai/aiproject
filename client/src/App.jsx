import { useCallback, useEffect, useRef, useState } from 'react';
import MicButton from './components/MicButton.jsx';
import Waveform from './components/Waveform.jsx';
import useSpeechRecognition from './hooks/useSpeechRecognition.js';
import useSpeechSynthesis from './hooks/useSpeechSynthesis.js';

const GREETING = {
  role: 'assistant',
  text: 'Say “play” followed by the song name, such as “play starboy” or “play arabic kuthu”.',
};

const DEFAULT_FILTERS = { duration: 'any', maxMinutes: null, minMinutes: null, order: 'relevance', uploadDate: 'any', language: null };
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatTime = (totalSeconds = 0) => {
  const safeSeconds = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

function ControlIcon({ type }) {
  const common = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' };
  switch (type) {
    case 'previous':
      return (
        <svg {...common}>
          <path d="M5 5v14" />
          <path d="M18 6 9 12l9 6V6Z" fill="currentColor" stroke="none" />
          <path d="M5 12 14 5v14L5 12Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'next':
      return (
        <svg {...common}>
          <path d="M19 5v14" />
          <path d="M6 6 15 12l-9 6V6Z" fill="currentColor" stroke="none" />
          <path d="M19 12 10 5v14l9-7Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5v14l11-7-11-7Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...common}>
          <path d="M8 5v14M16 5v14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    default:
      return null;
  }
}

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

const API_BASE = import.meta.env.VITE_API_URL || '';

async function post(path, body) {
  const target = `${API_BASE}/api${path}`;
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => { throw new Error('Can’t reach the VoiceTube server. Check the deployed API URL or local backend status.'); });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

export default function App() {
  const [messages, setMessages] = useState([GREETING]);
  const [videos, setVideos] = useState([]);
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [muted, setMuted] = useState(() => [true, 1].includes(readStorage('vt-muted', false)));
  const [menu, setMenu] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(78);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queueIndex, setQueueIndex] = useState(0);
  const endRef = useRef(null);
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const requestIdRef = useRef(0);
  const loadTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(78);
  const playNextRef = useRef(() => {});
  const speakingRef = useRef(false);

  const currentTrack = videos[queueIndex] || null;
  const tts = useSpeechSynthesis(muted);
  const cancelSpeech = tts.cancel;
  speakingRef.current = tts.speaking;
  isPlayingRef.current = isPlaying;
  volumeRef.current = volume;
  // Ignore phrases heard while the assistant itself is talking (it would hear its own reply).
  const stt = useSpeechRecognition({
    lang: 'en-IN',
    onFinal: (value) => { if (!speakingRef.current) send(value); },
  });

  const say = (role, msg) => setMessages((m) => [...m, { role, text: msg }]);

  const playTrack = useCallback((video, nextQueue = []) => {
    if (!video) return;
    const nextList = nextQueue.length ? nextQueue : [video];
    console.log('playTrack()', { id: video.id, title: video.title, queue: nextList.length });
    setVideos(nextList);
    setQueueIndex(0);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
    setPlayerError('');
    setState((prev) => prev ?? { query: video.title, filters: DEFAULT_FILTERS });
  }, []);

  const playNext = useCallback((auto = false) => {
    if (!videos.length) {
      if (auto) setPlayerError('Queue finished. Say “play something similar” to find more songs.');
      return;
    }

    if (queueIndex >= videos.length - 1) {
      if (auto) {
        setPlayerError('Queue finished. Say “play something similar” to find more songs.');
      }
      setIsPlaying(false);
      return;
    }

    const nextIndex = queueIndex + 1;
    console.log('playNext()', { from: queueIndex, to: nextIndex, auto });
    setQueueIndex(nextIndex);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
    setPlayerError('');
  }, [queueIndex, videos]);

  const playPrevious = useCallback(() => {
    if (!videos.length) return;
    if (queueIndex <= 0) {
      setIsPlaying(false);
      return;
    }

    const prevIndex = queueIndex - 1;
    console.log('playPrevious()', { from: queueIndex, to: prevIndex });
    setQueueIndex(prevIndex);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
    setPlayerError('');
  }, [queueIndex, videos]);

  playNextRef.current = playNext;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, videos, busy]);

  useEffect(() => {
    writeStorage('vt-muted', muted);
    if (muted) cancelSpeech();
  }, [muted, cancelSpeech]);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setPlayerReady(true);
    } else {
      // Chain any existing callback so we never overwrite another listener.
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        setPlayerReady(true);
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => setPlayerError('Could not load the YouTube player. Check your internet connection.');
        document.head.appendChild(script);
      }
    }

    return () => {
      clearTimeout(loadTimerRef.current);
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch { /* already gone */ }
      }
      playerRef.current = null;
    };
  }, []);

  // Safe wrapper: the player object exists before it is ready, but its methods don't.
  const control = (method, ...args) => {
    const p = playerRef.current;
    if (p && typeof p[method] === 'function') {
      try { return p[method](...args); } catch { /* player not ready */ }
    }
    return undefined;
  };

  // Create the player once, then only swap the video when the track actually changes.
  // (Volume / queue changes must NOT reload the current song.)
  useEffect(() => {
    if (!playerReady || !playerContainerRef.current || !currentTrack) return;
    if (!window.YT || !window.YT.Player) return;
    const id = currentTrack.id;

    if (!playerRef.current) {
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: id,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: isPlayingRef.current ? 1 : 0,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volumeRef.current);
            if (isPlayingRef.current) {
              event.target.playVideo();
            }
            setDuration(event.target.getDuration() || 0);
          },
          onStateChange: (event) => {
            const code = event.data;
            const PS = window.YT.PlayerState;
            if (code === PS.ENDED) {
              playNextRef.current(true);
            } else if (code === PS.PLAYING) {
              clearTimeout(loadTimerRef.current);
              setIsPlaying(true);
              setPlayerError('');
              setDuration(event.target.getDuration() || 0);
            } else if (code === PS.PAUSED) {
              setIsPlaying(false);
            }
          },
          onError: () => {
            // Unavailable / not embeddable: skip to the next song instead of getting stuck.
            setPlayerError('That video can’t be played here. Skipping to the next one.');
            playNextRef.current(true);
          },
        },
      });
    } else if (isPlayingRef.current) {
      // A new play command should start immediately, even when the previous video was paused.
      control('loadVideoById', id);
      if (typeof control('playVideo') === 'undefined') {
        setTimeout(() => control('playVideo'), 0);
      }
    } else {
      control('cueVideoById', id);
    }

    // If the browser silently blocked autoplay, tell the user instead of showing a fake "playing" state.
    clearTimeout(loadTimerRef.current);
    if (isPlayingRef.current) {
      loadTimerRef.current = setTimeout(() => {
        const PS = window.YT?.PlayerState;
        const st = control('getPlayerState');
        if (PS && isPlayingRef.current && (st === PS.UNSTARTED || st === PS.CUED)) {
          setPlayerError('Playback was blocked by the browser. Press play to start the song.');
          setIsPlaying(false);
        }
      }, 4000);
    }
  }, [currentTrack?.id, playerReady]);

  useEffect(() => {
    if (!playerReady) return;
    control('setVolume', volume);
  }, [playerReady, volume]);

  useEffect(() => {
    if (!playerReady) return;
    control(isPlaying ? 'playVideo' : 'pauseVideo');
  }, [isPlaying, playerReady]);

  useEffect(() => {
    if (!playerReady || !isPlaying) return;
    const tick = setInterval(() => {
      const nextTime = control('getCurrentTime') || 0;
      const totalTime = control('getDuration') || 0;
      if (totalTime > 0) {
        setDuration(totalTime);
        setProgress((nextTime / totalTime) * 100);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [isPlaying, playerReady]);

  const handleAssistantResult = (result) => {
    if (!result) return;
    if (result.action === 'pause') {
      setIsPlaying(false);
      return;
    }
    if (result.action === 'resume') {
      setIsPlaying(true);
      return;
    }
    if (result.action === 'next') {
      playNext();
      return;
    }
    if (result.action === 'previous') {
      playPrevious();
      return;
    }
    if (result.action === 'volume') {
      const nextVolume = clamp(volume + (result.direction === 'up' ? 10 : -10), 0, 100);
      setVolume(nextVolume);
      return;
    }
    if (result.action === 'play' && result.videos?.length) {
      const chosen = result.videos[0];
      console.log('Handling play command result', result.query, chosen?.id);
      setVideos(result.videos);
      setQueueIndex(0);
      setIsPlaying(true);
      setPlayerError('');
      setState(result.state || { query: result.query, filters: result.filters || DEFAULT_FILTERS });
      return;
    }
    if (result.videos?.length) {
      console.log('Handling search result refresh', result.query, result.videos.length);
      setVideos((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const next = [...prev, ...result.videos.filter((video) => !seen.has(video.id))];
        return next.length ? next : result.videos;
      });
      setQueueIndex(0);
      setIsPlaying(false);
      setPlayerError('');
      setState(result.state || { query: result.query, filters: result.filters || DEFAULT_FILTERS });
    }
  };

  async function send(raw) {
    const msg = raw.trim();
    if (!msg || busy) return;

    const requestId = ++requestIdRef.current;
    console.log('send()', { requestId, msg });

    tts.cancel();
    setText('');
    setPlayerError('');

    const history = messages.slice(-8).map(({ role, text }) => ({ role, text }));
    say('user', msg);
    setBusy(true);

    try {
      const r = await post('/assistant', { message: msg, history, state });
      if (requestId !== requestIdRef.current) {
        console.log('Ignoring stale response for request', requestId);
        return;
      }

      console.log('Assistant response', { requestId, action: r.action, videos: r.videos?.length || 0 });
      say('assistant', r.reply);
      tts.speak(r.reply);
      handleAssistantResult(r);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      console.error('send() failed', e);
      say('assistant', e.message);
      tts.speak('Sorry, something went wrong.');
    } finally {
      if (requestId === requestIdRef.current) {
        setBusy(false);
      }
    }
  }

  const clearAll = () => {
    tts.cancel();
    stt.cancel();
    setMessages([GREETING]);
    setVideos([]);
    setState(null);
    setQueueIndex(0);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setPlayerError('');
    setMenu(false);
    if (playerRef.current) {
      control('stopVideo');
    }
  };

  const onMic = () => {
    tts.cancel();
    if (stt.listening) {
      stt.stop();
    } else {
      stt.start();
    }
  };

  const handleSeek = (value) => {
    const nextProgress = Number(value);
    setProgress(nextProgress);
    control('seekTo', (duration * nextProgress) / 100, true);
  };

  return (
    <div className="app-shell">
      <aside className={`side ${menu ? 'open' : ''}`}>
        <div className="brand"><span className="dot" />Velora</div>
        <button className="ghost" onClick={clearAll}>New mix</button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button className="icon menu-btn" onClick={() => setMenu(!menu)} aria-label="Toggle menu">☰</button>
          <span className="title">Velora</span>
          <div className="actions">
            <button className="ghost sm" onClick={() => setMuted(!muted)} aria-pressed={muted}>{muted ? 'Voice replies off' : 'Voice replies on'}</button>
            <button className="ghost sm" onClick={clearAll}>Clear</button>
          </div>
        </header>

        <section className="content-grid">
          <div className="now-playing card-panel">
            <div className="artwork-wrap">
              {currentTrack ? <img src={currentTrack.thumbnail} alt={currentTrack.title} className="album-art" /> : <div className="album-art placeholder">♫</div>}
            </div>

            <div className="track-meta">
              <span className="eyebrow">Now playing</span>
              <h2>{currentTrack?.title || 'Ready to play your next song'}</h2>
              <p>{currentTrack?.channel || 'Voice-controlled YouTube music'}</p>
            </div>

            <div className="progress-wrap">
              <div className="time-row">
                <span>{formatTime((duration * progress) / 100)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input type="range" min="0" max="100" value={progress} onChange={(e) => handleSeek(e.target.value)} aria-label="Playback progress" />
            </div>

            <div className="transport-row">
              <button className="transport" onClick={playPrevious} aria-label="Previous song"><ControlIcon type="previous" /></button>
              <button className="transport primary" onClick={() => setIsPlaying((prev) => !prev)} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <ControlIcon type="pause" /> : <ControlIcon type="play" />}</button>
              <button className="transport" onClick={() => playNext()} aria-label="Next song"><ControlIcon type="next" /></button>
            </div>

            <div className="volume-row">
              <button className="ghost sm icon-button" onClick={() => setVolume((prev) => clamp(prev - 10, 0, 100))} aria-label="Decrease volume"><ControlIcon type="minus" /></button>
              <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" />
              <button className="ghost sm icon-button" onClick={() => setVolume((prev) => clamp(prev + 10, 0, 100))} aria-label="Increase volume"><ControlIcon type="plus" /></button>
            </div>

            <div className="player-box">
              <div ref={playerContainerRef} className="youtube-player" aria-label="YouTube player" />
            </div>
          </div>

          <aside className="conversation-panel card-panel" aria-live="polite">
            <div className="section-head">
              <h3>Velora</h3>
              <span>Live</span>
            </div>

            <div className="conversation-panel-body">
              <div className="conversation-list">
                {messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}
                {busy && <div className="bubble assistant typing"><i /><i /><i /></div>}
              </div>

              {stt.listening && (
                <div className="listen-inline">
                  <Waveform active />
                  <p>{stt.transcript || 'Listening…'}</p>
                </div>
              )}
            </div>
          </aside>
        </section>

        <footer className="dock">
          {playerError && <div className="error" role="alert">{playerError}</div>}
          {stt.error && (
            <div className="error" role="alert">{stt.error}<button onClick={() => stt.setError('')}>Dismiss</button></div>
          )}
          {stt.listening && (
            <div className="listen">
              <Waveform active />
              <p>{stt.transcript || 'Listening…'}</p>
              <button className="link" onClick={stt.cancel}>Cancel</button>
            </div>
          )}

          <form className="bar" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say or type a song name…" disabled={stt.listening} />
            <MicButton listening={stt.listening} busy={busy} speaking={tts.speaking} onClick={onMic} />
          </form>
          {tts.speaking && <button className="link center" onClick={tts.cancel}>Stop speaking</button>}
          <div ref={endRef} />
        </footer>
      </main>
    </div>
  );
}
