const User = require('../models/User');
const UserSrsItem = require('../models/UserSrsItem');
const UserMistake = require('../models/UserMistake');
const Question = require('../models/Question');
const Lesson = require('../models/Lesson');
const LessonAttempt = require('../models/LessonAttempt');
const { findNextPrerequisiteLesson } = require('./graphService');
const srsService = require('./srsService');
const mistakeService = require('./mistakeService');

const normalizeAnswer = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+$/, '');
};

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
  let lessonReviewData = null;

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

  // 3. Process Phase 3 Lesson Mastery Check & Lesson Attempt Recording
  if (lessonResults && lessonResults.lessonId && Array.isArray(lessonResults.answers)) {
    const lesson = await Lesson.findById(lessonResults.lessonId);
    if (lesson) {
      const questions = await Question.find({ lessonId: lesson._id }).sort({ orderIndex: 1, createdAt: 1 });
      const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

      // Validate that all question IDs belong to this lesson
      for (const ans of lessonResults.answers) {
        if (!questionMap.has(ans.questionId.toString())) {
          throw new Error('Question does not belong to the submitted lesson');
        }
      }

      let correctCount = 0;
      const totalQuestions = questions.length;
      const attemptAnswers = [];
      const detailedQuestionResults = [];

      for (const ans of lessonResults.answers) {
        const question = questionMap.get(ans.questionId.toString());
        const userAnsNorm = normalizeAnswer(ans.userAnswer);
        const correctAnsNorm = normalizeAnswer(question.correctAnswer);
        const hasAlternative = Array.isArray(question.acceptableAnswers) &&
          question.acceptableAnswers.some(alt => normalizeAnswer(alt) === userAnsNorm);

        const isCorrect = userAnsNorm === correctAnsNorm || hasAlternative;

        if (isCorrect) {
          correctCount++;
        } else {
          // Log as new mistake in Mistake Vault with errorCode directly from question taxonomy
          await mistakeService.logMistake(userId, question._id, question.errorTaxonomy, ans.userAnswer || '');
          newMistakesLoggedCount++;
        }

        attemptAnswers.push({
          questionId: question._id,
          userAnswer: ans.userAnswer || '',
          isCorrect
        });

        detailedQuestionResults.push({
          questionId: question._id,
          userAnswer: ans.userAnswer || '',
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          evidence: question.evidence
        });
      }

      scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;
      const passed = scorePercentage >= 75;

      // Save LessonAttempt with duplicate attemptNumber collision handling
      let attemptDoc = null;
      let attemptNum = (await LessonAttempt.countDocuments({ userId, lessonId: lesson._id })) + 1;
      for (let retry = 0; retry < 3; retry++) {
        try {
          attemptDoc = await LessonAttempt.create({
            userId,
            lessonId: lesson._id,
            answers: attemptAnswers,
            score: correctCount,
            totalQuestions,
            percentage: scorePercentage,
            passed,
            attemptNumber: attemptNum
          });
          break;
        } catch (err) {
          if (err.code === 11000) {
            attemptNum = (await LessonAttempt.countDocuments({ userId, lessonId: lesson._id })) + 1;
          } else {
            throw err;
          }
        }
      }

      // Mastery threshold: >= 75% on any attempt
      if (passed) {
        isLessonMastered = true;
        await User.findByIdAndUpdate(userId, {
          $addToSet: { 'profile.masteredNodeIds': lesson._id }
        });
      }

      // Auto-enroll vocabIds into SRS (Box 1, +1 day) using bulkWrite
      const vocabIdsToEnroll = [];
      if (Array.isArray(lesson.vocabIds) && lesson.vocabIds.length > 0) {
        vocabIdsToEnroll.push(...lesson.vocabIds);
      }
      for (const q of questions) {
        if (q.vocabId && !vocabIdsToEnroll.some(id => id.toString() === q.vocabId.toString())) {
          vocabIdsToEnroll.push(q.vocabId);
        }
      }

      if (vocabIdsToEnroll.length > 0) {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const srsOps = vocabIdsToEnroll.map(vId => ({
          updateOne: {
            filter: { userId, vocabId: vId },
            update: {
              $setOnInsert: {
                box: 1,
                nextReviewDate: tomorrow,
                consecutiveCorrect: 0,
                totalReviews: 0
              }
            },
            upsert: true
          }
        }));
        await UserSrsItem.bulkWrite(srsOps, { ordered: false });
      }

      // Review data access control:
      // If passed OR attemptNumber >= 2 -> unlock full detailed review
      // If failed on attempt 1 -> only return overall score, hide specific answer keys to prevent trivial cheating
      const isReviewUnlocked = passed || (attemptDoc && attemptDoc.attemptNumber >= 2);

      lessonReviewData = {
        lessonId: lesson._id,
        score: correctCount,
        totalQuestions,
        scorePercentage,
        passed,
        isReviewUnlocked,
        attemptNumber: attemptDoc?.attemptNumber || 1,
        message: passed
          ? `Xuất sắc! Bạn đã đạt ${scorePercentage}% và hoàn thành bài học.`
          : isReviewUnlocked
            ? `Bạn đạt ${scorePercentage}%. Hãy đối chiếu đáp án chi tiết bên dưới.`
            : `Bạn trả lời đúng ${correctCount}/${totalQuestions} câu. Vui lòng làm lại để xem giải thích chi tiết và mở khóa bài tiếp theo!`,
        detailedQuestions: isReviewUnlocked ? detailedQuestionResults : undefined,
        paraphrasePairs: isReviewUnlocked ? lesson.paraphrasePairs : undefined,
        vocabAnchors: isReviewUnlocked ? lesson.vocabAnchors : undefined
      };
    }
  }

  // 4. Update Streak & Active Date
  const now = new Date();
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const lastActive = user.profile?.lastActiveDate ? new Date(user.profile.lastActiveDate) : null;

  if (lastActive) {
    const lastActiveDayStr = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()).getTime();
    const diffDays = Math.round((todayStr - lastActiveDayStr) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      user.profile.streak = (user.profile.streak || 0) + 1;
    } else if (diffDays > 1) {
      user.profile.streak = 1; // Reset streak if missed more than 1 day
    }
    // diffDays === 0: already active today, streak unchanged
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
    newMistakesLoggedCount,
    lessonReviewData
  };
};

