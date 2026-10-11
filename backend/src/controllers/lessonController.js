const contentService = require('../services/contentService');
const User = require('../models/User');
const { sendSuccess } = require('../utils/apiResponse');

const getLessons = async (req, res, next) => {
  try {
    const { skill, level } = req.query;
    const userId = req.user?._id;
    let masteredSet = new Set();

    if (userId) {
      const user = await User.findById(userId);
      if (user?.profile?.masteredNodeIds) {
        masteredSet = new Set(user.profile.masteredNodeIds.map(id => id.toString()));
      }
    }

    const lessons = await contentService.getLessons({ skill, level, status: 'published' });

    const mapped = lessons.map(l => {
      const isMastered = masteredSet.has(l._id.toString());
      const prereqs = l.prerequisites || [];
      const isUnlocked = prereqs.every(p => masteredSet.has(p._id ? p._id.toString() : p.toString()));

      return {
        _id: l._id,
        title: l.title,
        skill: l.skill,
        level: l.level,
        topic: l.topic,
        orderIndex: l.orderIndex,
        prerequisites: l.prerequisites,
        isMastered,
        isUnlocked,
        status: isMastered ? 'mastered' : isUnlocked ? 'unlocked' : 'locked'
      };
    });

    return sendSuccess(res, 200, { lessons: mapped }, 'Lessons retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getLessonDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await contentService.getLessonById(id);
    return sendSuccess(res, 200, data, 'Lesson detail retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLessons,
  getLessonDetail
};
