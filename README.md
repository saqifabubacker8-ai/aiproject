# VoiceTube AI

Speak naturally, get YouTube videos. React + Vite frontend, Node/Express backend, and a built-in JavaScript intent parser.

## Architecture

```
Browser (React)                         Express server                          External
┌───────────────────────┐   text    ┌───────────────────────────────┐
│ Web Speech API (STT)  │──────────▶│ POST /api/assistant            │
│ SpeechSynthesis (TTS) │◀──────────│ services/ai.js (local JS NLP) │──▶ YouTube Data API v3
│ Chat, filters, cards  │  reply +  │ services/youtube.js            │
└───────────────────────┘  videos   │ POST /api/search (filters)    │
                                    └───────────────────────────────┘
```

- No Anthropic API key is required. The backend parses commands locally in JavaScript.
- API keys live only in `server/.env`; the browser never sees them.
- The client sends the last few messages plus the current search state, so follow-ups like
  "only in Tamil" or "under 15 minutes" refine the current search.
- Exact duration limits (for example, under 15 minutes) are enforced server-side by reading each video's real length.

## Project structure

```
voicetube-ai/
├── package.json              root scripts (install:all, dev)
├── server/
│   ├── index.js              Express routes
│   ├── services/ai.js        local natural-language query parser
│   ├── services/youtube.js   YouTube search + duration/stat enrichment
│   ├── .env.example          template environment file
│   └── .env                  local secrets (not committed)
├── client/
│   ├── vite.config.js        dev proxy /api → :5000 (port 5174)
│   └── src/
│       ├── App.jsx           conversation state and layout
│       ├── styles.css
│       ├── hooks/            useSpeechRecognition, useSpeechSynthesis
│       ├── utils/commands.js pure voice-command helper (unit-tested)
│       └── components/       MicButton, Waveform, VideoCard, Filters
└── README.md
```

## Setup

Requires Node.js 18.11+ and Chrome, Edge or Safari (Firefox has no speech recognition; typing still works).

1. **Get a YouTube key**
   - Google Cloud Console → create a project → enable *YouTube Data API v3* → create an API key.
2. **Install dependencies**
   ```bash
   npm install
   npm run install:all
   ```
3. **Configure environment**
   ```bash
   cp server/.env.example server/.env
   ```
   Then update `server/.env` and paste your YouTube API key.
4. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:5174, allow the microphone, tap the mic and speak.

Run the tests with `npm --prefix server test`.

Check `http://localhost:5000/api/health` to confirm the backend and YouTube configuration are active.

## Voice command examples

Tap the mic to start listening and tap again to stop. Every finished phrase is sent, so you can say any of these:

- "Play Starboy", "Pause", "Resume", "Next song", "Previous song", "Volume up", "Volume down"

- "Search for Python tutorials for beginners"
- "Find Tamil videos about machine learning"
- "Only show videos under 15 minutes"
- "Latest React review videos"
- "Sort by view count"
- "This week only, in Tamil"

## Notes

- Microphone access needs `localhost` or HTTPS.
- Chrome's speech recognition sends audio to Google's servers, so it needs internet.
- Each search costs about 101 YouTube quota units (of 10,000 per day by default).
- Change the recognition language in `client/src/App.jsx` (`lang: 'en-IN'`).
- To deploy: `npm --prefix client run build`, serve `client/dist` from any static host, and set
  `CLIENT_ORIGIN` on the server (or add a reverse proxy for `/api`).
- The backend does not require any Anthropic API key; local JavaScript command parsing handles natural-language search and filters.
