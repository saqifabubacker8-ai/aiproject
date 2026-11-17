import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { understand } from './services/ai.js';
import { searchVideos } from './services/youtube.js';

const app = express();
// Comma-separated list; defaults cover Vite's usual dev ports.
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

const fail = (res, e) => {
  console.error(e.message);
  res.status(e.status || 500).json({ error: e.message || 'Something went wrong.' });
};

// Natural-language command -> intent -> (optional) YouTube search
app.post('/api/assistant', async (req, res) => {
  try {
    const { message, history, state = null } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message is required.' });

    const safeHistory = Array.isArray(history) ? history.slice(-8) : [];
    const intent = await understand(message.trim(), safeHistory, state);

    if (intent.action === 'search' || intent.action === 'refine' || intent.action === 'play') {
      if (!intent.query) {
        return res.json({ action: 'clarify', reply: 'What would you like to watch?', state, videos: null, video: null });
      }
      const newState = { query: intent.query, filters: intent.filters };
      const videos = await searchVideos(newState);
      const reply = videos.length
        ? intent.reply
        : `I couldn't find any videos for "${intent.query}" with those filters. Try loosening them.`;
      return res.json({
        action: intent.action,
        reply,
        state: newState,
        videos,
        video: videos[0] || null,
      });
    }

    if (['pause', 'resume', 'next', 'previous', 'volume'].includes(intent.action)) {
      return res.json({ action: intent.action, direction: intent.direction, reply: intent.reply, state, videos: null, video: null });
    }

    // clarify / chat: keep existing results untouched
    res.json({ action: intent.action, reply: intent.reply, state, videos: null, video: null });
  } catch (e) {
    fail(res, e);
  }
});

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
    ai: true,
    parser: 'local-js',
  })
);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`VoiceTube API listening on http://localhost:${port}`));
