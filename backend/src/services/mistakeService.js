const UserMistake = require('../models/UserMistake');
const Question = require('../models/Question');
const AppError = require('../utils/appError');

/**
 * Logs a new question mistake into the user's vault
 */
const logMistake = async (userId, questionId, errorCode, userWrongAnswer) => {
  // Check if an unresolved mistake for this question already exists
  const existing = await UserMistake.findOne({
    userId,
    questionId,
    isResolved: false
  });

  if (existing) {
    existing.userWrongAnswer = userWrongAnswer;
    existing.errorCode = errorCode || existing.errorCode;
    return await existing.save();
  }

  return await UserMistake.create({
    userId,
    questionId,
    errorCode: errorCode || 'ERR_LEX',
    userWrongAnswer,
    isResolved: false
  });
};

/**
 * Marks a mistake as resolved
 */
const resolveMistake = async (userId, mistakeId) => {
  return await UserMistake.findOneAndUpdate(
    { _id: mistakeId, userId },
    {
      $set: {
        isResolved: true,
        resolvedAt: new Date()
      }
    },
    { new: true }
  );
};

/**
 * Gets all unresolved mistakes for user with optional error filter
 */
const getUnresolvedMistakes = async (userId, errorCode = null) => {
  const query = {
    userId,
    isResolved: false
  };

  if (errorCode) {
    query.errorCode = errorCode;
  }

  const mistakes = await UserMistake.find(query)
    .sort({ createdAt: -1 })
    .populate('questionId', 'prompt type options correctAnswer explanation errorTaxonomy media');

  return {
    totalUnresolved: mistakes.length,
    mistakes
  };
};

/**
 * Aggregates statistics of unresolved mistakes by taxonomy code
 */
const getMistakeStats = async (userId) => {
  const stats = await UserMistake.aggregate([
    { $match: { userId, isResolved: false } },
    {
      $group: {
        _id: '$errorCode',
        count: { $sum: 1 }
      }
    }
  ]);

  const distribution = {
    ERR_LEX: 0,
    ERR_PHO: 0,
    ERR_SYN: 0,
    ERR_DIS: 0,
    ERR_LOG: 0
  };

  let totalUnresolved = 0;
  stats.forEach(item => {
    distribution[item._id] = item.count;
    totalUnresolved += item.count;
  });

  return {
    totalUnresolved,
    distribution
  };
};

/**
 * Submits a re-test answer for an individual mistake record
 */
const retestMistake = async (userId, mistakeId, userAnswer) => {
  const mistake = await UserMistake.findOne({ _id: mistakeId, userId }).populate('questionId');
  if (!mistake) throw new AppError('Mistake item not found', 404, 'NOT_FOUND');

  const question = mistake.questionId;
  if (!question) throw new AppError('Associated question not found', 404, 'QUESTION_NOT_FOUND');

  const isCorrect = (userAnswer || '').trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

  if (isCorrect) {
    mistake.isResolved = true;
    mistake.resolvedAt = new Date();
    await mistake.save();

    return {
      mistakeId: mistake._id,
      isResolved: true,
      isCorrect: true,
      message: 'Great job! Mistake resolved and removed from active vault.',
      explanation: question.explanation
    };
  } else {
    // Update latest wrong answer
    mistake.userWrongAnswer = userAnswer;
    await mistake.save();

    return {
      mistakeId: mistake._id,
      isResolved: false,
      isCorrect: false,
      message: 'Not quite right yet. Review the explanation and try again.',
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    };
  }
};

module.exports = {
  logMistake,
  resolveMistake,
  getUnresolvedMistakes,
  getMistakeStats,
  retestMistake
};
