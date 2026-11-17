export default function MicButton({ listening, busy, speaking, onClick }) {
  const state = listening ? 'listening' : busy ? 'busy' : speaking ? 'speaking' : '';
  return (
    <button
      className={`mic ${state}`}
      onClick={onClick}
      aria-label={listening ? 'Stop listening and send what I said' : 'Start voice input'}
      disabled={busy}
    >
      <span className="ring" /><span className="ring r2" />
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {listening
          ? <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
          : <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>}
      </svg>
    </button>
  );
}
