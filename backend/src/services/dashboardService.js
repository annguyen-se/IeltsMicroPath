const User = require('../models/User');
const Lesson = require('../models/Lesson');
const UserSrsItem = require('../models/UserSrsItem');
const UserMistake = require('../models/UserMistake');
const { findNextPrerequisiteLesson } = require('./graphService');

const calculateLevelProgress = async (user, level, skill = null) => {
  const query = { level, status: 'published' };
  if (skill === 'reading') {
    query.skill = 'reading';
    query.contentType = 'practice';
  } else if (skill) {
    query.skill = skill;
  }
  const totalLessons = await Lesson.countDocuments(query);
  const userMasteredIds = (user.profile?.masteredNodeIds || []).map(id => id.toString());

  const masteredCount = await Lesson.countDocuments({
    _id: { $in: userMasteredIds },
    ...query
  });

  const percentage = totalLessons > 0 ? Math.min(100, Math.round((masteredCount / totalLessons) * 100)) : 0;

  return {
    totalLessons,
    masteredCount,
    percentage,
    canLevelUp: totalLessons >= 5 && percentage >= 70
  };
};

const getDashboardData = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const currentLevel = user.profile?.currentLevel ?? 0;
  const masteredNodeIds = user.profile?.masteredNodeIds || [];
  const masteredSet = new Set(masteredNodeIds.map(id => id.toString()));

  // Calculate level progress using shared logic
  const progress = await calculateLevelProgress(user, currentLevel);

  // Parallel optimized count queries & real data retrieval
  const [
    srsDueCount,
    unresolvedMistakesCount,
    recentMistakesDocs,
    levelLessons,
    nextLessonDoc
  ] = await Promise.all([
    UserSrsItem.countDocuments({
      userId,
      nextReviewDate: { $lte: now },
    }),
    UserMistake.countDocuments({
      userId,
      isResolved: false,
    }),
    UserMistake.find({
      userId,
      isResolved: false
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('questionId', 'prompt errorTaxonomy type'),
    Lesson.find({
      level: currentLevel,
      status: 'published'
    })
      .sort({ orderIndex: 1 })
      .limit(5),
    findNextPrerequisiteLesson(user)
  ]);

  const levelProgressPercent = progress.percentage;

  // Check if active today
  const lastActive = user.profile?.lastActiveDate ? new Date(user.profile.lastActiveDate) : null;
  const isToday = lastActive && lastActive.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  const isCompletedToday = isToday && srsDueCount === 0 && unresolvedMistakesCount === 0;

  // Map real recent mistakes
  const recentMistakes = recentMistakesDocs.map(m => ({
    id: m._id,
    errorCode: m.errorCode || m.questionId?.errorTaxonomy || 'ERR_LEX',
    prompt: m.questionId?.prompt || 'Unresolved trap question',
    userWrongAnswer: m.userWrongAnswer
  }));

  // Map real learning path from Lesson collection
  let foundFirstUnmastered = false;
  const learningPath = levelLessons.map(l => {
    const isMastered = masteredSet.has(l._id.toString());
    let status = 'locked';
    if (isMastered) {
      status = 'mastered';
    } else if (!foundFirstUnmastered) {
      status = 'current';
      foundFirstUnmastered = true;
    }
    return {
      id: l._id,
      title: l.title,
      skill: l.skill,
      topic: l.topic,
      level: l.level,
      status
    };
  });

  return {
    user: {
      email: user.email,
      role: user.role || 'student',
      currentLevel,
      targetBand: user.profile?.targetBand,
      streak: user.profile?.streak ?? 0,
    },
    metrics: {
      srsDueCount,
      unresolvedMistakesCount,
      masteredNodesCount: progress.masteredCount,
      totalLevelNodesCount: progress.totalLessons,
      levelProgressPercent,
    },
    dailyMissionStatus: {
      isCompletedToday,
      estimatedMinutes: user.profile?.dailyTimeBudget,
    },
    nextLesson: nextLessonDoc ? {
      id: nextLessonDoc._id,
      title: nextLessonDoc.title,
      skill: nextLessonDoc.skill,
      level: nextLessonDoc.level,
      topic: nextLessonDoc.topic
    } : null,
    recentMistakes,
    learningPath
  };
};

module.exports = {
  getDashboardData,
  calculateLevelProgress
};
