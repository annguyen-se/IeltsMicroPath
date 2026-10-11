const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');
const AppError = require('../utils/appError');

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

const getLessons = async ({ level, skill, status = 'published' }) => {
  const query = {};
  if (level !== undefined) query.level = Number(level);
  if (skill) query.skill = skill;
  if (status) query.status = status;

  return await Lesson.find(query)
    .populate('prerequisites', 'title skill level orderIndex')
    .sort({ orderIndex: 1, createdAt: 1 });
};

const getLessonById = async (id) => {
  const lesson = await Lesson.findById(id).populate('prerequisites', 'title skill level');
  if (!lesson) throw new AppError('Lesson not found', 404, 'NOT_FOUND');

  // Fetch accompanying questions with populated vocab
  const questions = await Question.find({ lessonId: id }).populate('vocabId', 'word ipa pos meaningVi definitionEn exampleSentence collocations media');

  // Extract distinct vocabularies linked to this lesson
  const vocabularies = [];
  const seenVocab = new Set();
  for (const q of questions) {
    if (q.vocabId && !seenVocab.has(q.vocabId._id.toString())) {
      seenVocab.add(q.vocabId._id.toString());
      vocabularies.push(q.vocabId);
    }
  }

  return {
    lesson,
    questions,
    vocabularies
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
