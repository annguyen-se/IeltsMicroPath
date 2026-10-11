const UserSrsItem = require('../models/UserSrsItem');
const Vocabulary = require('../models/Vocabulary');
const AppError = require('../utils/appError');

// Interval matrix in days: Box 1: 1d, Box 2: 3d, Box 3: 7d, Box 4: 14d, Box 5: 30d
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];

/**
 * Calculates next Leitner review interval
 * @param {number} currentBox - 1 to 5
 * @param {boolean} isCorrect - whether answer was correct
 */
const calculateNextReview = (currentBox = 1, isCorrect = false) => {
  const now = new Date();
  if (isCorrect) {
    const nextBox = Math.min(currentBox + 1, 5);
    const daysToAdd = INTERVAL_DAYS[nextBox];
    const nextReviewDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return {
      box: nextBox,
      nextReviewDate,
      isMastered: nextBox === 5
    };
  } else {
    // Drop back to Box 1
    const nextReviewDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day
    return {
      box: 1,
      nextReviewDate,
      isMastered: false
    };
  }
};

/**
 * Updates an existing SRS item or creates a new one
 */
const processSrsReview = async (userId, srsId, isCorrect, vocabId = null) => {
  let srsItem;
  if (srsId) {
    srsItem = await UserSrsItem.findById(srsId);
  } else if (vocabId) {
    srsItem = await UserSrsItem.findOne({ userId, vocabId });
  }

  if (srsItem) {
    const { box, nextReviewDate } = calculateNextReview(srsItem.box, isCorrect);
    srsItem.box = box;
    srsItem.nextReviewDate = nextReviewDate;
    srsItem.consecutiveCorrect = isCorrect ? srsItem.consecutiveCorrect + 1 : 0;
    srsItem.totalReviews += 1;
    await srsItem.save();
    return srsItem;
  } else if (vocabId) {
    // Initialize new item into Box 1 with nextReviewDate = now so it is immediately reviewable
    const now = new Date();
    return await UserSrsItem.create({
      userId,
      vocabId,
      box: 1,
      nextReviewDate: now,
      consecutiveCorrect: isCorrect ? 1 : 0,
      totalReviews: 1
    });
  }

  return null;
};

/**
 * Enrolls a vocabulary item into the user's SRS queue (Box 1)
 * nextReviewDate is set to NOW so the learner can study it immediately
 */
const enrollVocabIntoSrs = async (userId, vocabId) => {
  const existing = await UserSrsItem.findOne({ userId, vocabId });
  if (existing) return existing;

  const now = new Date();
  return await UserSrsItem.create({
    userId,
    vocabId,
    box: 1,
    nextReviewDate: now,
    consecutiveCorrect: 0,
    totalReviews: 0
  });
};

/**
 * Batch enrolls multiple vocabularies into user's SRS Box 1
 */
const enrollBatchVocab = async (userId, vocabIds) => {
  if (!Array.isArray(vocabIds) || vocabIds.length === 0) return { enrolledCount: 0 };
  const existing = await UserSrsItem.find({ userId, vocabId: { $in: vocabIds } }).select('vocabId');
  const existingSet = new Set(existing.map(e => e.vocabId.toString()));

  const now = new Date();
  const toInsert = vocabIds
    .filter(id => !existingSet.has(id.toString()))
    .map(vocabId => ({
      userId,
      vocabId,
      box: 1,
      nextReviewDate: now,
      consecutiveCorrect: 0,
      totalReviews: 0
    }));

  if (toInsert.length > 0) {
    await UserSrsItem.insertMany(toInsert);
  }

  return { enrolledCount: toInsert.length };
};

/**
 * Enrolls all published vocabularies in DB into user's SRS Box 1
 */
const enrollAllPublishedVocab = async (userId, { tier, topic, limit = 100 } = {}) => {
  const query = { status: 'published' };
  if (tier) query.tier = Number(tier);
  if (topic) query.topic = topic;

  const vocabs = await Vocabulary.find(query).limit(Number(limit)).select('_id');
  const vocabIds = vocabs.map(v => v._id);
  return await enrollBatchVocab(userId, vocabIds);
};

/**
 * Gets vocabulary items for review (due only or all tracked in Leitner boxes)
 */
const getDueReviews = async (userId, { limit = 50, mode = 'due', box } = {}) => {
  const now = new Date();
  const query = { userId };

  if (box && Number(box) >= 1 && Number(box) <= 5) {
    query.box = Number(box);
  }

  if (mode === 'due') {
    query.nextReviewDate = { $lte: now };
  }

  const [items, totalTracked, dueCount] = await Promise.all([
    UserSrsItem.find(query)
      .sort({ nextReviewDate: 1, createdAt: -1 })
      .limit(Number(limit))
      .populate('vocabId', 'word ipa pos meaningVi definitionEn exampleSentence collocations media tier topic'),
    UserSrsItem.countDocuments({ userId }),
    UserSrsItem.countDocuments({ userId, nextReviewDate: { $lte: now } })
  ]);

  return {
    dueCount,
    totalTracked,
    items
  };
};

/**
 * Gets distribution statistics of user items across all 5 Leitner boxes
 */
const getSrsStats = async (userId) => {
  const stats = await UserSrsItem.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$box',
        count: { $sum: 1 }
      }
    }
  ]);

  const boxDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalTrackedWords = 0;

  stats.forEach(item => {
    boxDistribution[item._id] = item.count;
    totalTrackedWords += item.count;
  });

  return {
    totalTrackedWords,
    masteredWords: boxDistribution[5],
    boxDistribution
  };
};

/**
 * Submits a single review attempt directly from SRS review room
 */
const submitSingleReview = async (userId, srsId, isCorrect) => {
  const srsItem = await UserSrsItem.findOne({ _id: srsId, userId });
  if (!srsItem) throw new AppError('SRS item not found', 404, 'NOT_FOUND');

  const oldBox = srsItem.box;
  const updated = await processSrsReview(userId, srsId, isCorrect);

  return {
    srsId: updated._id,
    previousBox: oldBox,
    newBox: updated.box,
    isMastered: updated.box === 5,
    nextReviewDate: updated.nextReviewDate
  };
};

module.exports = {
  calculateNextReview,
  processSrsReview,
  enrollVocabIntoSrs,
  enrollBatchVocab,
  enrollAllPublishedVocab,
  getDueReviews,
  getSrsStats,
  submitSingleReview
};
