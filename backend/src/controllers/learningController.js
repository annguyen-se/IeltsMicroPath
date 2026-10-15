const missionService = require('../services/missionService');
const { sendSuccess } = require('../utils/apiResponse');

const getTodayMission = async (req, res, next) => {
  try {
    const mission = await missionService.getTodayMission(req.user._id);
    return sendSuccess(res, 200, mission, 'Daily learning mission dispatched');
  } catch (err) {
    next(err);
  }
};

const submitSession = async (req, res, next) => {
  try {
    const result = await missionService.submitSession(req.user._id, req.body);
    return sendSuccess(res, 200, result, 'Session submitted and progress recorded');
  } catch (err) {
    next(err);
  }
};

const submitTyping = async (req, res, next) => {
  try {
    const result = await missionService.submitTypingSession(req.user._id, req.body);
    return sendSuccess(res, 200, result, 'Typing session recorded');
  } catch (err) {
    next(err);
  }
};

const checkWriting = async (req, res, next) => {
  try {
    const { questionId, userSentence } = req.body;
    const result = await missionService.checkWritingSentence({ questionId, userSentence });
    return sendSuccess(res, 200, result, 'Writing evaluated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTodayMission,
  submitSession,
  submitTyping,
  checkWriting
};
