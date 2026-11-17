const fmtDuration = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};
const fmtViews = (n) => Intl.NumberFormat('en', { notation: 'compact' }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export default function VideoCard({ video, onPlay }) {
  return (
    <article className="card">
      <button className="thumb" onClick={() => onPlay(video)} aria-label={`Play ${video.title}`}>
        <img src={video.thumbnail} alt="" loading="lazy" />
        <span className="dur">{fmtDuration(video.durationSeconds)}</span>
        <span className="play">▶</span>
      </button>
      <div className="meta">
        <h3>{video.title}</h3>
        <p className="chan">{video.channel}</p>
        <p className="sub">{fmtViews(video.views)} views · {fmtDate(video.publishedAt)}</p>
        <p className="desc">{video.description}</p>
        <a href={video.url} target="_blank" rel="noreferrer">Open on YouTube</a>
      </div>
    </article>
  );
}
