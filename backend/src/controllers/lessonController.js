const contentService = require('../services/contentService');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const { synthesizeAudio, saveLessonAudio } = require('../services/ttsService');

const getLessons = async (req, res, next) => {
  try {
    const { skill, level, topic, contentType } = req.query;
    const userId = req.user?._id;
    let masteredSet = new Set();

    if (userId) {
      const user = await User.findById(userId);
      if (user?.profile?.masteredNodeIds) {
        masteredSet = new Set(user.profile.masteredNodeIds.map(id => id.toString()));
      }
    }

    const lessons = await contentService.getLessons({ skill, level, topic, contentType, status: 'published' });

    // Map pairs by topic + level + skill
    const pairMap = new Map();
    for (const l of lessons) {
      const key = `${l.skill}_${l.level}_${l.topic}`;
      if (!pairMap.has(key)) pairMap.set(key, {});
      const item = pairMap.get(key);
      if (l.contentType === 'theory') item.theory = l;
      if (l.contentType === 'practice') item.practice = l;
    }

    const mapped = lessons.map(l => {
      const isMastered = masteredSet.has(l._id.toString());
      const prereqs = l.prerequisites || [];
      const isUnlocked = prereqs.every(p => masteredSet.has(p._id ? p._id.toString() : p.toString()));
      const pair = pairMap.get(`${l.skill}_${l.level}_${l.topic}`) || {};
      const paired = l.contentType === 'theory' ? pair.practice : pair.theory;

      return {
        _id: l._id,
        slug: l.slug,
        title: l.title,
        skill: l.skill,
        contentType: l.contentType,
        level: l.level,
        topic: l.topic,
        orderIndex: l.orderIndex,
        prerequisites: l.prerequisites,
        hasPassage: !!(l.passage?.paragraphs?.length > 0),
        hasAudio: !!(l.audioTranscript || l.media?.url),
        isMastered,
        isUnlocked,
        status: isMastered ? 'mastered' : isUnlocked ? 'unlocked' : 'locked',
        pairedLesson: paired ? {
          _id: paired._id,
          title: paired.title,
          slug: paired.slug,
          contentType: paired.contentType,
          skill: paired.skill
        } : null
      };
    });

    return sendSuccess(res, 200, { lessons: mapped }, 'Lessons retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getLessonDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await contentService.getLessonById(id, req.user);
    return sendSuccess(res, 200, data, 'Lesson detail retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Tier 2 — On-demand audio for lessons without pre-generated audio.
 * Synthesizes the audioTranscript via edge-tts (Kokoro as backup), persists
 * the mp3 + media.url so subsequent hits are served as a static file.
 */
const streamLessonAudio = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).select(
      'slug title audioTranscript media status',
    );
    if (!lesson) throw new AppError('Lesson not found', 404, 'NOT_FOUND');

    // Already materialized -> serve the static file directly.
    if (lesson.media?.url && !lesson.media.url.includes('/api/v1/lessons/')) {
      return res.redirect(302, lesson.media.url);
    }

    if (!(lesson.audioTranscript || '').trim()) {
      throw new AppError('Lesson has no audio transcript to synthesize', 404, 'NO_TRANSCRIPT');
    }

    const { buffer, engine } = await synthesizeAudio(lesson.audioTranscript, { prefer: 'edge' });
    const { media } = saveLessonAudio(lesson.slug || String(lesson._id), buffer, {
      engine,
      transcript: lesson.audioTranscript,
    });

    lesson.media = media;
    await lesson.save({ validateBeforeSave: false });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400',
    });
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLessons,
  getLessonDetail,
  streamLessonAudio
};
