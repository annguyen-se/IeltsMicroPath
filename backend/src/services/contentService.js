const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');
const LessonAttempt = require('../models/LessonAttempt');
const AppError = require('../utils/appError');

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ==================== VOCABULARY ====================

const getVocabularies = async ({ tier, topic, status = 'published', page = 1, limit = 20 }) => {
  const query = {};
  if (tier) query.tier = Number(tier);
  if (topic) query.topic = topic;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Vocabulary.find(query).sort({ word: 1 }).skip(skip).limit(Number(limit)),
    Vocabulary.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

const getVocabularyById = async (id) => {
  const vocab = await Vocabulary.findById(id);
  if (!vocab) throw new AppError('Vocabulary item not found', 404, 'NOT_FOUND');
  return vocab;
};

const getVocabularyTopics = async () => {
  const topics = await Vocabulary.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: '$topic',
        count: { $sum: 1 },
        tier: { $first: '$tier' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  return topics.map(t => ({
    topic: t._id,
    count: t.count,
    tier: t.tier
  }));
};

const getParaphrases = async ({ tier, search, limit = 100 }) => {
  const query = {
    paraphrases: { $exists: true, $not: { $size: 0 } },
    status: 'published'
  };
  if (tier) {
    query.$or = [
      { readingTier: Number(tier) },
      { $and: [{ readingTier: null }, { tier: Number(tier) }] }
    ];
  }
  if (search) {
    const s = String(search).trim();
    const searchCond = [
      { word: { $regex: s, $options: 'i' } },
      { paraphrases: { $regex: s, $options: 'i' } },
      { meaningVi: { $regex: s, $options: 'i' } }
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchCond }];
      delete query.$or;
    } else {
      query.$or = searchCond;
    }
  }
  return await Vocabulary.find(query).sort({ readingTier: 1, tier: 1, word: 1 }).limit(Number(limit));
};

const normalizeVocabItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  const word = String(item.word || '').trim().toLowerCase();
  if (!word) return null;

  let pos = String(item.pos || '').trim().toLowerCase();
  if (pos === 'adjective') pos = 'adj';
  if (pos === 'adverb') pos = 'adv';
  if (!['noun', 'verb', 'adj', 'adv', 'phrase', 'prep', 'conj'].includes(pos)) {
    pos = 'noun';
  }

  let tier = Number(item.tier);
  if (![1, 2, 3, 4].includes(tier)) {
    tier = 1;
  }

  let media = null;
  if (item.media && item.media.url) {
    media = {
      type: item.media.type || 'audio',
      provider: item.media.provider || 'external',
      url: item.media.url,
      duration: Number(item.media.duration) || 0
    };
  }

  return {
    word,
    ipa: String(item.ipa || '').trim() || `/${word}/`,
    pos,
    meaningVi: String(item.meaningVi || '').trim(),
    definitionEn: item.definitionEn ? String(item.definitionEn).trim() : undefined,
    vocabType: item.vocabType || 'topic_specific',
    topic: String(item.topic || 'general').trim(),
    tier,
    awlSublist: item.awlSublist !== undefined && item.awlSublist !== null ? Number(item.awlSublist) : null,
    collocations: Array.isArray(item.collocations) ? item.collocations.map(s => String(s).trim()).filter(Boolean) : [],
    exampleSentence: String(item.exampleSentence || `${word} in context.`).trim(),
    topicIdeaVi: item.topicIdeaVi ? String(item.topicIdeaVi).trim() : undefined,
    wordFamily: (item.wordFamily && typeof item.wordFamily === 'object') ? item.wordFamily : {},
    paraphrases: Array.isArray(item.paraphrases) ? item.paraphrases.map(s => String(s).trim()).filter(Boolean) : [],
    media,
    status: item.status || 'published'
  };
};

const createVocabulary = async (vocabData) => {
  const existing = await Vocabulary.findOne({ word: vocabData.word.toLowerCase() });
  if (existing) {
    throw new AppError(`Word '${vocabData.word}' already exists in database`, 409, 'WORD_EXISTS');
  }
  return await Vocabulary.create(vocabData);
};

const bulkCreateVocabularies = async (rawItems) => {
  const list = Array.isArray(rawItems)
    ? rawItems
    : (rawItems?.vocabularies || rawItems?.items || [rawItems]);

  const validItems = list.map(normalizeVocabItem).filter(Boolean);

  if (validItems.length === 0) {
    throw new AppError('No valid vocabulary items found in JSON payload', 400, 'INVALID_PAYLOAD');
  }

  const operations = validItems.map(item => ({
    updateOne: {
      filter: { word: item.word },
      update: { $set: item },
      upsert: true
    }
  }));

  const bulkRes = await Vocabulary.bulkWrite(operations, { ordered: false });

  return {
    total: validItems.length,
    insertedCount: bulkRes.upsertedCount || 0,
    updatedCount: bulkRes.modifiedCount || 0,
    matchedCount: bulkRes.matchedCount || 0
  };
};

