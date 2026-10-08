const mistakeService = require('../services/mistakeService');
const { sendSuccess } = require('../utils/apiResponse');

const getMistakes = async (req, res, next) => {
  try {
    const { errorCode } = req.query;
    const result = await mistakeService.getUnresolvedMistakes(req.user._id, errorCode);
    return sendSuccess(res, 200, result, 'Unresolved mistakes retrieved');
  } catch (err) {
    next(err);
  }
};

const getMistakeStats = async (req, res, next) => {
  try {
    const stats = await mistakeService.getMistakeStats(req.user._id);
    return sendSuccess(res, 200, stats, 'Mistake vault distribution stats retrieved');
  } catch (err) {
    next(err);
  }
};

const retestMistake = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userAnswer } = req.body;
    const result = await mistakeService.retestMistake(req.user._id, id, userAnswer);
    return sendSuccess(res, 200, result, 'Retest evaluated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMistakes,
  getMistakeStats,
  retestMistake
};
