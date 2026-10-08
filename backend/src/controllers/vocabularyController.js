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

module.exports = {
  getVocabularies,
  getVocabularyById
};
