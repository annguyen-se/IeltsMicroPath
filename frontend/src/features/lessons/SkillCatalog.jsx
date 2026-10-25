/* Hallmark · macrostructure: Narrative Workflow · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Narrative Workflow · design-system: design.md · designed-as-app */
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio } from '../../utils/audio';

import TheoryReaderModal from './TheoryReaderModal';
import PracticeDrillModal from './PracticeDrillModal';
import LessonCard from './LessonCard';
import RoadmapTimeline from './RoadmapTimeline';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  FileText,
  AudioLines,
  Sparkles,
  BookMarked,
  Route,
  FolderOpen,
  SlidersHorizontal,
  Compass,
  Search,
  Zap,
} from 'lucide-react';

const SKILLS = [
  { key: 'all', label: 'Tất cả kỹ năng', icon: Sparkles },
  { key: 'reading', label: 'Reading', icon: BookOpen },
  { key: 'listening', label: 'Listening', icon: Headphones },
  { key: 'writing', label: 'Writing', icon: PenLine },
  { key: 'speaking', label: 'Speaking', icon: Mic },
  { key: 'grammar', label: 'Grammar', icon: FileText },
  { key: 'phonetics', label: 'Phonetics', icon: AudioLines },
];

const STAGES = [
  { key: 'all', label: 'Tất cả cấp độ', band: '0 – 8.0+', subtitle: 'Toàn bộ lộ trình IELTS' },
  { key: '0', label: 'Level 0', band: 'Band 0–4.0', cefr: 'A1–A2', subtitle: 'Khởi động & Mất gốc' },
  { key: '1', label: 'Level 1', band: 'Band 4.0–5.5', cefr: 'A2–B1', subtitle: 'Nền tảng 4 kỹ năng' },
  { key: '2', label: 'Level 2', band: 'Band 5.5–6.5', cefr: 'B1–B2', subtitle: 'Chiến thuật phòng thi' },
  { key: '3', label: 'Level 3', band: 'Band 6.5–7.5', cefr: 'B2–C1', subtitle: 'Luyện đề nâng cao' },
  { key: '4', label: 'Level 4', band: 'Band 7.5–8.0+', cefr: 'C1', subtitle: 'Thành thạo tối đa' },
];

const SKILL_THEME = {
  reading: {
    name: 'Reading',
    icon: BookOpen,
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    dotColor: '#059669',
  },
  listening: {
    name: 'Listening',
    icon: Headphones,
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    dotColor: '#0284c7',
  },
  writing: {
    name: 'Writing',
    icon: PenLine,
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    dotColor: '#d97706',
  },
  speaking: {
    name: 'Speaking',
    icon: Mic,
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    dotColor: '#e11d48',
  },
  grammar: {
    name: 'Grammar',
    icon: FileText,
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    dotColor: '#6366f1',
  },
  phonetics: {
    name: 'Phonetics',
    icon: AudioLines,
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    dotColor: '#0d9488',
  },
};

const QUIZ_PROGRESS_STORAGE_PREFIX = 'ieltstrain_quiz_progress_v1_';

const getSavedQuizProgress = (lessonId) => {
  if (!lessonId) return null;
  try {
    const raw = localStorage.getItem(`${QUIZ_PROGRESS_STORAGE_PREFIX}${lessonId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('[Get Quiz Progress Error]:', err);
    return null;
  }
};

const saveQuizProgress = (lessonId, answers, results, activeIndex) => {
  if (!lessonId) return;
  try {
    const data = {
      answers,
      results,
      lastActiveIndex: activeIndex,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${QUIZ_PROGRESS_STORAGE_PREFIX}${lessonId}`, JSON.stringify(data));
  } catch (err) {
    console.warn('[Save Quiz Progress Error]:', err);
  }
};

const clearQuizProgress = (lessonId) => {
  if (!lessonId) return;
  try {
    localStorage.removeItem(`${QUIZ_PROGRESS_STORAGE_PREFIX}${lessonId}`);
  } catch (err) {
    console.warn('[Clear Quiz Progress Error]:', err);
  }
};

