const User = require('../models/User');
const UserSrsItem = require('../models/UserSrsItem');
const UserMistake = require('../models/UserMistake');
const Question = require('../models/Question');
const Lesson = require('../models/Lesson');
const { findNextPrerequisiteLesson } = require('./graphService');
const srsService = require('./srsService');
const mistakeService = require('./mistakeService');

/**
 * Dispatches atomic 3-phase daily learning mission payload
 * @param {string} userId - User ObjectId
 */
const getTodayMission = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();

  // 1. Phase 1: Due SRS Reviews (Max 15 items)
  const dueSrsItems = await UserSrsItem.find({
    userId,
    nextReviewDate: { $lte: now }
  })
    .sort({ nextReviewDate: 1 })
    .limit(15)
    .populate('vocabId', 'word ipa pos meaningVi exampleSentence media tier');

  const phase1_srsReview = dueSrsItems.map(item => ({
    srsId: item._id,
    currentBox: item.box,
    vocab: item.vocabId
  }));

  // 2. Phase 2: Unresolved Mistakes (Max 2 items)
  const unresolvedMistakes = await UserMistake.find({
    userId,
    isResolved: false
  })
    .sort({ createdAt: -1 })
    .limit(2)
    .populate('questionId', 'prompt type options errorTaxonomy explanation media');

  const phase2_mistakeRemediation = unresolvedMistakes.map(m => ({
    mistakeId: m._id,
    errorCode: m.errorCode,
    previousWrongAnswer: m.userWrongAnswer,
    question: m.questionId
  }));

  // 3. Phase 3: Next Prerequisite Micro-Lesson
  const nextLesson = await findNextPrerequisiteLesson(user);
  let phase3_newLesson = null;

  if (nextLesson) {
    const questions = await Question.find({ lessonId: nextLesson._id }).populate('vocabId', 'word ipa pos meaningVi definitionEn exampleSentence collocations media');
    const vocabularies = [];
    const seenVocab = new Set();
    for (const q of questions) {
      if (q.vocabId && !seenVocab.has(q.vocabId._id.toString())) {
        seenVocab.add(q.vocabId._id.toString());
        vocabularies.push(q.vocabId);
      }
    }

    phase3_newLesson = {
      lesson: {
        id: nextLesson._id,
        title: nextLesson.title,
        skill: nextLesson.skill,
        level: nextLesson.level,
        topic: nextLesson.topic,
        contentMarkdown: nextLesson.contentMarkdown,
        media: nextLesson.media
      },
      vocabularies,
      questions: questions.map(q => ({
        id: q._id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        errorTaxonomy: q.errorTaxonomy
      }))
    };
  }

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    sessionId,
    summary: {
      srsCount: phase1_srsReview.length,
      mistakeCount: phase2_mistakeRemediation.length,
      hasNewLesson: !!phase3_newLesson
    },
    phase1_srsReview,
    phase2_mistakeRemediation,
    phase3_newLesson
  };
};

/**
 * Submits completed daily session, updates Leitner boxes, logs mistakes, and checks mastery gate
 * @param {string} userId - User ObjectId
 * @param {Object} payload - Session results
 */
const submitSession = async (userId, payload) => {
  const { srsResults = [], mistakeResults = [], lessonResults } = payload;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  let srsPromotionsCount = 0;
  let mistakesResolvedCount = 0;
  let newMistakesLoggedCount = 0;
  let isLessonMastered = false;
  let scorePercentage = 0;

  // 1. Process Phase 1 SRS Results
  for (const srs of srsResults) {
    const updated = await srsService.processSrsReview(userId, srs.srsId, srs.isCorrect, srs.vocabId);
    if (srs.isCorrect && updated && updated.box > 1) {
      srsPromotionsCount++;
    }
  }

  // 2. Process Phase 2 Mistake Remediation
  for (const m of mistakeResults) {
    if (m.isCorrect) {
      await mistakeService.resolveMistake(userId, m.mistakeId);
      mistakesResolvedCount++;
    }
  }

  // 3. Process Phase 3 Lesson Mastery Check
  if (lessonResults && lessonResults.lessonId && Array.isArray(lessonResults.answers)) {
    const lesson = await Lesson.findById(lessonResults.lessonId);
    if (lesson) {
      const questions = await Question.find({ lessonId: lesson._id });
      const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

      let correctCount = 0;
      const totalQuestions = questions.length;

      for (const ans of lessonResults.answers) {
        const question = questionMap.get(ans.questionId.toString());
        if (question) {
          const isCorrect = (ans.userAnswer || '').trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          if (isCorrect) {
            correctCount++;
          } else {
            // Log as new mistake in Mistake Vault
            await mistakeService.logMistake(userId, question._id, question.errorTaxonomy, ans.userAnswer || '');
            newMistakesLoggedCount++;
          }
        }
      }

      scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;

      // Mastery threshold: >= 80%
      if (scorePercentage >= 80) {
        isLessonMastered = true;
        // Add to user mastered nodes
        await User.findByIdAndUpdate(userId, {
          $addToSet: { 'profile.masteredNodeIds': lesson._id }
        });

        // If lesson has vocab questions, auto-enroll words into SRS Box 1
        for (const q of questions) {
          if (q.vocabId) {
            await srsService.enrollVocabIntoSrs(userId, q.vocabId);
          }
        }
      }
    }
  }

  // 4. Update Streak & Active Date
  const now = new Date();
  const lastActive = user.profile?.lastActiveDate ? new Date(user.profile.lastActiveDate) : null;

  if (lastActive) {
    const diffDays = Math.floor((now.setHours(0,0,0,0) - lastActive.setHours(0,0,0,0)) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      user.profile.streak = (user.profile.streak || 0) + 1;
    } else if (diffDays > 1) {
      user.profile.streak = 1; // Reset streak
    }
    // If diffDays === 0, streak remains unchanged for today
  } else {
    user.profile.streak = 1;
  }

  user.profile.lastActiveDate = new Date();
  await user.save();

  return {
    isLessonMastered,
    scorePercentage,
    streak: user.profile.streak,
    srsPromotionsCount,
    mistakesResolvedCount,
    newMistakesLoggedCount
  };
};

module.exports = {
  getTodayMission,
  submitSession
};
