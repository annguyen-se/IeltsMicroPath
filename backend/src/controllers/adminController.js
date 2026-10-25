const contentService = require('../services/contentService');
const { sendSuccess } = require('../utils/apiResponse');

// Vocabularies
const createVocabulary = async (req, res, next) => {
  try {
    const vocab = await contentService.createVocabulary(req.body);
    return sendSuccess(res, 201, { vocabulary: vocab }, 'Vocabulary item created');
  } catch (err) {
    next(err);
  }
};

const bulkCreateVocabularies = async (req, res, next) => {
  try {
    const result = await contentService.bulkCreateVocabularies(req.body);
    return sendSuccess(res, 200, result, `Successfully processed ${result.total} vocabulary items`);
  } catch (err) {
    next(err);
  }
};

const updateVocabulary = async (req, res, next) => {
  try {
    const vocab = await contentService.updateVocabulary(req.params.id, req.body);
    return sendSuccess(res, 200, { vocabulary: vocab }, 'Vocabulary item updated');
  } catch (err) {
    next(err);
  }
};

// Lessons
const createLesson = async (req, res, next) => {
  try {
    const lesson = await contentService.createLesson(req.body);
    return sendSuccess(res, 201, { lesson }, 'Lesson created successfully');
  } catch (err) {
    next(err);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    const lesson = await contentService.updateLesson(req.params.id, req.body);
    return sendSuccess(res, 200, { lesson }, 'Lesson updated successfully');
  } catch (err) {
    next(err);
  }
};

const getLessons = async (req, res, next) => {
  try {
    const { level, skill, status } = req.query;
    const lessons = await contentService.getLessons({ level, skill, status });
    return sendSuccess(res, 200, { lessons }, 'Lessons retrieved');
  } catch (err) {
    next(err);
  }
};

const getLessonById = async (req, res, next) => {
  try {
    const result = await contentService.getLessonById(req.params.id);
    return sendSuccess(res, 200, result, 'Lesson details retrieved');
  } catch (err) {
    next(err);
  }
};

// Questions
const createQuestion = async (req, res, next) => {
  try {
    const question = await contentService.createQuestion(req.body);
    return sendSuccess(res, 201, { question }, 'Question added to lesson');
  } catch (err) {
    next(err);
  }
};

// Curriculum Bundle Import (Full Masterplan Format: { vocabulary, lessons, questions })
const importCurriculumBundle = async (req, res, next) => {
  try {
    const { vocabulary, lessons, questions } = req.body;
    const { processVocabularyBatch, processLessonAndQuestionsBatch } = require('../scripts/seedPipeline');

    const vocabCount = await processVocabularyBatch(vocabulary || []);
    const { savedLessons, savedQuestions } = await processLessonAndQuestionsBatch(
      lessons || [],
      questions || [],
      req.body.topic || 'academic-general',
      req.body.level || 2
    );

    return sendSuccess(
      res,
      200,
      { vocabCount, savedLessons, savedQuestions },
      `Curriculum bundle imported successfully (${vocabCount} vocabs, ${savedLessons} lessons, ${savedQuestions} questions)`
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createVocabulary,
  bulkCreateVocabularies,
  updateVocabulary,
  createLesson,
  updateLesson,
  getLessons,
  getLessonById,
  createQuestion,
  importCurriculumBundle
};
