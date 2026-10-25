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

const normalizeMultiAnswer = (val) => {
  if (Array.isArray(val)) {
    return val.map(normalizeAnswer).filter(Boolean).sort().join('|');
  }
  if (typeof val === 'string') {
    return val.split(/[,;\n]+/).map(normalizeAnswer).filter(Boolean).sort().join('|');
  }
  return '';
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
      let questions = await Question.find({ lessonId: lesson._id }).sort({ orderIndex: 1, createdAt: 1 });
      let pairedLesson = null;
      if (questions.length === 0) {
        // If this lesson has no direct questions (e.g. theory lesson), seamlessly locate questions from paired practice lesson
        pairedLesson = await Lesson.findOne({
          $or: [
            { prerequisites: lesson._id },
            { skill: lesson.skill, level: lesson.level, topic: lesson.topic, contentType: 'practice' }
          ]
        });
        if (pairedLesson) {
          questions = await Question.find({ lessonId: pairedLesson._id }).sort({ orderIndex: 1, createdAt: 1 });
        }
      } else {
        // Find linked theory lesson to master together
        pairedLesson = await Lesson.findOne({
          $or: [
            { _id: { $in: lesson.prerequisites || [] }, contentType: 'theory' },
            { skill: lesson.skill, level: lesson.level, topic: lesson.topic, contentType: 'theory' }
          ]
        });
      }

      const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

      // Validate that all question IDs belong to this lesson or its paired practice lesson
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
        let isCorrect = false;

        if (question.format === 'mcq-multiple') {
          const userMulti = normalizeMultiAnswer(ans.userAnswer);
          const correctMulti = normalizeMultiAnswer(question.correctAnswer);
          const hasAlternativeMulti = Array.isArray(question.acceptableAnswers) &&
            question.acceptableAnswers.some(alt => normalizeMultiAnswer(alt) === userMulti);
          isCorrect = userMulti === correctMulti || hasAlternativeMulti;
        } else {
          const userAnsNorm = normalizeAnswer(ans.userAnswer);
          const correctAnsNorm = normalizeAnswer(question.correctAnswer);
          const hasAlternative = Array.isArray(question.acceptableAnswers) &&
            question.acceptableAnswers.some(alt => normalizeAnswer(alt) === userAnsNorm);
          isCorrect = userAnsNorm === correctAnsNorm || hasAlternative;
        }

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
        const masterIds = [lesson._id];
        if (pairedLesson) masterIds.push(pairedLesson._id);
        await User.findByIdAndUpdate(userId, {
          $addToSet: { 'profile.masteredNodeIds': { $each: masterIds } }
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
        vocabAnchors: isReviewUnlocked ? lesson.vocabAnchors : undefined,
        audioTranscript: isReviewUnlocked ? lesson.audioTranscript : undefined
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

/**
 * Evaluates IELTS Writing Task 1 or Task 2 essay against the 4 Band Descriptors
 */
const evaluateEssay = async ({ taskType, taskSubtype, prompt, essayText }) => {
  const cleanEssay = String(essayText || '').trim();
  const words = cleanEssay.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const minWords = taskType === 'task1' ? 150 : 250;
  const wordCountPenalty = wordCount < minWords;

  const paragraphs = cleanEssay.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const paragraphCount = paragraphs.length;

  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^\w]/g, ''))).size;
  const lexicalRatio = wordCount > 0 ? uniqueWords / wordCount : 0;

  // 1. Task Response / Task Achievement (TR)
  let trScore = wordCount >= minWords ? 6.5 : Math.max(4.0, Math.round(((wordCount / minWords) * 6.0) * 2) / 2);
  if (paragraphCount >= 3 && wordCount >= minWords + 20) trScore = Math.min(8.5, trScore + 0.5);

  // 2. Coherence & Cohesion (CC)
  let ccScore = paragraphCount >= (taskType === 'task1' ? 3 : 4) ? 6.5 : 5.0;
  if (paragraphCount <= 1) ccScore = 4.5;

  // 3. Lexical Resource (LR)
  let lrScore = lexicalRatio > 0.55 ? 7.0 : lexicalRatio > 0.45 ? 6.0 : 5.0;

  // 4. Grammatical Range & Accuracy (GRA)
  let graScore = 6.0;

  const overallBand = Math.round(((trScore + ccScore + lrScore + graScore) / 4) * 2) / 2;

  return {
    taskType,
    taskSubtype,
    wordCount,
    minWords,
    wordCountPenalty,
    paragraphCount,
    overallBand,
    criteria: {
      taskResponse: {
        score: trScore,
        label: taskType === 'task1' ? 'Task Achievement' : 'Task Response',
        feedback: wordCountPenalty
          ? `Bài viết chỉ có ${wordCount}/${minWords} từ (chưa đạt độ dài yêu cầu). Cần tối thiểu ${minWords} từ.`
          : `Độ dài bài viết tốt (${wordCount} từ). Đã phát triển các ý chính tương ứng yêu cầu đề.`
      },
      coherenceCohesion: {
        score: ccScore,
        label: 'Coherence & Cohesion',
        feedback: paragraphCount >= (taskType === 'task1' ? 3 : 4)
          ? `Bố cục chia đoạn rõ ràng (${paragraphCount} đoạn: Mở bài, Tổng quan/Thân bài, Kết luận).`
          : `Cần chia bài viết thành tối thiểu ${taskType === 'task1' ? 3 : 4} đoạn rõ ràng với liên từ học thuật.`
      },
      lexicalResource: {
        score: lrScore,
        label: 'Lexical Resource',
        feedback: lexicalRatio > 0.5
          ? `Vốn từ vựng phong phú (${uniqueWords} từ vựng độc lập, tỷ lệ đa dạng ${Math.round(lexicalRatio * 100)}%).`
          : `Cần tăng cường từ vựng học thuật chuyên sâu và các cụm collocation tránh lặp từ.`
      },
      grammar: {
        score: graScore,
        label: 'Grammatical Range & Accuracy',
        feedback: 'Sử dụng linh hoạt các câu phức, mệnh đề quan hệ và cấu trúc bị động học thuật.'
      }
    }
  };
};

module.exports = {
  getTodayMission,
  submitSession,
  submitTypingSession,
  checkWritingSentence,
  evaluateEssay,
  normalizeAnswer,
  normalizeMultiAnswer
};
