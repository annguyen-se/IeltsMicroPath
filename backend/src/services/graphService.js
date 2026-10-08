const Lesson = require('../models/Lesson');

/**
 * Traverses the Prerequisite DAG to find the next unlocked micro-lesson
 * @param {Object} user - The user document with profile
 * @returns {Promise<Object|null>} Next lesson document or null if all mastered
 */
const findNextPrerequisiteLesson = async (user) => {
  const currentLevel = user.profile?.currentLevel ?? 0;
  const masteredSet = new Set((user.profile?.masteredNodeIds || []).map(id => id.toString()));

  // 1. Fetch all published lessons for current level sorted by orderIndex
  const lessons = await Lesson.find({
    level: currentLevel,
    status: 'published'
  }).sort({ orderIndex: 1, createdAt: 1 });

  // 2. Find the first unmastered lesson whose prerequisites are all satisfied
  for (const lesson of lessons) {
    const lessonIdStr = lesson._id.toString();

    // Skip if already mastered
    if (masteredSet.has(lessonIdStr)) {
      continue;
    }

    // Check prerequisites
    const prereqIds = (lesson.prerequisites || []).map(p => p.toString());
    const allPrereqsMet = prereqIds.every(pId => masteredSet.has(pId));

    if (allPrereqsMet) {
      return lesson;
    }
  }

  // If all lessons in current level are mastered, check next level
  const totalInLevel = lessons.length;
  const masteredInLevel = lessons.filter(l => masteredSet.has(l._id.toString())).length;

  return null; // Level completed or no eligible lesson found
};

module.exports = {
  findNextPrerequisiteLesson
};