export default function SkillCatalog({ onBack, isAuthenticated = false, onOpenAuth }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSkill = searchParams.get('skill') || 'all';
  const [selectedSkill, setSelectedSkill] = useState(initialSkill);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ready' | 'mastered' | 'locked'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('roadmap'); // 'roadmap' | 'topic' | 'grid'

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dedicated Theory Reader Modal state (No 3-tab modal)
  const [activeTheoryLessonId, setActiveTheoryLessonId] = useState(null);
  const [theoryLessonDetail, setTheoryLessonDetail] = useState(null);
  const [loadingTheory, setLoadingTheory] = useState(false);
  const [isSubmittingTheory, setIsSubmittingTheory] = useState(false);

  // Dedicated Practice Drill Modal state (for Grammar & Phonetics)
  const [activePracticeLessonId, setActivePracticeLessonId] = useState(null);
  const [practiceLessonDetail, setPracticeLessonDetail] = useState(null);
  const [loadingPractice, setLoadingPractice] = useState(false);

  // Quiz state inside Practice Drill modal
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [questionResults, setQuestionResults] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [isStepperExpanded, setIsStepperExpanded] = useState(false);

  // Vocab enrollment state
  const [enrolledVocabs, setEnrolledVocabs] = useState(new Set());
  const [enrollNotice, setEnrollNotice] = useState('');

  // Dynamic topic extraction from loaded curriculum
  const availableTopics = useMemo(() => {
    const counts = {};
    lessons.forEach((l) => {
      const top = l.topic || 'General Academic';
      counts[top] = (counts[top] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [lessons]);

  // Progress stats per level
  const levelProgressStats = useMemo(() => {
    const stats = {};
    [0, 1, 2, 3, 4].forEach((lvl) => {
      const lvlLessons = lessons.filter((l) => l.level === lvl);
      const total = lvlLessons.length;
      const mastered = lvlLessons.filter((l) => l.isMastered).length;
      const ready = lvlLessons.filter((l) => l.isUnlocked && !l.isMastered).length;
      const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
      stats[lvl] = { total, mastered, ready, percent };
    });
    return stats;
  }, [lessons]);

  // Statistics for overall Roadmap Tracker
  const roadmapStats = useMemo(() => {
    const total = lessons.length;
    const mastered = lessons.filter((l) => l.isMastered).length;
    const ready = lessons.filter((l) => l.isUnlocked && !l.isMastered).length;
    const locked = lessons.filter((l) => !l.isUnlocked && !l.isMastered).length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, ready, locked, percent };
  }, [lessons]);

  // Next Milestone Lesson to recommend
  const nextMilestone = useMemo(() => {
    if (selectedLevel !== 'all') {
      const lvlNum = Number(selectedLevel);
      return lessons.find((l) => l.level === lvlNum && l.isUnlocked && !l.isMastered) || null;
    }
    return lessons.find((l) => l.isUnlocked && !l.isMastered) || null;
  }, [lessons, selectedLevel]);

  // Pure-theory lessons (no paired practice in their skill+level+topic group)
  // bridge to the next practice milestone on the roadmap instead.
  const activeTheoryFallbackPractice = useMemo(() => {
    if (!activeTheoryLessonId) return null;
    const sorted = [...lessons].sort(
      (a, b) => a.level - b.level || (a.orderIndex || 0) - (b.orderIndex || 0),
    );
    const currentIdx = sorted.findIndex((l) => l._id === activeTheoryLessonId);
    if (currentIdx === -1) return null;
    const after = sorted.slice(currentIdx + 1).filter((l) => l.contentType === 'practice');
    return after.find((l) => l.isUnlocked && !l.isMastered) || after[0] || null;
  }, [lessons, activeTheoryLessonId]);

  // Filtered and sorted lessons
  const processedLessons = useMemo(() => {
    let list = [...lessons];

    // Filter by Level
    if (selectedLevel !== 'all') {
      const lvl = Number(selectedLevel);
      list = list.filter((l) => l.level === lvl);
    }

    // Filter by Topic
    if (selectedTopic !== 'all') {
      list = list.filter((l) => (l.topic || 'General Academic') === selectedTopic);
    }

    // Filter by Status
    if (statusFilter === 'ready') {
      list = list.filter((l) => l.isUnlocked && !l.isMastered);
    } else if (statusFilter === 'mastered') {
      list = list.filter((l) => l.isMastered);
    } else if (statusFilter === 'locked') {
      list = list.filter((l) => !l.isUnlocked && !l.isMastered);
    }

    // Filter by Search Keyword
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (l) =>
          (l.title || '').toLowerCase().includes(q) ||
          (l.topic || '').toLowerCase().includes(q) ||
          (l.skill || '').toLowerCase().includes(q) ||
          (l.slug || '').toLowerCase().includes(q),
      );
    }

    // Sort order
    if (sortBy === 'roadmap') {
      list.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        const aRank = a.isUnlocked && !a.isMastered ? 1 : a.isMastered ? 2 : 3;
        const bRank = b.isUnlocked && !b.isMastered ? 1 : b.isMastered ? 2 : 3;
        if (aRank !== bRank) return aRank - bRank;
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      });
    } else if (sortBy === 'topic') {
      list.sort((a, b) => {
        const topA = (a.topic || 'General Academic').toLowerCase();
        const topB = (b.topic || 'General Academic').toLowerCase();
        if (topA !== topB) return topA.localeCompare(topB);
        if (a.level !== b.level) return a.level - b.level;
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      });
    } else {
      list.sort((a, b) => a.level - b.level || (a.orderIndex || 0) - (b.orderIndex || 0));
    }

    return list;
  }, [lessons, selectedLevel, selectedTopic, statusFilter, searchKeyword, sortBy]);

  // Grouped by Topic
  const groupedByTopic = useMemo(() => {
    if (sortBy !== 'topic') return null;
    const groups = new Map();
    processedLessons.forEach((l) => {
      const top = l.topic || 'General Academic';
      if (!groups.has(top)) groups.set(top, []);
      groups.get(top).push(l);
    });
    return Array.from(groups.entries());
  }, [processedLessons, sortBy]);

  const handleCompleteTheoryLesson = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsSubmittingTheory(true);
    try {
      const res = await api.post('/learning/submit-session', {
        lessonResults: {
          lessonId: activeTheoryLessonId,
          answers: [],
        },
      });

      if (res?.isLessonMastered || res?.lessonReviewData?.passed) {
        setEnrollNotice('✓ Đã hoàn thành bài học lý thuyết! Mốc thực hành tiếp theo đã được mở khóa.');
        await fetchLessons();
      }
    } catch (err) {
      console.warn('[Complete Theory Error]:', err.message);
    } finally {
      setIsSubmittingTheory(false);
    }
  };

  const submitCompletedQuiz = async () => {
    if (!isAuthenticated) return;
    try {
      const allQuestions = practiceLessonDetail?.questions || [];
      const answersPayload = allQuestions.map((q) => ({
        questionId: q._id,
        userAnswer: quizAnswers[q._id] || '',
      }));

      const res = await api.post('/learning/submit-session', {
        lessonResults: {
          lessonId: activePracticeLessonId,
          answers: answersPayload,
        },
      });

      if (res?.isLessonMastered || res?.lessonReviewData?.passed) {
        setEnrollNotice('✓ Hoàn thành bài tập! Mốc tiếp theo trên lộ trình đã được mở khóa.');
        await fetchLessons();
      }
    } catch (err) {
      console.warn('[Quiz Submit Error]:', err.message);
    }
  };

  const handleCheckSingleQuestion = async (q) => {
    const userAns = (quizAnswers[q._id] || '').trim();
    if (!userAns) return;

    const cleanAns = userAns
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .replace(/[.,!?;:]+$/, '');
    const correctAns = (q.correctAnswer || '')
      .trim()
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .replace(/[.,!?;:]+$/, '');

    const hasVariant =
      (q.options &&
        q.options.some(
          (opt) =>
            opt
              .trim()
              .toLowerCase()
              .replace(/[.,!?;:]+$/, '') === cleanAns && cleanAns === correctAns,
        )) ||
      (q.acceptableAnswers &&
        q.acceptableAnswers.some(
          (opt) =>
            opt
              .trim()
              .toLowerCase()
              .replace(/[.,!?;:]+$/, '') === cleanAns,
        ));

    const isCorrect = cleanAns === correctAns || hasVariant;

    const updatedResults = {
      ...questionResults,
      [q._id]: {
        checked: true,
        isCorrect,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      },
    };
    setQuestionResults(updatedResults);

    saveQuizProgress(activePracticeLessonId, quizAnswers, updatedResults, currentQuizIndex);

    const allQuestions = practiceLessonDetail?.questions || [];
    const answeredCount = Object.keys(updatedResults).length;

    if (answeredCount === allQuestions.length) {
      await submitCompletedQuiz();
    } else if (answeredCount % 5 === 0) {
      submitCompletedQuiz();
    }
  };

  const handleRetryQuestion = (qId) => {
    const nextResults = { ...questionResults };
    delete nextResults[qId];
    setQuestionResults(nextResults);

    const nextAnswers = { ...quizAnswers, [qId]: '' };
    setQuizAnswers(nextAnswers);

    saveQuizProgress(activePracticeLessonId, nextAnswers, nextResults, currentQuizIndex);
  };

  const handleResetQuiz = () => {
    clearQuizProgress(activePracticeLessonId);
    setCurrentQuizIndex(0);
    setQuizAnswers({});
    setQuestionResults({});
    setQuizFinished(false);
    setIsStepperExpanded(false);
    setEnrollNotice('Đã đặt lại tiến trình bài tập. Bắt đầu lại từ câu 1.');
    setTimeout(() => setEnrollNotice(''), 3000);
  };

  const handleEnrollSingleVocab = async (vocabId) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      await api.post('/reviews/enroll', { vocabId });
      setEnrolledVocabs((prev) => new Set([...prev, vocabId]));
      setEnrollNotice('Enrolled in Leitner Box 1 for spaced review!');
      setTimeout(() => setEnrollNotice(''), 2500);
    } catch (err) {
      setEnrollNotice(`Error: ${err.message}`);
    }
  };

  const handleEnrollAllVocabsInLesson = async (vocabs = []) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const vocabIds = (vocabs || []).map((v) => v._id);
    if (vocabIds.length === 0) return;

    try {
      await api.post('/reviews/enroll', { vocabIds });
      setEnrolledVocabs((prev) => new Set([...prev, ...vocabIds]));
      setEnrollNotice(`All ${vocabIds.length} academic words enrolled in Leitner Box 1!`);
      setTimeout(() => setEnrollNotice(''), 3000);
    } catch (err) {
      setEnrollNotice(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    const s = searchParams.get('skill') || 'all';
    setSelectedSkill(s);
  }, [searchParams]);

  useEffect(() => {
    fetchLessons();
  }, [selectedSkill]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSkill !== 'all') params.append('skill', selectedSkill);

      const res = await api.get(`/lessons?${params.toString()}`);
      setLessons(res?.lessons || []);
    } catch (err) {
      console.warn('[Fetch Lessons Error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSkill = (skillKey) => {
    setSelectedSkill(skillKey);
    setSearchParams(skillKey === 'all' ? {} : { skill: skillKey });
  };

  const handleOpenLesson = async (lesson) => {
    if (!lesson) return;

    // Paired/related lesson stubs (from "Tiến hành Thực hành" bridge or paired
    // links) don't carry isUnlocked/isMastered — resolve the full record from
    // the loaded curriculum before checking the lock state.
    let target = lesson;
    if (lesson.isUnlocked === undefined && lesson.isMastered === undefined) {
      target = lessons.find((l) => l._id === lesson._id) || lesson;
    }

    if (!target.isUnlocked && !target.isMastered) {
      setEnrollNotice(
        '🔒 Bài thực hành này đang khóa. Hãy bấm "Đánh dấu đã hiểu lý thuyết" để mở khóa cột mốc tiếp theo.',
      );
      setTimeout(() => setEnrollNotice(''), 4000);
      return;
    }

    // 1. Reading Practice -> dedicated reading room
    if (target.skill === 'reading' && target.contentType === 'practice') {
      navigate(`/reading/${target._id}`);
      return;
    }

    // 2. Listening Practice -> dedicated listening room
    if (target.skill === 'listening' && target.contentType === 'practice') {
      navigate(`/listening/${target._id}`);
      return;
    }

    // 3. Writing Practice -> writing studio
    if (target.skill === 'writing' && target.contentType === 'practice') {
      navigate('/writing');
      return;
    }

    // 4. Speaking Practice -> speaking studio
    if (target.skill === 'speaking' && target.contentType === 'practice') {
      navigate('/speaking');
      return;
    }

    // 5. Theory Lesson (any skill) -> Open clean Theory Reader Modal with direct "Làm bài thực hành ngay" bridge!
    if (target.contentType === 'theory') {
      setActivePracticeLessonId(null);
      setPracticeLessonDetail(null);
      setActiveTheoryLessonId(target._id);
      try {
        setLoadingTheory(true);
        const res = await api.get(`/lessons/${target._id}`);
        setTheoryLessonDetail(res || null);
      } catch (err) {
        console.warn('[Fetch Theory Lesson Error]:', err.message);
      } finally {
        setLoadingTheory(false);
      }
      return;
    }

    // 6. Practice Lesson for Grammar / Phonetics -> Open dedicated Drill Workbench!
    setActiveTheoryLessonId(null);
    setTheoryLessonDetail(null);
    setActivePracticeLessonId(target._id);
    try {
      setLoadingPractice(true);
      const res = await api.get(`/lessons/${target._id}`);
      setPracticeLessonDetail(res || null);

      const localSaved = getSavedQuizProgress(target._id);
      const questionsList = res?.questions || [];

      let restoredAnswers = {};
      let restoredResults = {};
      let targetIndex = 0;

      if (localSaved && localSaved.results && Object.keys(localSaved.results).length > 0) {
        restoredAnswers = localSaved.answers || {};
        restoredResults = localSaved.results || {};
        const firstUnanswered = questionsList.findIndex((q) => !restoredResults[q._id]?.checked);
        targetIndex = firstUnanswered !== -1 ? firstUnanswered : (localSaved.lastActiveIndex ?? 0);
      } else if (res?.lastAttempt?.answers && res.lastAttempt.answers.length > 0) {
        res.lastAttempt.answers.forEach((ans) => {
          const q = questionsList.find((item) => (item._id || '').toString() === (ans.questionId || '').toString());
          if (q) {
            restoredAnswers[q._id] = ans.userAnswer || '';
            restoredResults[q._id] = {
              checked: true,
              isCorrect: ans.isCorrect,
              userAnswer: ans.userAnswer || '',
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || '',
            };
          }
        });
        const firstUnanswered = questionsList.findIndex((q) => !restoredResults[q._id]?.checked);
        targetIndex = firstUnanswered !== -1 ? firstUnanswered : 0;
      }

      setQuizAnswers(restoredAnswers);
      setQuestionResults(restoredResults);
      setCurrentQuizIndex(targetIndex);
      setIsStepperExpanded(false);
      setQuizFinished(false);

      const answeredCount = Object.keys(restoredResults).length;
      if (answeredCount > 0 && answeredCount < questionsList.length) {
        setEnrollNotice(
          `Đã khôi phục tiến trình làm bài: Bạn đã làm ${answeredCount}/${questionsList.length} câu. Tiếp tục tại câu ${targetIndex + 1}.`,
        );
      } else if (answeredCount > 0 && answeredCount === questionsList.length) {
        setEnrollNotice(
          `Bài tập đã hoàn thành (${answeredCount}/${questionsList.length} câu). Bạn có thể xem lại hoặc đặt lại từ đầu.`,
        );
      } else {
        setEnrollNotice('');
      }
    } catch (err) {
      console.warn('[Fetch Practice Drill Error]:', err.message);
    } finally {
      setLoadingPractice(false);
    }
  };

  const playAudio = (url, word) => {
    playWordAudio(url, word);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* ─── 1. Academic Syllabus Header ─── */}
      <section className='catalog-header'>
        <div className='section-head' style={{ marginBottom: 'var(--space-sm)' }}>
          <span className='section-kicker'>
            <BookMarked size={13} aria-hidden='true' /> IELTS Curriculum & Prerequisite Graph
          </span>
          <div className='section-head-row'>
            <div>
              <h1 className='section-title'>Curriculum Library & Learning Roadmap</h1>
              <p className='section-desc'>
                Structured academic micro-lessons arranged along a prerequisite roadmap: acquire sentence theory,
                master academic collocations, and evaluate drills to activate subsequent milestones.
              </p>
            </div>
            <button className='btn btn-secondary btn-sm' onClick={() => (onBack ? onBack() : navigate('/'))}>
              <ArrowLeft size={14} aria-hidden='true' />
              <span>Back to Workspace</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. Interactive Level Pathway Stepper Track (Band 0 -> 8.0+) ─── */}
      <section className='bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm'>
        <div className='flex items-center justify-between mb-3 flex-wrap gap-2'>
          <div className='flex items-center gap-2'>
            <Compass size={16} className='text-orange-700 dark:text-orange-500' />
            <span className='text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300'>
              Lộ trình 5 cấp độ chinh phục IELTS (Band 0 – 8.0+)
            </span>
          </div>
          <span className='text-xs font-mono text-stone-500'>
            Tổng tiến trình: {roadmapStats.mastered}/{roadmapStats.total} bài hoàn thành ({roadmapStats.percent}%)
          </span>
        </div>

        {/* 5-Level Milestone Cards Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5'>
          {STAGES.map((stg) => {
            const isSelected = selectedLevel === stg.key;
            const lvlNum = stg.key === 'all' ? null : Number(stg.key);
            const stat = lvlNum !== null ? levelProgressStats[lvlNum] : null;
            const isLvlDone = stat && stat.total > 0 && stat.mastered === stat.total;

            return (
              <button
                key={stg.key}
                type='button'
                onClick={() => setSelectedLevel(stg.key)}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-600 shadow-sm ring-1 ring-orange-500'
                    : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div>
                  <div className='flex items-center justify-between gap-1 mb-1'>
                    <span className='text-[11px] font-mono font-bold uppercase text-stone-800 dark:text-stone-200'>
                      {stg.label}
                    </span>
                    {isLvlDone && (
                      <span className='w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold'>
                        ✓
                      </span>
                    )}
                  </div>
                  <div className='text-xs font-semibold text-orange-700 dark:text-orange-500'>
                    {stg.band}
                  </div>
                  <div className='text-[10.5px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5'>
                    {stg.subtitle}
                  </div>
                </div>

                {stat && stat.total > 0 && (
                  <div className='space-y-1 pt-1 border-t border-stone-200/60 dark:border-stone-700/60'>
                    <div className='flex justify-between text-[10px] font-mono text-stone-500'>
                      <span>{stat.mastered}/{stat.total} bài</span>
                      <span>{stat.percent}%</span>
                    </div>
                    <div className='w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden'>
                      <div
                        className='bg-emerald-600 h-full rounded-full transition-all'
                        style={{ width: `${stat.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── 3. Next Milestone Hero Action Card ─── */}
      {nextMilestone && (
        <section className='bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-stone-50/90 dark:from-stone-900 dark:via-stone-900 dark:to-stone-850 border-2 border-orange-600/70 dark:border-orange-500/70 rounded-2xl p-4 sm:p-5 shadow-sm'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='flex items-start gap-3.5'>
              <div className='w-11 h-11 rounded-xl bg-orange-700 text-white flex items-center justify-center shrink-0 shadow-sm'>
                <Zap size={22} />
              </div>
              <div>
                <div className='flex items-center gap-2 mb-1 flex-wrap'>
                  <span className='text-[11px] font-mono font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400'>
                    Trạm học tập tiếp theo trên lộ trình của bạn
                  </span>
                  <span className='px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-stone-800 border border-orange-200 dark:border-orange-800 text-stone-700 dark:text-stone-300'>
                    Level {nextMilestone.level} · {nextMilestone.skill?.toUpperCase()}
                  </span>
                </div>
                <h3 className='text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight'>
                  {nextMilestone.title}
                </h3>
                <p className='text-xs text-stone-600 dark:text-stone-400 mt-1'>
                  Chủ đề: <strong>{nextMilestone.topic || 'General Academic'}</strong> · {nextMilestone.contentType === 'theory' ? '📘 Lý thuyết & Chiến thuật làm bài' : '🎯 Luyện đề thực hành & Bài tập'}
                </p>
              </div>
            </div>

            <button
              type='button'
              className='px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95'
              onClick={() => handleOpenLesson(nextMilestone)}
            >
              <span>Vào học bài này ngay</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* ─── 4. Filter & View Switcher Console ─── */}
      <section className='bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5'>
        {/* Track filter row */}
        <div className='filter-track-bar' role='tablist' aria-label='Filter by skill track'>
          {SKILLS.map((sk) => {
            const Icon = sk.icon;
            const isActive = selectedSkill === sk.key;
            return (
              <button
                key={sk.key}
                role='tab'
                aria-selected={isActive}
                className={`filter-chip ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectSkill(sk.key)}>
                <Icon size={14} aria-hidden='true' />
                <span>{sk.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controls Row: Search, Topic, Status, View Mode */}
        <div className='flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-stone-100 dark:border-stone-800'>
          {/* Left: Search input + Topic + Status */}
          <div className='flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]'>
            {/* Search Input */}
            <div className='relative min-w-[180px] flex-1 max-w-xs'>
              <input
                type='text'
                className='w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-600 text-stone-800 dark:text-stone-100 placeholder-stone-400'
                placeholder='Tìm bài học...'
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Search size={13} className='absolute left-2.5 top-2.5 text-stone-400' />
              {searchKeyword && (
                <button
                  type='button'
                  className='absolute right-2 top-2 text-stone-400 hover:text-stone-600'
                  onClick={() => setSearchKeyword('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Topic Filter */}
            <div className='flex items-center gap-1.5'>
              <FolderOpen size={14} className='text-orange-700 dark:text-orange-500 shrink-0' />
              <select
                className='input-select text-xs py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800'
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value='all'>Tất cả chủ đề ({availableTopics.length})</option>
                {availableTopics.map((t) => (
                  <option key={t.topic} value={t.topic}>
                    {t.topic} ({t.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Pills */}
            <div className='flex items-center gap-1'>
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'ready', label: '⚡ Sẵn sàng' },
                { key: 'mastered', label: '✓ Xong' },
                { key: 'locked', label: '🔒 Khóa' },
              ].map((st) => (
                <button
                  key={st.key}
                  type='button'
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    statusFilter === st.key
                      ? 'bg-orange-700 text-white font-semibold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                  onClick={() => setStatusFilter(st.key)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: View Mode Switcher */}
          <div className='flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700'>
            <button
              type='button'
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortBy === 'roadmap'
                  ? 'bg-white dark:bg-stone-900 text-orange-700 dark:text-orange-500 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              onClick={() => setSortBy('roadmap')}
              title='Lộ trình tuần tự theo chặng học'
            >
              <Route size={13} />
              <span>Lộ trình chặng</span>
            </button>
            <button
              type='button'
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortBy === 'topic'
                  ? 'bg-white dark:bg-stone-900 text-orange-700 dark:text-orange-500 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              onClick={() => setSortBy('topic')}
              title='Gom nhóm theo khối chủ đề'
            >
              <FolderOpen size={13} />
              <span>Khối chủ đề</span>
            </button>
            <button
              type='button'
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortBy === 'grid'
                  ? 'bg-white dark:bg-stone-900 text-orange-700 dark:text-orange-500 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              onClick={() => setSortBy('grid')}
              title='Xem danh mục dạng lưới'
            >
              <SlidersHorizontal size={13} />
              <span>Lưới thẻ</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 5. Curriculum Modules Display ─── */}
      {loading && (
        <div className='card' style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>Đang nạp dữ liệu lộ trình học...</p>
        </div>
      )}

      {!loading && processedLessons.length === 0 && (
        <div className='card' style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
            Không tìm thấy bài học nào phù hợp với bộ lọc hiện tại.
          </p>
          {(selectedTopic !== 'all' || selectedLevel !== 'all' || selectedSkill !== 'all' || statusFilter !== 'all' || searchKeyword) && (
            <button
              type='button'
              className='btn btn-secondary btn-sm'
              style={{ marginTop: 12 }}
              onClick={() => {
                setSelectedTopic('all');
                setSelectedLevel('all');
                setSelectedSkill('all');
                setStatusFilter('all');
                setSearchKeyword('');
                setSearchParams({});
              }}>
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {!loading && processedLessons.length > 0 && (
        <>
          {sortBy === 'roadmap' ? (
            /* Connected Sequential Timeline Roadmap */
            <RoadmapTimeline
              lessons={processedLessons}
              nextMilestone={nextMilestone}
              stages={STAGES}
              skillThemeMap={SKILL_THEME}
              onOpen={handleOpenLesson}
              onOpenPaired={handleOpenLesson}
            />
          ) : sortBy === 'topic' && groupedByTopic ? (
            /* Grouped by Topic Display */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {groupedByTopic.map(([top, groupLessons]) => {
                const gMastered = groupLessons.filter((l) => l.isMastered).length;
                const gPercent = Math.round((gMastered / groupLessons.length) * 100);

                return (
                  <div key={top} className='bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4'>
                    <div className='flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 flex-wrap gap-2'>
                      <div className='flex items-center gap-2.5'>
                        <div className='w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 flex items-center justify-center shrink-0'>
                          <FolderOpen size={16} />
                        </div>
                        <div>
                          <h3 className='text-base font-bold text-stone-800 dark:text-stone-100'>
                            Chủ đề: {top}
                          </h3>
                          <span className='text-xs text-stone-500'>
                            {gMastered}/{groupLessons.length} bài hoàn thành ({gPercent}%)
                          </span>
                        </div>
                      </div>

                      <div className='w-28 bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden'>
                        <div className='bg-emerald-600 h-full rounded-full' style={{ width: `${gPercent}%` }} />
                      </div>
                    </div>

                    <div className='syllabus-grid'>
                      {groupLessons.map((lesson) => (
                        <LessonCard
                          key={lesson._id}
                          lesson={lesson}
                          skillTheme={SKILL_THEME[lesson.skill]}
                          onOpen={handleOpenLesson}
                          onOpenPaired={handleOpenLesson}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard Grid Display */
            <div className='syllabus-grid'>
              {processedLessons.map((lesson, idx) => (
                <LessonCard
                  key={lesson._id}
                  lesson={lesson}
                  stepNumber={idx + 1}
                  isNext={nextMilestone && nextMilestone._id === lesson._id}
                  skillTheme={SKILL_THEME[lesson.skill]}
                  onOpen={handleOpenLesson}
                  onOpenPaired={handleOpenLesson}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── 4. Dedicated Theory Lesson Reader Modal (Direct Bridge to Practice) ─── */}
      {activeTheoryLessonId && (
        <TheoryReaderModal
          lessonDetail={theoryLessonDetail}
          loading={loadingTheory}
          isMastered={
            !!lessons.find((l) => l._id === activeTheoryLessonId)?.isMastered ||
            !!theoryLessonDetail?.lastAttempt?.passed
          }
          onClose={() => {
            setActiveTheoryLessonId(null);
            setTheoryLessonDetail(null);
          }}
          onComplete={handleCompleteTheoryLesson}
          isSubmittingComplete={isSubmittingTheory}
          onOpenPractice={handleOpenLesson}
          fallbackPractice={activeTheoryFallbackPractice}
          enrolledVocabs={enrolledVocabs}
          onEnrollVocab={handleEnrollSingleVocab}
          onEnrollAllVocabs={handleEnrollAllVocabsInLesson}
          notice={enrollNotice}
          onClearNotice={() => setEnrollNotice('')}
          onPlayAudio={playAudio}
        />
      )}

      {/* ─── 5. Dedicated Practice Drill Modal (Grammar & Phonetics Workbench) ─── */}
      {activePracticeLessonId && (
        <PracticeDrillModal
          practiceLessonDetail={practiceLessonDetail}
          loading={loadingPractice}
          onClose={() => {
            setActivePracticeLessonId(null);
            setPracticeLessonDetail(null);
          }}
          quizAnswers={quizAnswers}
          onAnswerChange={(qId, val) => setQuizAnswers((prev) => ({ ...prev, [qId]: val }))}
          questionResults={questionResults}
          currentQuizIndex={currentQuizIndex}
          onSelectQuizIndex={(idx) => setCurrentQuizIndex(idx)}
          onCheckSingleQuestion={handleCheckSingleQuestion}
          onRetryQuestion={handleRetryQuestion}
          onResetQuiz={handleResetQuiz}
          quizFinished={quizFinished}
          onSetQuizFinished={(val) => setQuizFinished(val)}
          isStepperExpanded={isStepperExpanded}
          onToggleStepperExpanded={() => setIsStepperExpanded((prev) => !prev)}
          onPlayAudio={playAudio}
        />
      )}
    </div>
  );
}
