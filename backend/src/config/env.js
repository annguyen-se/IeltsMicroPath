const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  clientUrl: process.env.CLIENT_URL,
  ninerouterApiKey: process.env.NINEROUTER_API_KEY,
  ninerouterApiUrl: process.env.NINEROUTER_API_URL,

  // TTS hybrid: Kokoro (Tier 1 batch) + edge-tts (Tier 2 realtime fallback)
  kokoroTtsUrl: process.env.KOKORO_TTS_URL || 'http://localhost:8880/v1/audio/speech',
  ttsVoiceKokoro: process.env.TTS_VOICE_KOKORO || 'bf_emma',
  ttsVoiceEdge: process.env.TTS_VOICE_EDGE || 'en-GB-SoniaNeural',
  audioBaseUrl: (process.env.AUDIO_BASE_URL || `http://localhost:${process.env.PORT || '5000'}`).replace(/\/$/, ''),
};

module.exports = env;
