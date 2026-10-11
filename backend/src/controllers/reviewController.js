const srsService = require('../services/srsService');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

const getDueReviews = async (req, res, next) => {
  try {
    const { limit, mode, box } = req.query;
    const result = await srsService.getDueReviews(req.user._id, { limit, mode, box });
    return sendSuccess(res, 200, result, 'SRS reviews retrieved');
  } catch (err) {
    next(err);
  }
};

const getSrsStats = async (req, res, next) => {
  try {
    const stats = await srsService.getSrsStats(req.user._id);
    return sendSuccess(res, 200, stats, 'SRS box distribution stats retrieved');
  } catch (err) {
    next(err);
  }
};

const submitReview = async (req, res, next) => {
  try {
    const { srsId, isCorrect } = req.body;
    const result = await srsService.submitSingleReview(req.user._id, srsId, Boolean(isCorrect));
    return sendSuccess(res, 200, result, 'Review recorded successfully');
  } catch (err) {
    next(err);
  }
};

const enrollVocab = async (req, res, next) => {
  try {
    const { vocabId, vocabIds } = req.body;
    let result;
    if (Array.isArray(vocabIds) && vocabIds.length > 0) {
      result = await srsService.enrollBatchVocab(req.user._id, vocabIds);
    } else if (vocabId) {
      const item = await srsService.enrollVocabIntoSrs(req.user._id, vocabId);
      result = { enrolledCount: 1, item };
    } else {
      throw new AppError('vocabId or vocabIds is required', 400, 'INVALID_INPUT');
    }
    return sendSuccess(res, 200, result, 'Vocabulary enrolled into SRS Box 1');
  } catch (err) {
    next(err);
  }
};

const enrollAllVocab = async (req, res, next) => {
  try {
    const { tier, topic, limit } = req.body || {};
    const result = await srsService.enrollAllPublishedVocab(req.user._id, { tier, topic, limit });
    return sendSuccess(res, 200, result, `Enrolled ${result.enrolledCount} vocabularies into SRS Box 1`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDueReviews,
  getSrsStats,
  submitReview,
  enrollVocab,
  enrollAllVocab
};
