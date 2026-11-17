import { TAMIL_SONG_DATABASE, findBestSongMatch } from './tamilSongDatabase.js';

const BASE = 'https://www.googleapis.com/youtube/v3';
const MAX_SEARCH_VARIANTS = 3;
const SEARCH_CACHE = new Map();

const getYoutubeApiKeys = () => {
  const raw = process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || '';
  return [...new Set(String(raw)
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean))];
};

const TANGHISH_VARIANTS = [
  ['vaathi', ['vaathi', 'vathi', 'vaathy', 'vaati', 'vathi']],
  ['coming', ['coming', 'comin', 'comeing']],
  ['arabic', ['arabic', 'arabi']],
  ['kuthu', ['kuthu']],
  ['rowdy', ['rowdy']],
  ['baby', ['baby']],
  ['why', ['why']],
  ['this', ['this']],
  ['kolaveri', ['kolaveri', 'kolavari', 'kolaaveri', 'kolveri', 'kolavary']],
];

export function expandSearchQueries(rawQuery = '') {
  const base = String(rawQuery || '').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();
  if (!base) return [];

  const normalized = base.replace(/[\u2018\u2019]/g, "'").replace(/[^a-z0-9\s']/gi, ' ').replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  const variants = new Set([normalized]);

  const matchingSong = findBestSongMatch(base);
  if (matchingSong) {
    variants.add(matchingSong.title);
    for (const variant of matchingSong.variants || []) {
      if (variant && variant.length > 1) variants.add(variant);
    }
  }

  const canonicalTitle = (value) => value
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const titlePatterns = [
    { match: /^(?:vaathi|vathi|vaathy|vaati|vathi)\s+(?:coming|comin|comeing)$/i, canonical: 'Vaathi Coming' },
    { match: /^(?:arabic|arabi)\s+kuthu$/i, canonical: 'Arabic Kuthu' },
    { match: /^rowdy\s+baby$/i, canonical: 'Rowdy Baby' },
    { match: /^why\s+this\s+(?:kolaveri|kolavari|kolaaveri|kolveri|kolavary)$/i, canonical: 'Why This Kolaveri' },
  ];

  for (const entry of titlePatterns) {
    if (entry.match.test(normalized)) {
      variants.add(entry.canonical);
      variants.add(canonicalTitle(entry.canonical));
    }
  }

  const altered = lower.split(/\s+/).map((word) => {
    for (const [canonical, options] of TANGHISH_VARIANTS) {
      if (options.includes(word)) return canonical;
    }
    return word;
  }).join(' ');

  if (altered && altered !== lower) {
    variants.add(canonicalTitle(altered));
    variants.add(altered);
  }

  for (const item of [
    `${normalized} official`,
    `${normalized} lyrics`,
    `${normalized} song`,
    `${normalized} full song`,
    `${normalized} video`,
  ]) {
    variants.add(item.trim());
  }

  const ranked = [...variants].filter((value) => value && value.length > 1);
  return ranked.slice(0, MAX_SEARCH_VARIANTS);
}

const decode = (s = '') =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const isoToSeconds = (iso = '') => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
};

const publishedAfter = (range) => {
  const days = { today: 1, week: 7, month: 30, year: 365 }[range];
  return days ? new Date(Date.now() - days * 86400000).toISOString() : null;
};

const VALID_ORDERS = new Set(['date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount']);
const VALID_DURATIONS = new Set(['any', 'short', 'medium', 'long']);
const VALID_UPLOAD_DATES = new Set(['any', 'today', 'week', 'month', 'year']);

const sanitizeSearchFilters = (filters = {}) => {
  const { duration = 'any', order = 'relevance', uploadDate = 'any', language } = filters;
  const safeOrder = VALID_ORDERS.has(String(order)) ? String(order) : 'relevance';
  const safeDuration = VALID_DURATIONS.has(String(duration)) ? String(duration) : 'any';
  const safeUploadDate = VALID_UPLOAD_DATES.has(String(uploadDate)) ? String(uploadDate) : 'any';
  const safeLanguage = typeof language === 'string' && /^[a-z-]{2,10}$/i.test(language.trim())
    ? language.trim()
    : null;

  return {
    order: safeOrder,
    duration: safeDuration,
    uploadDate: safeUploadDate,
    language: safeLanguage,
    publishedAfter: safeUploadDate !== 'any' ? publishedAfter(safeUploadDate) : null,
    videoDuration: safeDuration !== 'any' ? safeDuration : null,
  };
};

async function yt(endpoint, params) {
  const keys = getYoutubeApiKeys();
  if (!keys.length) {
    throw Object.assign(new Error('YOUTUBE_API_KEY or YOUTUBE_API_KEYS is missing on the server.'), { status: 500 });
  }

  let lastError = null;
  for (const key of keys) {
    const url = `${BASE}/${endpoint}?${new URLSearchParams({ ...params, key })}`;
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = body.error?.errors?.[0]?.reason;
      const quotaExceeded = res.status === 429 || reason === 'quotaExceeded' || String(body.error?.message || '').toLowerCase().includes('quota exceeded');
      lastError = { res, body };
      if (quotaExceeded && keys.length > 1) continue;
      const msg = reason === 'quotaExceeded'
        ? 'YouTube API daily quota exceeded. Try again tomorrow.'
        : `YouTube API error: ${body.error?.message || res.statusText}`;
      throw Object.assign(new Error(msg), { status: res.status === 403 ? 429 : 502 });
    }
    return body;
  }

  const { res, body } = lastError || {};
  const reason = body?.error?.errors?.[0]?.reason;
  const msg = reason === 'quotaExceeded'
    ? 'YouTube API daily quota exceeded. Try again tomorrow.'
    : `YouTube API error: ${body?.error?.message || res?.statusText || 'Request failed.'}`;
  throw Object.assign(new Error(msg), { status: res?.status === 403 ? 429 : 502 });
}

