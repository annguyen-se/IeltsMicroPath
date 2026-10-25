/**
 * TTS Hybrid Service
 *
 * Tier 1 — Kokoro-FastAPI (local Docker, batch pre-generation):
 *   docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi:latest
 *   POST {KOKORO_TTS_URL} { model, voice, input, response_format: 'mp3' }
 *
 * Tier 2 — edge-tts (Microsoft Edge Read Aloud, free realtime fallback)
 *   via npm `msedge-tts`; used when Kokoro is unreachable or for
 *   on-demand synthesis of lessons without pre-generated audio.
 *
 * Generated files live in backend/public/audio/<slug>.mp3 and are served
 * by express.static at {AUDIO_BASE_URL}/audio/<slug>.mp3.
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const AppError = require('../utils/appError');

const AUDIO_DIR = path.resolve(__dirname, '../../public/audio');
const FRONTEND_AUDIO_DIR = path.resolve(__dirname, '../../../frontend/public/audio');

const ensureAudioDir = () => {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(FRONTEND_AUDIO_DIR)) {
    fs.mkdirSync(FRONTEND_AUDIO_DIR, { recursive: true });
  }
  return AUDIO_DIR;
};

/** Strip markdown / stage directions so the voice only reads spoken lines. */
const cleanTranscriptForSpeech = (raw = '') =>
  raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>|]/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const estimateDurationSeconds = (text = '') => {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60); // ~150 wpm for IELTS pace
};

/** Tier 1: synthesize via local Kokoro-FastAPI (OpenAI-compatible). */
const synthesizeWithKokoro = async (text, { voice = env.ttsVoiceKokoro } = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(env.kokoroTtsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kokoro',
        voice,
        input: text,
        response_format: 'mp3',
        speed: 1.0,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Kokoro responded ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) {
      throw new Error(`Kokoro returned suspiciously small payload (${buffer.length} bytes)`);
    }
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
};

/** Tier 2: synthesize via edge-tts (Microsoft Edge Read Aloud, free). */
const synthesizeWithEdgeTts = async (text, { voice = env.ttsVoiceEdge } = {}) => {
  const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
  const tts = new MsEdgeTTS({ connectionTimeoutMs: 10_000, synthesisTimeoutMs: 120_000 });
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const { audioStream } = tts.toStream(text);
    audioStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    audioStream.on('close', () => {
      const buffer = Buffer.concat(chunks);
      if (buffer.length < 512) {
        reject(new Error(`edge-tts returned suspiciously small payload (${buffer.length} bytes)`));
        return;
      }
      resolve(buffer);
    });
    audioStream.on('error', reject);
  });
};

/**
 * Last-resort engine: Google Translate TTS over plain HTTPS (no WebSocket).
 * Some networks block the edge-tts WebSocket upgrade; this always passes.
 * Limits each request to 200 chars, so long transcripts are chunked at
 * sentence boundaries and the mp3 segments are concatenated.
 */
const GTTS_MAX_CHARS = 190;

const splitTranscriptForGtts = (text) => {
  const sentences = text.split(/(?<=[.!?;:])\s+/);
  const chunks = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const sentence of sentences) {
    if (sentence.length > GTTS_MAX_CHARS) {
      pushCurrent();
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if ((current + ' ' + word).trim().length > GTTS_MAX_CHARS) pushCurrent();
        current = current ? `${current} ${word}` : word;
      }
      pushCurrent();
      continue;
    }
    if ((current + ' ' + sentence).trim().length > GTTS_MAX_CHARS) pushCurrent();
    current = current ? `${current} ${sentence}` : sentence;
  }
  pushCurrent();
  return chunks;
};

const synthesizeWithGtts = async (text, { lang = 'en' } = {}) => {
  const chunks = splitTranscriptForGtts(text);
  const segments = [];

  for (const chunk of chunks) {
    const url =
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}` +
      `&total=${chunks.length}&idx=${segments.length}&textlen=${chunk.length}` +
      `&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });
    if (!res.ok) {
      throw new Error(`gTTS chunk ${segments.length + 1}/${chunks.length} responded ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) {
      throw new Error(`gTTS chunk ${segments.length + 1} returned tiny payload (${buffer.length} bytes)`);
    }
    segments.push(buffer);
    if (chunks.length > 1) await new Promise((r) => setTimeout(r, 350)); // be polite
  }

  const buffer = Buffer.concat(segments);
  if (buffer.length < 512) {
    throw new Error('gTTS produced an empty audio payload');
  }
  return buffer;
};

/**
 * Synthesize with engine preference. Every chain ends with the plain-HTTPS
 * gTTS engine so audio is produced even where the edge-tts WebSocket upgrade
 * is blocked. `prefer: 'kokoro'` is the batch order; `prefer: 'edge'` the
 * realtime order.
 */
const synthesizeAudio = async (text, { prefer = 'kokoro' } = {}) => {
  const cleaned = cleanTranscriptForSpeech(text);
  if (!cleaned) {
    throw new AppError('Nothing to synthesize: transcript is empty', 400, 'BAD_REQUEST');
  }

  const engines =
    prefer === 'edge'
      ? [
          { name: 'edge-tts', run: () => synthesizeWithEdgeTts(cleaned) },
          { name: 'kokoro', run: () => synthesizeWithKokoro(cleaned) },
          { name: 'gTTS', run: () => synthesizeWithGtts(cleaned) },
        ]
      : [
          { name: 'kokoro', run: () => synthesizeWithKokoro(cleaned) },
          { name: 'edge-tts', run: () => synthesizeWithEdgeTts(cleaned) },
          { name: 'gTTS', run: () => synthesizeWithGtts(cleaned) },
        ];

  const errors = [];
  for (const engine of engines) {
    try {
      const buffer = await engine.run();
      return { buffer, engine: engine.name, text: cleaned };
    } catch (err) {
      errors.push(`${engine.name}: ${err.message}`);
    }
  }
  throw new AppError(`All TTS engines failed (${errors.join(' | ')})`, 502, 'TTS_UNAVAILABLE');
};

/** Persist an mp3 buffer and return the media subdocument for Lesson.media. */
const saveLessonAudio = (slug, buffer, { engine, transcript = '' } = {}) => {
  ensureAudioDir();
  const safeSlug = (slug || 'lesson').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  const fileName = `${safeSlug || 'lesson'}.mp3`;
  const filePath = path.join(AUDIO_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  try {
    const frontendPath = path.join(FRONTEND_AUDIO_DIR, fileName);
    fs.writeFileSync(frontendPath, buffer);
  } catch (_) {}

  return {
    media: {
      type: 'audio',
      provider: 'self-hosted',
      url: `/audio/${fileName}`,
      duration: estimateDurationSeconds(transcript),
      credit: engine === 'kokoro' ? 'Kokoro TTS (local)' : engine === 'edge-tts' ? 'Microsoft Edge TTS' : engine === 'gTTS' ? 'Google Translate TTS (fallback)' : 'TTS',
      lastCheckedAt: new Date(),
    },
    fileName,
    filePath,
  };
};

module.exports = {
  AUDIO_DIR,
  cleanTranscriptForSpeech,
  synthesizeWithKokoro,
  synthesizeWithEdgeTts,
  synthesizeWithGtts,
  synthesizeAudio,
  saveLessonAudio,
};
