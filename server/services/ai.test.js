import test from 'node:test';
import assert from 'node:assert/strict';

import { understand } from './ai.js';
import { searchVideos, expandSearchQueries } from './youtube.js';
import { TAMIL_SONG_DATABASE } from './tamilSongDatabase.js';
import { shouldDispatchCommand } from '../../client/src/utils/speechGuard.js';

test('understand parses a Tamil video search without Anthropic', async () => {
  const result = await understand('find the latest Tamil videos under 15 minutes about machine learning', [], null);

  assert.equal(result.action, 'search');
  assert.equal(result.query, 'machine learning');
  assert.equal(result.filters.language, 'ta');
  assert.equal(result.filters.order, 'date');
  assert.equal(result.filters.maxMinutes, 15);
  assert.equal(result.filters.uploadDate, 'any');
  assert.match(result.reply, /machine learning/i);
});

test('understand refines an existing search with a new filter', async () => {
  const result = await understand('only this week and sort by popularity', [
    { role: 'user', text: 'find Tamil videos about React' },
    { role: 'assistant', text: 'Here are React videos in Tamil.' }
  ], {
    query: 'React',
    filters: { language: 'ta', order: 'relevance', uploadDate: 'any', duration: 'any', maxMinutes: null, minMinutes: null },
  });

  assert.equal(result.action, 'refine');
  assert.equal(result.filters.uploadDate, 'week');
  assert.equal(result.filters.order, 'viewCount');
  assert.equal(result.filters.language, 'ta');
});

test('shouldDispatchCommand accepts any real spoken command, not just "play"', () => {
  assert.equal(shouldDispatchCommand(''), false);
  assert.equal(shouldDispatchCommand('   '), false);
  assert.equal(shouldDispatchCommand('.'), false);
  assert.equal(shouldDispatchCommand('play arabic kuthu'), true);
  assert.equal(shouldDispatchCommand('pause the song'), true);
  assert.equal(shouldDispatchCommand('only under 15 minutes'), true);
});

test('understand handles direct music playback commands', async () => {
  const result = await understand('Play Arabic Kuthu.', [], null);

  assert.equal(result.action, 'play');
  assert.equal(result.query, 'Arabic Kuthu');
  assert.match(result.reply, /Arabic Kuthu/i);
});

test('understand recognizes audio controls and Tamil voice cues', async () => {
  const pause = await understand('Pause the song.', [], null);
  const volume = await understand('Increase volume.', [], null);
  const tamil = await understand('Play Tamil love songs.', [], null);

  assert.equal(pause.action, 'pause');
  assert.equal(volume.action, 'volume');
  assert.equal(tamil.action, 'play');
  assert.equal(tamil.filters.language, 'ta');
  assert.match(tamil.query, /love songs/i);
});

test('searchVideos ignores non-embeddable YouTube results', async () => {
  process.env.YOUTUBE_API_KEY = 'test-key';
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    if (String(url).includes('/search?')) {
      return {
        ok: true,
        json: async () => ({
          items: [
            { id: { videoId: 'embeddableId' }, snippet: { title: 'Playable Song', channelTitle: 'Demo', description: 'x', thumbnails: { high: { url: 'x' } }, publishedAt: '2024-01-01T00:00:00Z' } },
            { id: { videoId: 'blockedId' }, snippet: { title: 'Blocked Song', channelTitle: 'Demo', description: 'x', thumbnails: { high: { url: 'x' } }, publishedAt: '2024-01-01T00:00:00Z' } },
          ]
        })
      };
    }

    if (String(url).includes('/videos?')) {
      return {
        ok: true,
        json: async () => ({
          items: [
            { id: 'embeddableId', contentDetails: { duration: 'PT3M20S' }, statistics: { viewCount: '1000' }, status: { embeddable: true, privacyStatus: 'public' } },
            { id: 'blockedId', contentDetails: { duration: 'PT4M00S' }, statistics: { viewCount: '500' }, status: { embeddable: false, privacyStatus: 'public' } },
          ]
        })
      };
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const videos = await searchVideos({ query: 'playable song', filters: {} });
    assert.equal(videos.length, 1);
    assert.equal(videos[0].id, 'embeddableId');
  } finally {
    global.fetch = originalFetch;
  }
});

test('song titles that contain control words are not hijacked', async () => {
  for (const [say, query] of [
    ['Play Stop Crying Your Heart Out', 'Stop Crying Your Heart Out'],
    ['Play Hold On', 'Hold On'],
    ['Play Go Back to You', 'Go Back to You'],
    ['Play Turn Up the Music', 'Turn Up the Music'],
    ['Play Shape of You', 'Shape of You'],
    ['Play Take On Me', 'Take On Me'],
    ['Play 7 Years', '7 Years'],
  ]) {
    const r = await understand(say, [], null);
    assert.equal(r.action, 'play', say);
    assert.equal(r.query, query, say);
  }
});

test('greeting words inside a title do not trigger chat', async () => {
  assert.equal((await understand('Hey Jude', [], null)).action, 'search');
  assert.equal((await understand('hello', [], null)).action, 'chat');
  assert.equal((await understand('thanks', [], null)).action, 'chat');
});

test('volume direction is reported', async () => {
  assert.equal((await understand('Increase volume', [], null)).direction, 'up');
  assert.equal((await understand('Turn the volume down', [], null)).direction, 'down');
});

