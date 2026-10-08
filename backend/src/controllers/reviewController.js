const srsService = require('../services/srsService');
const { sendSuccess } = require('../utils/apiResponse');

const getDueReviews = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const result = await srsService.getDueReviews(req.user._id, limit);
    return sendSuccess(res, 200, result, 'Due SRS reviews retrieved');
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

module.exports = {
  getDueReviews,
  getSrsStats,
  submitReview
};
