const DEFAULT_FILTERS = {
  duration: 'any',
  maxMinutes: null,
  minMinutes: null,
  order: 'relevance',
  uploadDate: 'any',
  language: null,
};

const LANGUAGE_MAP = {
  tamil: 'ta',
  english: 'en',
  hindi: 'hi',
  telugu: 'te',
  malayalam: 'ml',
  kannada: 'kn',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  japanese: 'ja',
  korean: 'ko',
};

const LANGUAGE_LABEL = {
  ta: 'Tamil',
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
};

const normalize = (value = '') => value.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();

const mergeFilters = (base = {}, patch = {}) => ({
  ...DEFAULT_FILTERS,
  ...base,
  ...patch,
});

function detectLanguage(text) {
  const lower = text.toLowerCase();
  for (const [name, code] of Object.entries(LANGUAGE_MAP)) {
    const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(lower)) return code;
  }
  return null;
}

function removeLanguageText(text, language) {
  if (!language) return text;
  const labels = Object.keys(LANGUAGE_MAP).filter((word) => word.length > 1).sort((a, b) => b.length - a.length);
  let result = text;
  for (const label of labels) {
    const pattern = new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (pattern.test(result)) result = result.replace(pattern, ' ');
  }
  return result;
}

function detectOrder(text) {
  const lower = text.toLowerCase();
  if (/\b(?:latest|newest|most recent)\b|\brecent\b/.test(lower)) return 'date';
  if (/most popular|popular|most viewed|view count|by views|top viewed|trending/.test(lower)) return 'viewCount';
  if (/highest rated|top rated|\brating\b|most rated/.test(lower)) return 'rating';
  return null;
}

function detectUploadDate(text) {
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower)) return 'today';
  if (/\b(?:this|last|past)\s+week\b/.test(lower)) return 'week';
  if (/\b(?:this|last|past)\s+month\b/.test(lower)) return 'month';
  if (/\b(?:this|last|past)\s+year\b/.test(lower)) return 'year';
  return null;
}

// Returns only what the message itself asks for (null = nothing said), so callers decide
// whether to inherit the previous filters (refine) or start clean (new search).
function detectDuration(text) {
  const lower = text.toLowerCase();
  const unit = '(?:min|mins|minute|minutes)';

  const range = lower.match(new RegExp(`between\\s+(\\d+)\\s*(?:and|to|-)\\s*(\\d+)\\s*${unit}`));
  if (range) {
    const [a, b] = [Number(range[1]), Number(range[2])].sort((x, y) => x - y);
    return { duration: 'any', minMinutes: a, maxMinutes: b };
  }

  const under = lower.match(new RegExp(`(?:under|less than|shorter than|up to|within|below)\\s+(\\d+)\\s*${unit}`));
  if (under) {
    return { duration: Number(under[1]) <= 4 ? 'short' : 'any', minMinutes: null, maxMinutes: Number(under[1]) };
  }

  const over = lower.match(new RegExp(`(?:over|more than|longer than|at least|above)\\s+(\\d+)\\s*${unit}`));
  if (over) {
    return { duration: Number(over[1]) >= 20 ? 'long' : 'any', minMinutes: Number(over[1]), maxMinutes: null };
  }

  // "short/medium/long" only count when they describe the results, not a song title ("Long Live").
  const kind = lower.match(/\b(short|medium|long)\s+(?:videos?|clips?|ones?|songs?|tracks?)\b/);
  if (kind) {
    if (kind[1] === 'short') return { duration: 'short', minMinutes: null, maxMinutes: 4 };
    if (kind[1] === 'medium') return { duration: 'medium', minMinutes: 4, maxMinutes: 20 };
    return { duration: 'long', minMinutes: 20, maxMinutes: null };
  }

  return null;
}