test('transport controls are recognised and keep the current search', async () => {
  const state = { query: 'Starboy', filters: { duration: 'any', maxMinutes: null, minMinutes: null, order: 'relevance', uploadDate: 'any', language: null } };
  for (const [say, action] of [['Pause', 'pause'], ['resume', 'resume'], ['play the next song', 'next'], ['previous song', 'previous'], ['skip', 'next']]) {
    const r = await understand(say, [], state);
    assert.equal(r.action, action, say);
    assert.equal(r.query, 'Starboy', say);
  }
});

test('a new play request does not inherit old filters or language', async () => {
  const state = { query: 'jazz', filters: { duration: 'any', maxMinutes: 15, minMinutes: null, order: 'date', uploadDate: 'week', language: 'ta' } };
  const r = await understand('Play Starboy', [], state);
  assert.equal(r.action, 'play');
  assert.equal(r.filters.maxMinutes, null);
  assert.equal(r.filters.language, null);
  assert.equal(r.filters.uploadDate, 'any');
});

test('refining keeps earlier filters that were not mentioned', async () => {
  const state = { query: 'React', filters: { duration: 'any', maxMinutes: null, minMinutes: null, order: 'date', uploadDate: 'week', language: 'ta' } };
  const r = await understand('under 15 minutes', [], state);
  assert.equal(r.action, 'refine');
  assert.equal(r.query, 'React');
  assert.equal(r.filters.maxMinutes, 15);
  assert.equal(r.filters.uploadDate, 'week');
  assert.equal(r.filters.order, 'date');
  assert.equal(r.filters.language, 'ta');
});

test('a fresh search does not inherit the previous duration limit', async () => {
  const state = { query: 'React', filters: { duration: 'any', maxMinutes: 15, minMinutes: null, order: 'relevance', uploadDate: 'any', language: null } };
  const r = await understand('find jazz piano videos', [], state);
  assert.equal(r.action, 'search');
  assert.equal(r.query, 'jazz piano');
  assert.equal(r.filters.maxMinutes, null);
});

test('"short"/"long" inside a title is not treated as a duration filter', async () => {
  const r = await understand('find Long Live by Taylor Swift', [], null);
  assert.equal(r.filters.maxMinutes, null);
  assert.equal(r.filters.minMinutes, null);
  assert.match(r.query, /Long Live/);
});

test('searchVideos drops invalid YouTube filter values before calling the API', async () => {
  const originalFetch = global.fetch;
  const seen = [];

  global.fetch = async (url) => {
    seen.push(String(url));
    if (String(url).includes('/search?')) {
      return {
        ok: true,
        json: async () => ({ items: [] }),
      };
    }
    if (String(url).includes('/videos?')) {
      return {
        ok: true,
        json: async () => ({ items: [] }),
      };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    await searchVideos({
      query: 'Arabic Kuthu',
      filters: {
        duration: 'bogus',
        order: 'bogus-order',
        uploadDate: 'bogus-date',
        language: 'ta',
      },
    });
  } finally {
    global.fetch = originalFetch;
  }

  const searchUrl = seen.find((u) => u.includes('/search?'));
  assert.ok(searchUrl);
  assert.doesNotMatch(searchUrl, /videoDuration=bogus|order=bogus-order|publishedAfter=/);
  assert.match(searchUrl, /relevanceLanguage=ta/);
});

test('searchVideos caps search fan-out to avoid quota exhaustion', async () => {
  process.env.YOUTUBE_API_KEY = 'test-key';
  const originalFetch = global.fetch;
  const searchCalls = [];

  global.fetch = async (url) => {
    const urlString = String(url);
    searchCalls.push(urlString);

    if (urlString.includes('/search?')) {
      return {
        ok: true,
        json: async () => ({
          items: [{
            id: { videoId: 'demo-video-1' },
            snippet: {
              title: 'Demo Song',
              channelTitle: 'Demo',
              description: 'Example',
              thumbnails: { high: { url: 'https://example.com/thumb.jpg' } },
              publishedAt: '2024-01-01T00:00:00Z',
            },
          }],
        }),
      };
    }

    if (urlString.includes('/videos?')) {
      return {
        ok: true,
        json: async () => ({
          items: [{
            id: 'demo-video-1',
            contentDetails: { duration: 'PT3M20S' },
            statistics: { viewCount: '9000' },
            status: { embeddable: true, privacyStatus: 'public' },
          }],
        }),
      };
    }

    throw new Error(`Unexpected fetch URL: ${urlString}`);
  };

  try {
    const videos = await searchVideos({ query: 'vaathi coming', filters: {} });
    assert.equal(videos.length, 1);
    assert.ok(searchCalls.filter((u) => u.includes('/search?')).length <= 3, 'search fan-out should be capped');
  } finally {
    global.fetch = originalFetch;
  }
});

test('Tanglish and Tamil song titles expand into stronger search variants', () => {
  assert.ok(expandSearchQueries('vaathi coming').includes('Vaathi Coming'));
  assert.ok(expandSearchQueries('vathi coming').includes('Vaathi Coming'));
  assert.ok(expandSearchQueries('why this kolaveri').includes('Why This Kolaveri'));
  assert.ok(expandSearchQueries('rowdy baby').includes('Rowdy Baby'));
  assert.ok(expandSearchQueries('arabic kuthu').includes('Arabic Kuthu'));
  assert.ok(TAMIL_SONG_DATABASE.length >= 1000);
});