const updateVocabulary = async (id, updateData) => {
  const vocab = await Vocabulary.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
  if (!vocab) throw new AppError('Vocabulary item not found', 404, 'NOT_FOUND');
  return vocab;
};

// ==================== LESSONS ====================

const getLessons = async ({ level, skill, contentType, status = 'published' }) => {
  const query = {};
  if (level !== undefined) query.level = Number(level);
  if (skill) query.skill = skill;
  if (contentType) query.contentType = contentType;
  if (status) query.status = status;

  return await Lesson.find(query)
    .populate('prerequisites', 'title skill level orderIndex slug')
    .sort({ orderIndex: 1, createdAt: 1 });
};

const getLessonById = async (id, user = null) => {
  const lesson = await Lesson.findById(id)
    .populate('prerequisites', 'title skill level slug')
    .populate('vocabIds', 'word ipa pos meaningVi definitionEn exampleSentence collocations paraphrases media readingTier tier')
    .populate('vocabAnchors.vocabId', 'word ipa pos meaningVi definitionEn readingTier tier')
    .populate('paraphrasePairs.vocabId', 'word ipa pos meaningVi readingTier tier');

  if (!lesson) throw new AppError('Lesson not found', 404, 'NOT_FOUND');

  // 1. Status check: unpublished lessons only accessible by admin
  if (lesson.status !== 'published' && user?.role !== 'admin') {
    throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  }

  // 2. Prerequisite check
  const prereqs = lesson.prerequisites || [];
  if (prereqs.length > 0 && user?.role !== 'admin') {
    const masteredSet = new Set((user?.profile?.masteredNodeIds || []).map(pId => pId.toString()));
    const allUnlocked = prereqs.every(p => masteredSet.has(p._id ? p._id.toString() : p.toString()));
    if (!allUnlocked) {
      throw new AppError('Bài học bị khóa. Vui lòng hoàn thành bài học tiên quyết trước.', 403, 'FORBIDDEN');
    }
  }

  // 3. Check if user has unlocked review (either passed >= 75% or submitted >= 2 times or is admin)
  let isReviewUnlocked = false;
  if (user) {
    if (user.role === 'admin') {
      isReviewUnlocked = true;
    } else {
      const attempts = await LessonAttempt.find({ userId: user._id, lessonId: lesson._id });
      const hasPassed = attempts.some(a => a.passed);
      if (hasPassed || attempts.length >= 2) {
        isReviewUnlocked = true;
      }
    }
  }

  const rawQuestions = await Question.find({ lessonId: id })
    .populate('vocabId', 'word ipa pos meaningVi definitionEn exampleSentence collocations media readingTier tier')
    .sort({ orderIndex: 1, createdAt: 1 });

  if (isReviewUnlocked || lesson.contentType !== 'practice') {
    // Return full data with answers & explanations for modal theory/skill drills
    const vocabularies = lesson.vocabIds || [];
    return {
      lesson,
      questions: rawQuestions,
      vocabularies,
      isReviewUnlocked: isReviewUnlocked || lesson.contentType !== 'practice'
    };
  }

  // Sanitized payload for test-taking mode (strict allowlist)
  const sanitizedLesson = {
    _id: lesson._id,
    slug: lesson.slug,
    title: lesson.title,
    skill: lesson.skill,
    level: lesson.level,
    topic: lesson.topic,
    contentType: lesson.contentType,
    orderIndex: lesson.orderIndex,
    media: lesson.media,
    prerequisites: lesson.prerequisites,
    contentMarkdown: lesson.contentType === 'theory' ? lesson.contentMarkdown : undefined,
    passage: lesson.contentType === 'practice' ? lesson.passage : undefined
  };

  const sanitizedQuestions = rawQuestions.map(q => {
    let options = q.options ? [...q.options] : [];
    if (q.format === 'mcq' || q.format === 'vocab-context') {
      options = shuffleArray(options);
    }
    return {
      _id: q._id,
      type: q.type,
      format: q.format || 'standard',
      prompt: q.prompt,
      options,
      orderIndex: q.orderIndex
    };
  });

  return {
    lesson: sanitizedLesson,
    questions: sanitizedQuestions,
    isReviewUnlocked: false
  };
};

const createLesson = async (lessonData) => {
  return await Lesson.create(lessonData);
};

const updateLesson = async (id, updateData) => {
  const lesson = await Lesson.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
  if (!lesson) throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  return lesson;
};

// ==================== QUESTIONS ====================

const createQuestion = async (questionData) => {
  const lesson = await Lesson.findById(questionData.lessonId);
  if (!lesson) throw new AppError('Associated lesson not found', 404, 'LESSON_NOT_FOUND');
  return await Question.create(questionData);
};

const getQuestionsByLessonId = async (lessonId) => {
  return await Question.find({ lessonId });
};

module.exports = {
  getVocabularies,
  getVocabularyById,
  getVocabularyTopics,
  getParaphrases,
  createVocabulary,
  bulkCreateVocabularies,
  updateVocabulary,
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  createQuestion,
  getQuestionsByLessonId
};