// Removes filter phrases and command filler, but keeps the real words of a title
// ("Shape of You", "Take On Me", "7 Years" must survive).
function stripQueryNoise(text) {
  let t = normalize(text).replace(/[.!?]+$/, '');
  const unit = '(?:min|mins|minute|minutes|hours?)';

  t = t
    .replace(new RegExp(`\\b(?:between)\\s+\\d+\\s*(?:and|to|-)\\s*\\d+\\s*${unit}\\b`, 'gi'), ' ')
    .replace(new RegExp(`\\b(?:under|over|less than|more than|longer than|shorter than|at least|at most|up to|within|below|above)\\s+\\d+\\s*${unit}\\b`, 'gi'), ' ')
    .replace(/\b(?:uploaded\s+)?(?:today|(?:this|last|past)\s+(?:week|month|year))\b/gi, ' ')
    .replace(/\b(?:sort(?:ed)?|order(?:ed)?)\s+by\s+(?:upload\s+date|view\s+count|views|popularity|date|rating|relevance|newest|latest)\b/gi, ' ')
    .replace(/\b(?:newest|latest|most recent|oldest)\s+first\b/gi, ' ')
    .replace(/\b(?:most popular|most viewed|highest rated|top rated|most recent|latest|newest)\b/gi, ' ')
    .replace(/\b(?:videos?|clips?)\b/gi, ' ');

  // Leading command words only ("find", "search for", "can you play" ...).
  t = t.replace(/^\s*(?:(?:hey|hi|please|can you|could you|would you|i want to|i'd like to)\s+)*(?:find|show|search(?:\s+for)?|look\s+for|watch|play|get|give)(?:\s+me)?\s+/i, ' ');

  t = t.replace(/\b(?:only|just)\b/gi, ' ');
  t = t.replace(/[^\p{L}\p{N}\s'&-]/gu, ' ').replace(/\s+/g, ' ').trim();

  // Dangling connectors left at the edges after the removals above.
  let prev;
  do {
    prev = t;
    t = t.replace(/^(?:about|on|for|of|some|the|a|an|in|with|from|by|and|me|please)\s+/i, '')
         .replace(/\s+(?:about|on|for|of|in|with|from|by|and|the|a|an)$/i, '')
         .trim();
  } while (t !== prev);

  return t;
}

function buildReply(query, filters, action = 'search') {
  if (action === 'chat') {
    return 'I can play songs and search YouTube by topic, language, duration, upload date and sort order. Try “play Starboy”.';
  }
  if (action === 'clarify') {
    return 'What would you like to watch?';
  }
  if (action === 'play') {
    return query ? `Playing ${query} on YouTube.` : 'Playing your track now.';
  }

  const languageName = filters.language ? LANGUAGE_LABEL[filters.language] || filters.language : '';
  const languagePrefix = languageName ? `${languageName} ` : '';
  const target = query ? `${languagePrefix}${query}` : 'videos';
  return `Here are ${target}.`;
}

const CHAT_ONLY = /^(?:hi|hello|hey|hey there|good morning|good evening|good afternoon|thanks|thank you|help|what can you do|what are you able to do)$/i;

function decideAction(message, state) {
  const lower = normalize(message).toLowerCase().replace(/[.!?,]+$/g, '');
  if (CHAT_ONLY.test(lower)) return 'chat'; // whole message only, so "Hey Jude" or "Hello" by Adele still search

  if (!state) return 'search';

  const refineSignals = /\b(only|just|under|over|less than|more than|at least|at most|today|this week|this month|this year|last week|last month|last year|sort|order|language|Tamil|English|Hindi|Malayalam|Kannada|Telugu|from this|by views|popular|latest|newest|recent)\b/i;
  const startsWithSearch = /^(find|search|show|look for|watch|play)\b/i.test(lower);

  if (refineSignals.test(lower) && !startsWithSearch) return 'refine';
  return 'search';
}

// Playback controls must be the WHOLE utterance. Matching words anywhere would hijack song
// titles such as "Stop Crying Your Heart Out", "Hold On", "Go Back to You" or "Turn Up the Music".
function detectControlAction(text) {
  const lower = normalize(text)
    .toLowerCase()
    .replace(/[.!?,]+$/g, '')
    .replace(/^(?:(?:hey|hi|please|can you|could you|would you)\s+)+/, '')
    .replace(/\s+please$/, '')
    .trim();

  const thing = '(?:the\\s+|this\\s+)?(?:song|music|track|video|playback|it)';
  const is = (re) => new RegExp(`^(?:${re})$`).test(lower);

  if (is(`(?:pause|stop|hold on|hold)(?:\\s+${thing})?`)) {
    return { action: 'pause', reply: 'Paused.' };
  }
  if (is(`(?:resume|continue|unpause|start again|keep playing|play)(?:\\s+${thing})?`)) {
    return { action: 'resume', reply: 'Resuming.' };
  }
  if (is(`(?:play\\s+)?(?:the\\s+)?next(?:\\s+(?:song|track|one|video))?|skip(?:\\s+(?:to\\s+(?:the\\s+)?next|${thing}))?(?:\\s+(?:song|track))?`)) {
    return { action: 'next', reply: 'Playing the next song.' };
  }
  if (is(`(?:play\\s+)?(?:the\\s+)?previous(?:\\s+(?:song|track|one|video))?|go back(?:\\s+(?:a|one)\\s+(?:song|track))?`)) {
    return { action: 'previous', reply: 'Playing the previous song.' };
  }
  if (is('(?:increase|raise|turn up|bump up)(?:\\s+the)?\\s+volume|turn(?:\\s+the)?\\s+volume\\s+up|volume\\s+up|turn\\s+it\\s+up|(?:make\\s+it\\s+)?louder')) {
    return { action: 'volume', direction: 'up', reply: 'Volume increased.' };
  }
  if (is('(?:decrease|lower|reduce|turn down)(?:\\s+the)?\\s+volume|turn(?:\\s+the)?\\s+volume\\s+down|volume\\s+down|turn\\s+it\\s+down|(?:make\\s+it\\s+)?quieter')) {
    return { action: 'volume', direction: 'down', reply: 'Volume decreased.' };
  }
  if (/^(?:play|listen to|queue|open)\s+\S/.test(lower)) {
    return { action: 'play', reply: '' };
  }

  return null;
}

// Gentle clean-up for "play ..." requests: drop the command and any language word,
// but leave the title itself untouched.
function cleanPlayQuery(text, language) {
  return removeLanguageText(normalize(text), language)
    .replace(/[.!?]+$/, '')
    .replace(/^\s*(?:(?:hey|hi|please|can you|could you|would you)\s+)*(?:play|listen to|queue|open)\s+/i, '')
    .replace(/^(?:some|me)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function understand(message, history = [], state = null) {
  const raw = normalize(message || '');
  if (!raw) {
    return { action: 'clarify', query: '', filters: DEFAULT_FILTERS, reply: 'What would you like to watch?' };
  }

  const previousQuery = state?.query || '';
  const previousFilters = state?.filters || {};
  const currentFilters = mergeFilters(DEFAULT_FILTERS, previousFilters);
  const directControl = detectControlAction(raw);

  if (directControl) {
    // Pause / resume / next / previous / volume: leave the current search exactly as it is.
    if (directControl.action !== 'play') {
      return {
        action: directControl.action,
        direction: directControl.direction,
        query: previousQuery,
        filters: currentFilters,
        reply: directControl.reply,
      };
    }

    // A new "play ..." request starts clean: it must not inherit old duration/date filters.
    const language = detectLanguage(raw);
    const query = cleanPlayQuery(raw, language) || previousQuery || 'music';
    const nextFilters = mergeFilters(DEFAULT_FILTERS, { language });

    return {
      action: 'play',
      query,
      filters: nextFilters,
      reply: buildReply(query, nextFilters, 'play'),
    };
  }

  const startAction = decideAction(raw, state);

  if (startAction === 'chat') {
    return { action: 'chat', query: previousQuery, filters: currentFilters, reply: buildReply('', currentFilters, 'chat') };
  }

  const refining = Boolean(state) && startAction === 'refine';
  const detectedLanguage = detectLanguage(raw);
  const cleaned = removeLanguageText(raw, detectedLanguage);
  const query = stripQueryNoise(cleaned);

  const uploadDate = detectUploadDate(cleaned);
  const duration = detectDuration(cleaned);
  const order = detectOrder(cleaned);

  if (refining) {
    // Refinements change only what was mentioned; everything else carries over.
    const merged = mergeFilters(currentFilters, {
      ...(duration || {}),
      ...(order ? { order } : {}),
      ...(uploadDate ? { uploadDate } : {}),
      ...(detectedLanguage ? { language: detectedLanguage } : {}),
    });
    const finalQuery = query || previousQuery;
    if (!finalQuery) {
      return { action: 'clarify', query: '', filters: DEFAULT_FILTERS, reply: buildReply('', DEFAULT_FILTERS, 'clarify') };
    }
    return { action: 'refine', query: finalQuery, filters: merged, reply: buildReply(finalQuery, merged, 'refine') };
  }

  // A brand-new search starts from default filters.
  const relevantHistory = (Array.isArray(history) ? history : []).filter((entry) => entry && typeof entry.text === 'string');
  const lastUserText = [...relevantHistory].reverse().find((entry) => entry.role === 'user')?.text || '';
  const finalQuery = query || (lastUserText ? stripQueryNoise(removeLanguageText(lastUserText, detectLanguage(lastUserText))) : '') || previousQuery;

  if (!finalQuery) {
    return { action: 'clarify', query: '', filters: DEFAULT_FILTERS, reply: buildReply('', DEFAULT_FILTERS, 'clarify') };
  }

  const nextFilters = mergeFilters(DEFAULT_FILTERS, {
    ...(duration || {}),
    ...(order ? { order } : {}),
    ...(uploadDate ? { uploadDate } : {}),
    language: detectedLanguage,
  });

  return { action: 'search', query: finalQuery, filters: nextFilters, reply: buildReply(finalQuery, nextFilters, 'search') };
}
