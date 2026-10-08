const User = require('../models/User');
const Lesson = require('../models/Lesson');
const UserSrsItem = require('../models/UserSrsItem');
const UserMistake = require('../models/UserMistake');

const getDashboardData = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const currentLevel = user.profile?.currentLevel ?? 0;
  const masteredNodeIds = user.profile?.masteredNodeIds || [];

  // Parallel optimized count queries
  const [srsDueCount, unresolvedMistakesCount, totalLevelLessons] = await Promise.all([
    UserSrsItem.countDocuments({
      userId,
      nextReviewDate: { $lte: now }
    }),
    UserMistake.countDocuments({
      userId,
      isResolved: false
    }),
    Lesson.countDocuments({
      level: currentLevel,
      status: 'published'
    })
  ]);

  const levelProgressPercent = totalLevelLessons > 0
    ? Math.min(100, Math.round((masteredNodeIds.length / totalLevelLessons) * 100))
    : 0;

  // Check if active today
  const lastActive = user.profile?.lastActiveDate ? new Date(user.profile.lastActiveDate) : null;
  const isToday = lastActive && lastActive.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  const isCompletedToday = isToday && srsDueCount === 0 && unresolvedMistakesCount === 0;

  return {
    user: {
      email: user.email,
      currentLevel,
      targetBand: user.profile?.targetBand ?? 6.5,
      streak: user.profile?.streak ?? 0
    },
    metrics: {
      srsDueCount,
      unresolvedMistakesCount,
      masteredNodesCount: masteredNodeIds.length,
      totalLevelNodesCount: totalLevelLessons,
      levelProgressPercent
    },
    dailyMissionStatus: {
      isCompletedToday,
      estimatedMinutes: user.profile?.dailyTimeBudget ?? 30
    }
  };
};

module.exports = {
  getDashboardData
};
