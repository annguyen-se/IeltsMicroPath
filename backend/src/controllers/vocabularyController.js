const contentService = require('../services/contentService');
const { sendSuccess } = require('../utils/apiResponse');

const getVocabularies = async (req, res, next) => {
  try {
    const { tier, topic, page, limit } = req.query;
    const result = await contentService.getVocabularies({ tier, topic, page, limit });
    return sendSuccess(res, 200, result, 'Vocabularies retrieved');
  } catch (err) {
    next(err);
  }
};

const getVocabularyById = async (req, res, next) => {
  try {
    const vocab = await contentService.getVocabularyById(req.params.id);
    return sendSuccess(res, 200, { vocabulary: vocab }, 'Vocabulary details retrieved');
  } catch (err) {
    next(err);
  }
};

const getTopics = async (req, res, next) => {
  try {
    const topics = await contentService.getVocabularyTopics();
    return sendSuccess(res, 200, { topics }, 'Vocabulary topics retrieved');
  } catch (err) {
    next(err);
  }
};

const getParaphrases = async (req, res, next) => {
  try {
    const { tier, search, limit } = req.query;
    const items = await contentService.getParaphrases({ tier, search, limit });
    return sendSuccess(res, 200, { items }, 'Paraphrases retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVocabularies,
  getVocabularyById,
  getTopics,
  getParaphrases
};
