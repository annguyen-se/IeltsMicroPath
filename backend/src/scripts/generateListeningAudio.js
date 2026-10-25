/**
 * Tier 1 — Batch audio generation for lessons with audioTranscript.
 *
 * Usage:
 *   npm run tts:batch                              # listening lessons missing media.url
 *   npm run tts:batch -- --skill=all               # every skill
 *   npm run tts:batch -- --force                   # regenerate even if media.url exists
 *   npm run tts:batch -- --limit=5                 # only first N lessons
 *   npm run tts:batch -- --dry-run                 # list targets, synthesize nothing
 *
 * Prerequisite (Kokoro Tier 1):
 *   docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi:latest
 * When Kokoro is unreachable the script falls back to edge-tts (Tier 2 engine)
 * so the batch still completes.
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Lesson = require('../models/Lesson');
const { synthesizeAudio, cleanTranscriptForSpeech, saveLessonAudio } = require('../services/ttsService');

const parseArgs = (argv) => {
  const args = { skill: 'listening', force: false, dryRun: false, limit: 0 };
  for (const raw of argv.slice(2)) {
    const [key, value] = raw.replace(/^--/, '').split('=');
    if (key === 'skill') args.skill = value;
    if (key === 'force') args.force = true;
    if (key === 'dry-run') args.dryRun = true;
    if (key === 'limit') args.limit = parseInt(value, 10) || 0;
  }
  return args;
};

async function main() {
  const args = parseArgs(process.argv);

  await connectDB();

  const query = { audioTranscript: { $exists: true, $ne: '' } };
  if (args.skill !== 'all') query.skill = args.skill;

  const lessons = await Lesson.find(query)
    .sort({ level: 1, topic: 1, orderIndex: 1 })
    .select('slug title skill level topic contentType audioTranscript media status');

  const targets = lessons.filter((l) => args.force || !l.media?.url);
  const limited = args.limit > 0 ? targets.slice(0, args.limit) : targets;

  console.log('=== TTS BATCH GENERATOR (Kokoro -> edge-tts fallback) ===');
  console.log(`Filter: skill=${args.skill} | force=${args.force} | dry-run=${args.dryRun}`);
  console.log(`Lessons with transcript: ${lessons.length} | missing audio: ${targets.length} | queued: ${limited.length}\n`);

  if (limited.length === 0) {
    console.log('✅ Nothing to generate. Every matching lesson already has media.url (use --force to regenerate).');
    await mongoose.disconnect();
    return;
  }

  const summary = { generated: 0, skipped: 0, failed: 0, engines: { kokoro: 0, 'edge-tts': 0 } };

  for (const lesson of limited) {
    const label = `[L${lesson.level}] ${lesson.slug || lesson._id}`;

    if (args.dryRun) {
      const words = cleanTranscriptForSpeech(lesson.audioTranscript).split(/\s+/).length;
      console.log(`[DRY-RUN] ${label} — ${words} words, media.url=${lesson.media?.url ? 'yes' : 'no'}`);
      summary.skipped += 1;
      continue;
    }

    try {
      const { buffer, engine } = await synthesizeAudio(lesson.audioTranscript, { prefer: 'kokoro' });
      const { media, fileName } = saveLessonAudio(lesson.slug || String(lesson._id), buffer, {
        engine,
        transcript: lesson.audioTranscript,
      });

      lesson.media = media;
      await lesson.save();

      summary.engines[engine] += 1;
      summary.generated += 1;
      console.log(`✅ ${label} → public/audio/${fileName} (${(buffer.length / 1024).toFixed(0)} KB, ${engine})`);
    } catch (err) {
      summary.failed += 1;
      console.warn(`❌ ${label} — ${err.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Generated: ${summary.generated} (kokoro: ${summary.engines.kokoro}, edge-tts: ${summary.engines['edge-tts']})`);
  console.log(`Skipped: ${summary.skipped} | Failed: ${summary.failed}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[TTS Batch Fatal]', err);
  process.exit(1);
});
