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

const createVocabulary = async (vocabData) => {
  const existing = await Vocabulary.findOne({ word: vocabData.word.toLowerCase() });
  if (existing) {
    throw new AppError(`Word '${vocabData.word}' already exists in database`, 409, 'WORD_EXISTS');
  }
  return await Vocabulary.create(vocabData);
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

  // Fetch accompanying questions
  const questions = await Question.find({ lessonId: id }).populate('vocabId', 'word ipa meaningVi');

  return {
    lesson,
    questions
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
  updateVocabulary,
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  createQuestion,
  getQuestionsByLessonId
};