/**
 * Submits typing drill session, updates SRS for reviewed words, and tracks activity
 */
const submitTypingSession = async (userId, payload) => {
  const { topic, wpm = 0, accuracy = 100, results = [] } = payload;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  let srsProcessedCount = 0;
  for (const item of results) {
    if (item.vocabId) {
      await srsService.processSrsReview(userId, null, !!item.isCorrect, item.vocabId);
      srsProcessedCount++;
    }
  }

  user.profile = user.profile || {};
  user.profile.lastActiveDate = new Date();
  await user.save();

  return {
    topic,
    wpm,
    accuracy,
    processedCount: srsProcessedCount,
    streak: user.profile.streak || 0
  };
};

/**
 * Evaluates student sentence translation against book standard and AI reference
 */
const checkWritingSentence = async ({ questionId, userSentence }) => {
  const q = await Question.findById(questionId);
  if (!q) throw new Error('Question not found');

  const cleanUser = (userSentence || '').trim();
  const cleanTarget = (q.correctAnswer || '').trim();
  const aiRef = q.metadata?.aiReferenceAnswer || '';

  const tokenize = (s) => s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const userTokens = new Set(tokenize(cleanUser));
  const targetTokens = new Set(tokenize(cleanTarget));

  const intersection = [...userTokens].filter((t) => targetTokens.has(t));
  const union = new Set([...userTokens, ...targetTokens]);
  const similarityScore = union.size > 0 ? Math.round((intersection.length / union.size) * 100) : 0;

  const isExact = cleanUser.toLowerCase().replace(/[^\w\s]/g, '') === cleanTarget.toLowerCase().replace(/[^\w\s]/g, '');
  const isAccepted = isExact || similarityScore >= 75;

  return {
    isExact,
    similarityScore,
    isAccepted,
    userSentence: cleanUser,
    standardAnswer: cleanTarget,
    aiReferenceAnswer: aiRef,
    explanation: q.explanation,
    remark: q.metadata?.remark || ''
  };
};

module.exports = {
  getTodayMission,
  submitSession,
  submitTypingSession,
  checkWritingSentence
};
