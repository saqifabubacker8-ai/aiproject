export default function Filters({ filters, onChange }) {
  const exact = filters.maxMinutes || filters.minMinutes;
  const exactLabel = filters.maxMinutes && filters.minMinutes
    ? `${filters.minMinutes}–${filters.maxMinutes} min`
    : filters.maxMinutes ? `Under ${filters.maxMinutes} min` : `Over ${filters.minMinutes} min`;

  return (
    <div className="filters">
      <label>Sort
        <select value={filters.order} onChange={(e) => onChange({ order: e.target.value })}>
          <option value="relevance">Relevance</option>
          <option value="date">Upload date</option>
          <option value="viewCount">View count</option>
          <option value="rating">Rating</option>
        </select>
      </label>
      <label>Uploaded
        <select value={filters.uploadDate} onChange={(e) => onChange({ uploadDate: e.target.value })}>
          <option value="any">Any time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </select>
      </label>
      <label>Length
        <select
          value={exact ? 'any' : filters.duration}
          onChange={(e) => onChange({ duration: e.target.value, maxMinutes: null, minMinutes: null })}
        >
          <option value="any">Any</option>
          <option value="short">Under 4 min</option>
          <option value="medium">4–20 min</option>
          <option value="long">Over 20 min</option>
        </select>
      </label>
      {exact && (
        <button className="chip" onClick={() => onChange({ maxMinutes: null, minMinutes: null })}>
          {exactLabel} ✕
        </button>
      )}
      {filters.language && (
        <button className="chip" onClick={() => onChange({ language: null })}>
          Language: {filters.language} ✕
        </button>
      )}
    </div>
  );
}