export async function searchVideos({ query, filters = {} }) {
  const { maxMinutes, minMinutes } = filters;
  const exactDuration = Boolean(maxMinutes || minMinutes);
  const safeFilters = sanitizeSearchFilters(filters);
  const cacheKey = JSON.stringify({
    query: String(query || '').trim().toLowerCase(),
    filters: {
      ...safeFilters,
      maxMinutes: maxMinutes ?? null,
      minMinutes: minMinutes ?? null,
    },
  });

  if (SEARCH_CACHE.has(cacheKey)) {
    return SEARCH_CACHE.get(cacheKey);
  }

  const searchQueries = expandSearchQueries(query);
  const collected = [];
  const seen = new Set();

  if (TAMIL_SONG_DATABASE.length) {
    const bestSong = findBestSongMatch(query);
    if (bestSong && !searchQueries.includes(bestSong.title)) {
      searchQueries.unshift(bestSong.title);
    }
  }

  for (const searchQuery of searchQueries.slice(0, MAX_SEARCH_VARIANTS)) {
    const params = {
      part: 'snippet',
      type: 'video',
      q: searchQuery,
      maxResults: exactDuration ? '40' : '12',
      order: safeFilters.order,
      safeSearch: 'moderate',
    };
    if (!exactDuration && safeFilters.videoDuration) params.videoDuration = safeFilters.videoDuration;
    if (safeFilters.language) params.relevanceLanguage = safeFilters.language;
    if (safeFilters.publishedAfter) params.publishedAfter = safeFilters.publishedAfter;

    const found = await yt('search', params);
    for (const item of found.items || []) {
      const id = item?.id?.videoId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      collected.push(item);
    }
  }

  const ids = collected.map((i) => i.id.videoId).filter(Boolean);
  if (!ids.length) {
    SEARCH_CACHE.set(cacheKey, []);
    return [];
  }

  const details = await yt('videos', { part: 'contentDetails,statistics,status', id: ids.join(',') });
  const info = Object.fromEntries((details.items || []).map((v) => [v.id, v]));

  const results = collected
    .filter((i) => info[i.id.videoId])
    .map((i) => {
      const v = info[i.id.videoId];
      const s = i.snippet;
      return {
        id: i.id.videoId,
        title: decode(s.title),
        channel: decode(s.channelTitle),
        description: decode(s.description),
        publishedAt: s.publishedAt,
        thumbnail: s.thumbnails?.high?.url || s.thumbnails?.medium?.url,
        durationSeconds: isoToSeconds(v.contentDetails.duration),
        views: Number(v.statistics?.viewCount || 0),
        url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
        embeddable: v.status?.embeddable !== false,
      };
    })
    .filter((v) => v.embeddable)
    .filter((v) => (!maxMinutes || v.durationSeconds <= maxMinutes * 60) &&
                   (!minMinutes || v.durationSeconds >= minMinutes * 60))
    .slice(0, 12);

  SEARCH_CACHE.set(cacheKey, results);
  return results;
}
