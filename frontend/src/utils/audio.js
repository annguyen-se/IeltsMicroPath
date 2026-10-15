/**
 * Ultra-fast Audio Playback Engine with Preloading, Memory Caching & Instant Web Speech Fallback.
 */

// Memory cache for HTMLAudioElement instances to ensure 0ms latency on repeated plays
const audioCache = new Map();

// Cached voice for Web Speech API
let cachedVoice = null;

/**
 * Pre-warms Web Speech voices to eliminate initial delay on Windows/Chrome
 */
function initVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const updateVoice = () => {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;
      // Prioritize natural British English voices for IELTS
      cachedVoice =
        voices.find((v) => v.lang === 'en-GB' || v.lang === 'en_GB') ||
        voices.find((v) => v.name.includes('United Kingdom') || v.name.includes('British') || v.name.includes('George') || v.name.includes('Hazel')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    } catch (_) {}
  };

  updateVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoice;
  }
}

if (typeof window !== 'undefined') {
  initVoices();
}

/**
 * Instant speech synthesis using local browser voices (0ms network latency)
 */
export function speakWordInstant(word, lang = 'en-GB') {
  if (!word || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const synth = window.speechSynthesis;
    // Chromium fix: Avoid rapid cancel/speak deadlock on Windows
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.rate = 0.92; // Natural, clear pace for IELTS learners

    if (cachedVoice) {
      utterance.voice = cachedVoice;
    }

    // Small micro-delay prevents Chromium audio pipeline contention
    setTimeout(() => {
      try {
        synth.speak(utterance);
      } catch (err) {
        console.warn('[Audio] Speech synthesis failed:', err);
      }
    }, 15);
  } catch (err) {
    console.warn('[Audio] Speech synthesis error:', err);
  }
}

/**
 * Preloads an audio file in the background so it plays with 0ms latency when clicked
 */
export function preloadAudio(url) {
  if (!url || typeof window === 'undefined' || audioCache.has(url)) return;

  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url.trim();
    audioCache.set(url, audio);
  } catch (_) {}
}

/**
 * Plays word pronunciation:
 * 1. Tries pre-cached or external audio URL.
 * 2. Uses a strict 650ms timeout: if external network stalls (slow international CDN),
 *    instantly falls back to local Web Speech voice so learner never waits.
 *
 * @param {string|null|undefined} mediaUrl - External audio URL
 * @param {string} word - Fallback word text
 * @param {string} [lang='en-GB'] - Language accent
 */
export function playWordAudio(mediaUrl, word, lang = 'en-GB') {
  const cleanUrl = typeof mediaUrl === 'string' ? mediaUrl.trim() : '';

  // If no external URL or user prefers instant speech mode
  if (!cleanUrl) {
    speakWordInstant(word, lang);
    return;
  }

  // Get or create audio element
  let audio = audioCache.get(cleanUrl);
  if (!audio) {
    audio = new Audio(cleanUrl);
    audio.preload = 'auto';
    audioCache.set(cleanUrl, audio);
  }

  let hasStartedPlaying = false;

  // Safety timer: If international CDN (Wikimedia / FreeDict) takes > 650ms to stream,
  // immediately speak locally so the learner gets instant feedback!
  const timeoutId = setTimeout(() => {
    if (!hasStartedPlaying) {
      hasStartedPlaying = true;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
      speakWordInstant(word, lang);
    }
  }, 650);

  const cleanupListeners = () => {
    clearTimeout(timeoutId);
    audio.removeEventListener('playing', onPlaying);
    audio.removeEventListener('error', onError);
  };

  const onPlaying = () => {
    hasStartedPlaying = true;
    cleanupListeners();
  };

  const onError = () => {
    if (!hasStartedPlaying) {
      hasStartedPlaying = true;
      cleanupListeners();
      speakWordInstant(word, lang);
    }
  };

  audio.addEventListener('playing', onPlaying, { once: true });
  audio.addEventListener('error', onError, { once: true });

  try {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          hasStartedPlaying = true;
          clearTimeout(timeoutId);
        })
        .catch(() => {
          if (!hasStartedPlaying) {
            hasStartedPlaying = true;
            cleanupListeners();
            speakWordInstant(word, lang);
          }
        });
    }
  } catch {
    if (!hasStartedPlaying) {
      hasStartedPlaying = true;
      cleanupListeners();
      speakWordInstant(word, lang);
    }
  }
}

export default playWordAudio;
