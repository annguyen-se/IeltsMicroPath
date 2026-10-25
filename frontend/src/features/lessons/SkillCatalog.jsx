/* Hallmark · macrostructure: Narrative Workflow · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Narrative Workflow · design-system: design.md · designed-as-app */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio } from '../../utils/audio';
import MarkdownView from '../../components/MarkdownView';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  FileText,
  AudioLines,
  Check,
  Lock,
  Play,
  Volume2,
  X,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  Sparkles,
  BookMarked,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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

  // Active study modal state
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [lessonDetail, setLessonDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'vocab' | 'quiz'

  // Quiz state inside lesson modal
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [questionResults, setQuestionResults] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [isStepperExpanded, setIsStepperExpanded] = useState(false);
  const [, setIsSubmittingQuiz] = useState(false);
  const [isSubmittingTheory, setIsSubmittingTheory] = useState(false);
  const currentButtonRef = useRef(null);

  useEffect(() => {
    if (currentButtonRef.current) {
      currentButtonRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }, [currentQuizIndex]);

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
      // Grid default order
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
          lessonId: activeLessonId,
          answers: [],
        },
      });

      if (res?.isLessonMastered || res?.lessonReviewData?.passed) {
        setEnrollNotice('✓ Đã hoàn thành bài học lý thuyết! Mốc kỹ năng tiếp theo trên lộ trình đã được mở khóa.');
        await fetchLessons();
      }
    } catch (err) {
      console.warn('[Complete Theory Error]:', err.message);
    } finally {
      setIsSubmittingTheory(false);
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

    // Save progress to localStorage immediately
    saveQuizProgress(activeLessonId, quizAnswers, updatedResults, currentQuizIndex);

    const allQuestions = lessonDetail?.questions || [];
    const answeredCount = Object.keys(updatedResults).length;

    if (answeredCount === allQuestions.length) {
      await submitCompletedQuiz(updatedResults);
    } else if (answeredCount % 5 === 0) {
      submitCompletedQuiz(updatedResults);
    }
  };

  const handleRetryQuestion = (qId) => {
    const nextResults = { ...questionResults };
    delete nextResults[qId];
    setQuestionResults(nextResults);

    const nextAnswers = { ...quizAnswers, [qId]: '' };
    setQuizAnswers(nextAnswers);

    saveQuizProgress(activeLessonId, nextAnswers, nextResults, currentQuizIndex);
  };

  const handleResetQuiz = () => {
    clearQuizProgress(activeLessonId);
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

  const handleEnrollAllVocabsInLesson = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const vocabIds = (lessonDetail?.vocabularies || []).map((v) => v._id);
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
    if (!lesson.isUnlocked && !lesson.isMastered) {
      return;
    }

    if (lesson.skill === 'reading' && lesson.contentType === 'practice' && lesson.hasPassage) {
      navigate(`/reading/${lesson._id}`);
      return;
    }

    if (lesson.skill === 'listening' && lesson.contentType === 'practice' && lesson.hasAudio) {
      navigate(`/listening/${lesson._id}`);
      return;
    }

    setActiveLessonId(lesson._id);
    setActiveTab(lesson.contentType === 'practice' ? 'quiz' : 'theory');
    setIsStepperExpanded(false);
    setQuizFinished(false);

    try {
      setLoadingDetail(true);
      const res = await api.get(`/lessons/${lesson._id}`);
      setLessonDetail(res || null);

      // Restore saved progress (LocalStorage priority, with Server lastAttempt fallback)
      const localSaved = getSavedQuizProgress(lesson._id);
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
      console.warn('[Fetch Lesson Detail Error]:', err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const playAudio = (url, word) => {
    playWordAudio(url, word);
  };

  const renderLessonCard = (lesson, stepNumber = null) => {
    const isMastered = lesson.status === 'mastered';
    const isUnlocked = lesson.status === 'unlocked' || isMastered;
    const isNext = nextMilestone && nextMilestone._id === lesson._id;
    const skillMeta = SKILL_THEME[lesson.skill] || {
      name: lesson.skill?.toUpperCase(),
      icon: BookOpen,
      badgeBg: 'bg-stone-100 text-stone-700 border-stone-300',
      dotColor: 'var(--color-accent)',
    };
    const SkillIcon = skillMeta.icon;

    return (
      <div
        key={lesson._id}
        className={`syllabus-card ${!isUnlocked ? 'is-locked' : ''} ${isNext ? 'ring-2 ring-orange-500 shadow-md' : ''}`}
        style={{
          borderLeft: isMastered
            ? '3px solid var(--color-moss)'
            : isUnlocked
              ? '3px solid var(--color-accent)'
              : '3px solid var(--color-border)',
        }}>
        <div>
          <div className='syllabus-meta-row'>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {stepNumber !== null && (
                <span
                  className='syllabus-badge'
                  style={{
                    background: isMastered
                      ? 'var(--color-moss-soft)'
                      : isUnlocked
                      ? 'var(--color-accent-soft)'
                      : 'var(--color-paper-3)',
                    color: isMastered
                      ? 'var(--color-moss)'
                      : isUnlocked
                      ? 'var(--color-accent)'
                      : 'var(--color-ink-muted)',
                    fontWeight: 700,
                  }}>
                  CHẶNG #{stepNumber}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold border ${skillMeta.badgeBg}`}>
                <SkillIcon size={11} />
                <span>LEVEL {lesson.level} · {skillMeta.name}</span>
              </span>
              <span className='syllabus-badge'>
                {lesson.contentType === 'practice' ? '🎯 THỰC HÀNH' : '📘 LÝ THUYẾT'}
              </span>
            </div>

            {isMastered ? (
              <span className='syllabus-badge mastered'>
                <Check size={11} aria-hidden='true' /> MASTERED
              </span>
            ) : isUnlocked ? (
              <span className='syllabus-badge' style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                READY
              </span>
            ) : (
              <span className='syllabus-badge'>
                <Lock size={11} aria-hidden='true' /> LOCKED
              </span>
            )}
          </div>

          <h3 className='syllabus-title' style={{ marginTop: 8 }}>{lesson.title}</h3>
          <p className='syllabus-summary'>Topic: {lesson.topic || 'General Academic'}</p>

          {/* Paired Theory <-> Practice Quick Bridge */}
          {lesson.pairedLesson && (
            <div style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLesson(lesson.pairedLesson);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  textAlign: 'left',
                }}>
                <span>
                  {lesson.contentType === 'theory' ? '🎯 Thực hành liên kết:' : '📖 Lý thuyết liên kết:'}{' '}
                  <span style={{ textDecoration: 'underline' }}>{lesson.pairedLesson.title}</span>
                </span>
                <ArrowRight size={11} />
              </button>
            </div>
          )}

          {lesson.prerequisites && lesson.prerequisites.length > 0 && !isUnlocked && (
            <div
              style={{
                marginTop: 'var(--space-xs)',
                fontSize: 11,
                color: 'var(--color-brick)',
                fontFamily: 'var(--font-mono)',
              }}>
              Yêu cầu hoàn thành:{' '}
              {lesson.prerequisites.map((p) => (typeof p === 'object' ? p.title : p)).join(', ')}
            </div>
          )}
        </div>

        <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-rule)' }}>
          {isUnlocked ? (
            <button
              className={`btn ${isNext ? 'btn-primary' : isMastered ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%' }}
              onClick={() => handleOpenLesson(lesson)}>
              <Play size={13} fill='currentColor' aria-hidden='true' />
              <span>{isMastered ? 'Ôn tập lại bài này' : 'Bắt đầu học ngay'}</span>
            </button>
          ) : (
            <button className='btn btn-secondary' style={{ width: '100%', opacity: 0.6 }} disabled>
              <Lock size={13} aria-hidden='true' />
              <span>Đang khóa (Yêu cầu bài trước)</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderRoadmapTimeline = () => {
    return (
      <div className="flex flex-col gap-5 py-2">
        {processedLessons.map((lesson, idx) => {
          const isMastered = lesson.status === 'mastered';
          const isUnlocked = lesson.status === 'unlocked' || isMastered;
          const isNext = nextMilestone && nextMilestone._id === lesson._id;
          const skillMeta = SKILL_THEME[lesson.skill] || {
            name: lesson.skill?.toUpperCase(),
            icon: BookOpen,
            badgeBg: 'bg-stone-100 text-stone-700 border-stone-300',
            dotColor: 'var(--color-accent)',
          };
          const SkillIcon = skillMeta.icon;
          const stg = STAGES.find((s) => s.key === String(lesson.level)) || STAGES[1];

          return (
            <div key={lesson._id} className="relative flex items-start gap-3.5 sm:gap-6 group">
              {/* Vertical connecting line to next station */}
              {idx < processedLessons.length - 1 && (
                <div className="absolute left-[19px] sm:left-[21px] top-11 bottom-0 w-0.5 bg-stone-200 dark:bg-stone-800 group-hover:bg-orange-300 dark:group-hover:bg-orange-950 transition-colors" />
              )}

              {/* Milestone Station Node Pin */}
              <div className="relative z-10 shrink-0 mt-1">
                {isMastered ? (
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-2 border-emerald-500 flex items-center justify-center shadow-xs"
                    title={`Đã hoàn thành chặng #${idx + 1}`}
                  >
                    <Check size={18} strokeWidth={2.5} />
                  </div>
                ) : isNext ? (
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-700 text-white border-2 border-orange-400 flex items-center justify-center shadow-lg ring-4 ring-orange-200 dark:ring-orange-950/60 animate-pulse"
                    title={`Đang mở khóa: Chặng #${idx + 1}`}
                  >
                    <Zap size={18} />
                  </div>
                ) : isUnlocked ? (
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-2 border-orange-500 flex items-center justify-center shadow-xs"
                    title={`Sẵn sàng học: Chặng #${idx + 1}`}
                  >
                    <Play size={16} fill="currentColor" />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500 border border-stone-300 dark:border-stone-700 flex items-center justify-center"
                    title={`Đang khóa: Chặng #${idx + 1}`}
                  >
                    <Lock size={15} />
                  </div>
                )}
              </div>

              {/* Milestone Station Detail Card */}
              <div className="flex-1 pb-4">
                <div
                  className={`bg-white dark:bg-stone-900 border rounded-2xl p-5 sm:p-6 transition-all ${
                    isNext
                      ? 'border-2 border-orange-600 shadow-md ring-1 ring-orange-500/20'
                      : isMastered
                      ? 'border-stone-200 dark:border-stone-800 shadow-xs hover:border-emerald-500'
                      : isUnlocked
                      ? 'border-stone-300 dark:border-stone-700 shadow-xs hover:border-orange-500'
                      : 'opacity-65 bg-stone-50/70 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        BƯỚC #{idx + 1}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${skillMeta.badgeBg}`}>
                        <SkillIcon size={12} />
                        <span>LEVEL {lesson.level} · {stg.band} · {skillMeta.name}</span>
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {lesson.contentType === 'theory' ? '📘 LÝ THUYẾT CHIẾN THUẬT' : '🎯 THỰC HÀNH LUYỆN ĐỀ'}
                      </span>
                    </div>

                    {isMastered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <Check size={11} strokeWidth={2.5} /> ĐÃ THÀNH THẠO
                      </span>
                    ) : isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                        <Zap size={11} /> SẴN SÀNG HỌC
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                        <Lock size={11} /> ĐANG KHÓA
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight mb-1">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                    Chủ đề: <strong className="text-stone-800 dark:text-stone-200">{lesson.topic || 'General Academic'}</strong>
                  </p>

                  {/* Paired Quick Bridge Link */}
                  {lesson.pairedLesson && (
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 mb-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs text-stone-600 dark:text-stone-300">
                        <span>{lesson.contentType === 'theory' ? '🎯 Bài tập thực chiến đi kèm:' : '📖 Lý thuyết chiến lược đi kèm:'} </span>
                        <strong className="text-orange-700 dark:text-orange-400">{lesson.pairedLesson.title}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLesson(lesson.pairedLesson);
                        }}
                        className="text-xs font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400 underline inline-flex items-center gap-1"
                      >
                        <span>Chuyển sang bài này</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  )}

                  {lesson.prerequisites && lesson.prerequisites.length > 0 && !isUnlocked && (
                    <div className="text-xs text-red-600 dark:text-red-400 mb-3 font-mono">
                      Yêu cầu hoàn thành: {lesson.prerequisites.map((p) => (typeof p === 'object' ? p.title : p)).join(', ')}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    {isUnlocked ? (
                      <button
                        type="button"
                        className={`btn ${isNext ? 'btn-primary' : isMastered ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        onClick={() => handleOpenLesson(lesson)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Play size={12} fill="currentColor" />
                        <span>{isMastered ? 'Ôn tập lại bài này' : 'Bắt đầu học ngay'}</span>
                        <ArrowRight size={12} />
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm opacity-60" disabled>
                        <Lock size={12} />
                        <span>Cần mở khóa bài trước</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-orange-700 dark:text-orange-500" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Lộ trình 5 cấp độ chinh phục IELTS (Band 0 – 8.0+)
            </span>
          </div>
          <span className="text-xs font-mono text-stone-500">
            Tổng tiến trình: {roadmapStats.mastered}/{roadmapStats.total} bài hoàn thành ({roadmapStats.percent}%)
          </span>
        </div>

        {/* 5-Level Milestone Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {STAGES.map((stg) => {
            const isSelected = selectedLevel === stg.key;
            const lvlNum = stg.key === 'all' ? null : Number(stg.key);
            const stat = lvlNum !== null ? levelProgressStats[lvlNum] : null;
            const isLvlDone = stat && stat.total > 0 && stat.mastered === stat.total;

            return (
              <button
                key={stg.key}
                type="button"
                onClick={() => setSelectedLevel(stg.key)}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-600 shadow-sm ring-1 ring-orange-500'
                    : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-mono font-bold uppercase text-stone-800 dark:text-stone-200">
                      {stg.label}
                    </span>
                    {isLvlDone && (
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-orange-700 dark:text-orange-500">
                    {stg.band}
                  </div>
                  <div className="text-[10.5px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {stg.subtitle}
                  </div>
                </div>

                {stat && stat.total > 0 && (
                  <div className="space-y-1 pt-1 border-t border-stone-200/60 dark:border-stone-700/60">
                    <div className="flex justify-between text-[10px] font-mono text-stone-500">
                      <span>{stat.mastered}/{stat.total} bài</span>
                      <span>{stat.percent}%</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
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
        <section className="bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-stone-50/90 dark:from-stone-900 dark:via-stone-900 dark:to-stone-850 border-2 border-orange-600/70 dark:border-orange-500/70 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-orange-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Zap size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                    Trạm học tập tiếp theo trên lộ trình của bạn
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-stone-800 border border-orange-200 dark:border-orange-800 text-stone-700 dark:text-stone-300">
                    Level {nextMilestone.level} · {nextMilestone.skill?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  {nextMilestone.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  Chủ đề: <strong>{nextMilestone.topic || 'General Academic'}</strong> · {nextMilestone.contentType === 'theory' ? '📘 Lý thuyết & Chiến thuật làm bài' : '🎯 Luyện đề thực hành & Bài tập'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
              onClick={() => handleOpenLesson(nextMilestone)}
            >
              <span>Vào học bài này ngay</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* ─── 4. Filter & View Switcher Console ─── */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
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
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-stone-100 dark:border-stone-800">
          {/* Left: Search input + Topic + Status */}
          <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-600 text-stone-800 dark:text-stone-100 placeholder-stone-400"
                placeholder="Tìm bài học..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
              {searchKeyword && (
                <button
                  type="button"
                  className="absolute right-2 top-2 text-stone-400 hover:text-stone-600"
                  onClick={() => setSearchKeyword('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Topic Filter */}
            <div className="flex items-center gap-1.5">
              <FolderOpen size={14} className="text-orange-700 dark:text-orange-500 shrink-0" />
              <select
                className="input-select text-xs py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="all">Tất cả chủ đề ({availableTopics.length})</option>
                {availableTopics.map((t) => (
                  <option key={t.topic} value={t.topic}>
                    {t.topic} ({t.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'ready', label: '⚡ Sẵn sàng' },
                { key: 'mastered', label: '✓ Xong' },
                { key: 'locked', label: '🔒 Khóa' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
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
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortBy === 'roadmap'
                  ? 'bg-white dark:bg-stone-900 text-orange-700 dark:text-orange-500 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              onClick={() => setSortBy('roadmap')}
              title="Lộ trình tuần tự theo chặng học"
            >
              <Route size={13} />
              <span>Lộ trình chặng</span>
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortBy === 'topic'
                  ? 'bg-white dark:bg-stone-900 text-orange-700 dark:text-orange-500 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              onClick={() => setSortBy('topic')}
              title="Gom nhóm theo khối chủ đề"
            >
              <FolderOpen size={13} />
              <span>Khối chủ đề</span>
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortBy === 'grid'
                  ? 'bg-white dark:bg-stone-900 text-orange-700 dark:text-orange-500 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              onClick={() => setSortBy('grid')}
              title="Xem danh mục dạng lưới"
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
            renderRoadmapTimeline()
          ) : sortBy === 'topic' && groupedByTopic ? (
            /* Grouped by Topic Display */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {groupedByTopic.map(([top, groupLessons]) => {
                const gMastered = groupLessons.filter((l) => l.isMastered).length;
                const gPercent = Math.round((gMastered / groupLessons.length) * 100);

                return (
                  <div key={top} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 flex items-center justify-center shrink-0">
                          <FolderOpen size={16} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">
                            Chủ đề: {top}
                          </h3>
                          <span className="text-xs text-stone-500">
                            {gMastered}/{groupLessons.length} bài hoàn thành ({gPercent}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-28 bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${gPercent}%` }} />
                      </div>
                    </div>

                    <div className='syllabus-grid'>
                      {groupLessons.map((lesson) => renderLessonCard(lesson))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard Grid Display */
            <div className='syllabus-grid'>
              {processedLessons.map((lesson, idx) => renderLessonCard(lesson, idx + 1))}
            </div>
          )}
        </>
      )}

      {/* ─── 4. Outer Study Workspace Modal Container ─── */}
      {activeLessonId && (
        <div
          className='fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto'
          role='dialog'
          aria-modal='true'
          aria-label='Lesson Study Sanctuary'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveLessonId(null);
              setLessonDetail(null);
            }
          }}>
          <div className='bg-[#fcfbf9] dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl max-w-4xl w-full min-h-[580px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl'>
            {/* Modal Topbar */}
            <div className='flex items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0'>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className='inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 mb-1'>
                  LEVEL {lessonDetail?.lesson?.level ?? 0} · {lessonDetail?.lesson?.skill?.toUpperCase()}
                </span>
                <h2 className='text-lg font-semibold text-stone-800 dark:text-stone-100 tracking-tight'>
                  {lessonDetail?.lesson?.title || 'Loading lesson...'}
                </h2>
              </div>
              <button
                className='p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors'
                onClick={() => {
                  setActiveLessonId(null);
                  setLessonDetail(null);
                }}
                aria-label='Close study window'>
                <X size={18} />
              </button>
            </div>

            {loadingDetail ? (
              <div className='p-12 text-center text-sm text-stone-500'>
                Loading lesson framework and practice blocks...
              </div>
            ) : (
              <>
                {/* Lesson Navigation Tabs */}
                <div
                  className='flex items-center gap-1 px-6 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 shrink-0 overflow-x-auto'
                  role='tablist'>
                  <button
                    role='tab'
                    aria-selected={activeTab === 'theory'}
                    className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'theory'
                        ? 'border-orange-700 text-orange-700 dark:border-orange-500 dark:text-orange-500 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    onClick={() => setActiveTab('theory')}>
                    1. Theoretical Framework & Rules
                  </button>
                  <button
                    role='tab'
                    aria-selected={activeTab === 'vocab'}
                    className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'vocab'
                        ? 'border-orange-700 text-orange-700 dark:border-orange-500 dark:text-orange-500 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    onClick={() => setActiveTab('vocab')}>
                    2. Core Academic Lexis ({lessonDetail?.vocabularies?.length || 0})
                  </button>
                  <button
                    role='tab'
                    aria-selected={activeTab === 'quiz'}
                    className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'quiz'
                        ? 'border-orange-700 text-orange-700 dark:border-orange-500 dark:text-orange-500 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    onClick={() => setActiveTab('quiz')}>
                    3. Practice Drills & Application ({lessonDetail?.questions?.length || 0})
                  </button>
                </div>

                {/* Main Content Sanctuary Body */}
                <div className='flex-1 overflow-y-auto p-6 sm:p-8 max-w-3xl w-full mx-auto'>
                  {/* Tab 1: Theory */}
                  {activeTab === 'theory' && (() => {
                    const isCurrentMastered =
                      !!lessons.find((l) => l._id === activeLessonId)?.isMastered ||
                      !!lessonDetail?.lastAttempt?.passed;

                    const relatedPractice =
                      lessonDetail?.relatedPracticeLessons?.[0] ||
                      lessonDetail?.lesson?.relatedPracticeLessons?.[0];

                    const relatedTheory =
                      lessonDetail?.relatedTheoryLesson ||
                      lessonDetail?.lesson?.relatedTheoryLesson;

                    return (
                      <div className='card' style={{ background: 'var(--color-surface)', padding: 'var(--space-xl)' }}>
                        {relatedTheory && (
                          <div
                            style={{
                              marginBottom: 'var(--space-md)',
                              padding: '10px 14px',
                              background: 'var(--color-paper-2)',
                              border: '1px solid var(--color-rule)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 12.5,
                              color: 'var(--color-ink-muted)'
                            }}
                          >
                            <BookOpen size={14} className="text-orange-700 dark:text-orange-500" />
                            <span>
                              Chiến lược & Lý thuyết bài học (từ: <strong style={{ color: 'var(--color-ink)' }}>{relatedTheory.title}</strong>)
                            </span>
                          </div>
                        )}

                        <MarkdownView content={lessonDetail?.lesson?.contentMarkdown} />

                        {/* Linked Practice Lesson Banner if this is a theory-only module */}
                        {relatedPractice && (
                          <div
                            style={{
                              marginTop: 'var(--space-lg)',
                              padding: '12px 16px',
                              background: 'var(--color-paper-2)',
                              border: '1px solid var(--color-rule)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 10
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                                Bài tập thực hành liên kết
                              </div>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-ink)' }}>
                                {relatedPractice.title}
                              </div>
                            </div>
                            <button
                              className='btn btn-primary btn-sm'
                              onClick={() => handleOpenLesson(relatedPractice)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <span>Vào làm bài thực hành ngay</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        )}

                        {lessonDetail?.questions && lessonDetail.questions.length > 0 ? (
                          <div
                            style={{
                              marginTop: 'var(--space-xl)',
                              textAlign: 'center',
                              paddingTop: 'var(--space-lg)',
                              borderTop: '1px solid var(--color-rule)',
                            }}>
                            <button className='btn btn-primary' onClick={() => setActiveTab('quiz')}>
                              <span>Proceed to Practice Drill ({lessonDetail.questions.length} questions)</span>
                              <ArrowRight size={14} aria-hidden='true' />
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: 'var(--space-xl)',
                              textAlign: 'center',
                              paddingTop: 'var(--space-lg)',
                              borderTop: '1px solid var(--color-rule)',
                            }}>
                            <button
                              className={`btn ${isCurrentMastered ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={handleCompleteTheoryLesson}
                              disabled={isSubmittingTheory || isCurrentMastered}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                              <CheckCircle size={16} />
                              <span>
                                {isCurrentMastered
                                  ? '✓ Bài học đã hoàn thành'
                                  : isSubmittingTheory
                                  ? 'Đang ghi nhận...'
                                  : 'Đánh dấu đã hiểu & Hoàn thành bài học'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Tab 2: Vocabularies */}
                  {activeTab === 'vocab' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                      {enrollNotice && (
                        <div
                          style={{
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            fontWeight: 600,
                            background: 'var(--color-moss-soft)',
                            color: 'var(--color-moss)',
                            border: '1px solid var(--color-rule)',
                            textAlign: 'center',
                          }}>
                          {enrollNotice}
                        </div>
                      )}

                      {lessonDetail?.vocabularies && lessonDetail.vocabularies.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 0',
                          }}>
                          <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                            {lessonDetail.vocabularies.length} Core Academic Collocations
                          </span>
                          <button className='btn btn-secondary btn-sm' onClick={handleEnrollAllVocabsInLesson}>
                            + Enroll All in Box 1 SRS
                          </button>
                        </div>
                      )}

                      {(!lessonDetail?.vocabularies || lessonDetail.vocabularies.length === 0) && (
                        <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
                          No vocabulary items attached to this module.
                        </p>
                      )}

                      {lessonDetail?.vocabularies?.map((v) => {
                        const isEnrolled = enrolledVocabs.has(v._id);
                        return (
                          <div key={v._id} className='card' style={{ padding: 'var(--space-md)' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 10,
                              }}>
                              <div>
                                <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>{v.word}</h3>
                                <span
                                  className='ipa'
                                  style={{
                                    color: 'var(--color-accent)',
                                    fontSize: 13,
                                    display: 'inline-block',
                                    marginTop: 2,
                                  }}>
                                  {v.ipa} · {v.pos}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                  className='btn btn-secondary btn-sm'
                                  onClick={() => playAudio(v.media?.url, v.word)}>
                                  <Volume2 size={13} />
                                  <span>Listen</span>
                                </button>
                                <button
                                  className={`btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                                  onClick={() => handleEnrollSingleVocab(v._id)}
                                  disabled={isEnrolled}>
                                  {isEnrolled ? '✓ In SRS' : '+ Add to SRS'}
                                </button>
                              </div>
                            </div>
                            {/* MeaningVi preserved per Language Policy rule 3: abstract concept anchor for A2-B1 learners */}
                            <p style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>
                              Meaning (Nghĩa tiếng Việt): {v.meaningVi}
                            </p>
                            {v.exampleSentence && (
                              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--color-ink-muted)' }}>
                                Academic Example: "{v.exampleSentence}"
                              </p>
                            )}
                            {v.collocations && v.collocations.length > 0 && (
                              <div
                                style={{
                                  marginTop: 6,
                                  fontSize: 12,
                                  color: 'var(--color-moss)',
                                  fontFamily: 'var(--font-mono)',
                                }}>
                                Collocations: {v.collocations.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 3: Practice Questions (One-by-one check stepper container) */}
                  {activeTab === 'quiz' &&
                    (() => {
                      const allQuestions = lessonDetail?.questions || [];
                      const checkedKeys = Object.keys(questionResults);
                      const correctCount = checkedKeys.filter((k) => questionResults[k]?.isCorrect).length;
                      const passedPercentage =
                        allQuestions.length > 0 ? Math.round((correctCount / allQuestions.length) * 100) : 0;
                      const q = allQuestions[currentQuizIndex];

                      return (
                        <div>
                          {enrollNotice && (
                            <div
                              style={{
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12.5,
                                fontWeight: 500,
                                background: 'var(--color-paper-2)',
                                color: 'var(--color-ink)',
                                border: '1px solid var(--color-rule)',
                                marginBottom: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                              }}>
                              <span>{enrollNotice}</span>
                              <button
                                type='button'
                                onClick={() => setEnrollNotice('')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--color-ink-muted)',
                                  cursor: 'pointer',
                                  padding: 2,
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                                aria-label='Đóng thông báo'>
                                <X size={14} />
                              </button>
                            </div>
                          )}
                          {allQuestions.length === 0 ? (
                            <div className='card' style={{ padding: 32, textAlign: 'center' }}>
                              {lessonDetail?.relatedPracticeLessons && lessonDetail.relatedPracticeLessons.length > 0 ? (
                                <div>
                                  <div
                                    style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: '50%',
                                      background: 'var(--color-accent-soft)',
                                      color: 'var(--color-accent)',
                                      display: 'grid',
                                      placeItems: 'center',
                                      margin: '0 auto 12px',
                                    }}>
                                    <Sparkles size={22} />
                                  </div>
                                  <h4 style={{ fontSize: 16, margin: '0 0 6px', fontWeight: 700 }}>
                                    Bài học này tập trung vào Chiến lược & Lý thuyết
                                  </h4>
                                  <p style={{ color: 'var(--color-ink-muted)', fontSize: 13, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.5 }}>
                                    Để áp dụng ngay các phương pháp vừa học, bạn hãy chuyển sang bài luyện tập thực hành liên kết:
                                  </p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, margin: '0 auto' }}>
                                    {lessonDetail.relatedPracticeLessons.map((pLesson) => (
                                      <button
                                        key={pLesson._id}
                                        className='btn btn-primary'
                                        onClick={() => handleOpenLesson(pLesson)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px' }}
                                      >
                                        <span>Vào làm bài: {pLesson.title}</span>
                                        <ArrowRight size={14} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
                                  Chưa có câu hỏi bài tập nào gắn với bài học này.
                                </p>
                              )}
                            </div>
                          ) : quizFinished ? (
                            /* Quiz Summary */
                            <div className='card' style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  margin: '0 auto var(--space-md)',
                                  borderRadius: '50%',
                                  background:
                                    passedPercentage >= 75 ? 'var(--color-moss-soft)' : 'var(--color-brick-soft)',
                                  color: passedPercentage >= 75 ? 'var(--color-moss)' : 'var(--color-brick)',
                                  display: 'grid',
                                  placeItems: 'center',
                                }}>
                                {passedPercentage >= 75 ? <Trophy size={26} /> : <XCircle size={26} />}
                              </div>

                              <h3 style={{ fontSize: 20, margin: '0 0 6px' }}>
                                {passedPercentage >= 75
                                  ? 'Drill Completed Successfully!'
                                  : 'Benchmark Not Reached (Requires ≥ 75%)'}
                              </h3>

                              <div
                                style={{
                                  fontSize: 28,
                                  fontWeight: 700,
                                  margin: '10px 0',
                                  color: passedPercentage >= 75 ? 'var(--color-moss)' : 'var(--color-brick)',
                                  fontFamily: 'var(--font-mono)',
                                }}>
                                {correctCount} / {allQuestions.length} correct ({passedPercentage}%)
                              </div>

                              <p
                                style={{
                                  color: 'var(--color-ink-muted)',
                                  fontSize: 14,
                                  maxWidth: 460,
                                  margin: '0 auto 20px',
                                  lineHeight: 1.5,
                                }}>
                                {passedPercentage >= 75
                                  ? 'Congratulations! You have demonstrated mastery of this syntactic structure and unlocked the next curriculum milestone.'
                                  : 'You scored below the 75% accuracy threshold. Review the coach feedback on incorrect items or retry the drill.'}
                              </p>

                              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                  type='button'
                                  className='btn btn-secondary'
                                  onClick={() => {
                                    setQuizFinished(false);
                                    setCurrentQuizIndex(0);
                                  }}>
                                  <span>Review Questions One by One</span>
                                </button>
                                <button type='button' className='btn btn-primary' onClick={handleResetQuiz}>
                                  <RotateCcw size={14} />
                                  <span>Retry Practice Drill</span>
                                </button>
                              </div>
                            </div>
                          ) : q ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              {/* Reading Passage Reference Block if present */}
                              {lessonDetail?.lesson?.passage?.paragraphs?.length > 0 && (
                                <div className='card' style={{ background: 'var(--color-surface)', padding: '14px 18px', borderLeft: '3px solid var(--color-accent)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ink)' }}>
                                      Đoạn văn đọc hiểu ({lessonDetail.lesson.passage.paragraphs.length} đoạn)
                                    </span>
                                    <button
                                      type='button'
                                      className='btn btn-secondary btn-sm'
                                      onClick={() => navigate(`/reading/${lessonDetail?.effectivePracticeLessonId || lessonDetail?.lesson?._id || activeLessonId}`)}
                                      style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <span>Mở phòng đọc toàn màn hình</span>
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>
                                  <div style={{ maxHeight: 180, overflowY: 'auto', fontSize: 13, lineHeight: 1.6, color: 'var(--color-ink-muted)' }}>
                                    {lessonDetail.lesson.passage.paragraphs.map((p) => (
                                      <p key={p.label} style={{ margin: '0 0 8px' }}>
                                        <strong style={{ color: 'var(--color-accent)' }}>[{p.label}]</strong> {p.text}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Single Question Workbench Frame */}
                              <div className='card' style={{ padding: 'var(--space-xl)' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 10,
                                  marginBottom: 16,
                                  paddingBottom: 14,
                                  borderBottom: '1px solid var(--color-rule)',
                                }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                  }}>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: 'var(--color-accent)',
                                      textTransform: 'uppercase',
                                      fontFamily: 'var(--font-mono)',
                                    }}>
                                    Question {currentQuizIndex + 1} of {allQuestions.length}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <button
                                      type='button'
                                      onClick={() => setActiveTab('theory')}
                                      style={{
                                        background: 'var(--color-paper-2)',
                                        border: '1px solid var(--color-rule)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '2px 8px',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'var(--color-accent)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      <BookOpen size={12} />
                                      <span>Xem lại lý thuyết</span>
                                    </button>
                                    <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                                      Progress: {Object.keys(questionResults).length}/{allQuestions.length} answered
                                    </span>
                                    {Object.keys(questionResults).length > 0 && (
                                      <button
                                        type='button'
                                        onClick={handleResetQuiz}
                                        style={{
                                          background: 'transparent',
                                          border: '1px solid var(--color-rule)',
                                          borderRadius: 'var(--radius-sm)',
                                          padding: '2px 8px',
                                          fontSize: 11,
                                          fontWeight: 500,
                                          color: 'var(--color-ink-muted)',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                        }}
                                        title='Xóa toàn bộ câu đã làm và bắt đầu lại từ câu 1'>
                                        <RotateCcw size={11} />
                                        <span>Đặt lại bài</span>
                                      </button>
                                    )}
                                    {allQuestions.length > 15 && (
                                      <button
                                        type='button'
                                        onClick={() => setIsStepperExpanded((prev) => !prev)}
                                        style={{
                                          background: 'var(--color-paper-2)',
                                          border: '1px solid var(--color-rule)',
                                          borderRadius: 'var(--radius-sm)',
                                          padding: '2px 8px',
                                          fontSize: 11,
                                          fontWeight: 500,
                                          color: 'var(--color-ink)',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                        }}>
                                        <span>
                                          {isStepperExpanded ? 'Thu gọn' : `Xem tất cả (${allQuestions.length})`}
                                        </span>
                                        {isStepperExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Numbered Stepper - Flex wrap into multiple lines */}
                                <div
                                  style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                    alignItems: 'center',
                                    maxHeight: isStepperExpanded
                                      ? '360px'
                                      : allQuestions.length > 20
                                        ? '114px'
                                        : 'none',
                                    overflowY: allQuestions.length > 20 ? 'auto' : 'visible',
                                    padding: '4px 2px',
                                    scrollbarWidth: 'thin',
                                    transition: 'max-height var(--dur-normal) var(--ease-out)',
                                  }}>
                                  {allQuestions.map((item, idx) => {
                                    const qRes = questionResults[item._id];
                                    const isCurrent = idx === currentQuizIndex;
                                    let bg = 'var(--color-paper)';
                                    let border = '1px solid var(--color-border)';
                                    let color = 'var(--color-ink-muted)';

                                    if (qRes?.checked) {
                                      if (qRes.isCorrect) {
                                        bg = 'var(--color-moss-soft)';
                                        border = '1px solid var(--color-moss)';
                                        color = 'var(--color-moss)';
                                      } else {
                                        bg = 'var(--color-brick-soft)';
                                        border = '1px solid var(--color-brick)';
                                        color = 'var(--color-brick)';
                                      }
                                    } else if (isCurrent) {
                                      border = '2px solid var(--color-accent)';
                                      color = 'var(--color-accent)';
                                      bg = 'var(--color-accent-soft)';
                                    }

                                    return (
                                      <button
                                        key={item._id}
                                        ref={isCurrent ? currentButtonRef : null}
                                        type='button'
                                        onClick={() => setCurrentQuizIndex(idx)}
                                        style={{
                                          minWidth: 28,
                                          width: 28,
                                          height: 28,
                                          borderRadius: 'var(--radius-sm)',
                                          fontSize: 11.5,
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: 600,
                                          display: 'grid',
                                          placeItems: 'center',
                                          cursor: 'pointer',
                                          background: bg,
                                          border,
                                          color,
                                          padding: 0,
                                          transition: 'all var(--dur-fast) var(--ease-out)',
                                        }}
                                        title={`Question ${idx + 1}`}>
                                        {qRes?.checked ? (qRes.isCorrect ? '✓' : '✗') : idx + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Question Prompt */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: 8,
                                }}>
                                <span className='syllabus-badge'>
                                  {q.type ? q.type.toUpperCase() : 'PRACTICE'} · {q.errorTaxonomy || 'ERR_STRUCTURE'}
                                </span>
                                {questionResults[q._id]?.checked && (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: questionResults[q._id].isCorrect
                                        ? 'var(--color-moss)'
                                        : 'var(--color-brick)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}>
                                    {questionResults[q._id].isCorrect ? (
                                      <CheckCircle size={14} />
                                    ) : (
                                      <XCircle size={14} />
                                    )}
                                    <span>{questionResults[q._id].isCorrect ? 'Accurate' : 'Needs Review'}</span>
                                  </span>
                                )}
                              </div>

                              <p style={{ fontSize: 16, fontWeight: 600, margin: '8px 0 16px', lineHeight: 1.5 }}>
                                {q.prompt}
                              </p>

                              {/* Dictation audio */}
                              {q.type === 'dictation' && (
                                <div style={{ marginBottom: 14 }}>
                                  <button
                                    type='button'
                                    className='btn btn-secondary btn-sm'
                                    onClick={() => playAudio(q.media?.url, q.correctAnswer)}>
                                    <Volume2 size={15} />
                                    <span>Listen to Pronunciation</span>
                                  </button>
                                </div>
                              )}

                              {/* Choice Options */}
                              {q.type === 'choice' && q.options && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                  {q.options.map((opt) => {
                                    const userAns = quizAnswers[q._id] || '';
                                    const isSelected = userAns === opt;
                                    const isChecked = !!questionResults[q._id]?.checked;
                                    let customStyle = {};

                                    if (isChecked) {
                                      const optClean = opt.trim().toLowerCase();
                                      const isThisCorrect = optClean === (q.correctAnswer || '').trim().toLowerCase();
                                      if (isThisCorrect) {
                                        customStyle = {
                                          background: 'var(--color-moss-soft)',
                                          borderColor: 'var(--color-moss)',
                                          color: 'var(--color-moss)',
                                          fontWeight: 600,
                                        };
                                      } else if (isSelected && !isThisCorrect) {
                                        customStyle = {
                                          background: 'var(--color-brick-soft)',
                                          borderColor: 'var(--color-brick)',
                                          color: 'var(--color-brick)',
                                          fontWeight: 600,
                                        };
                                      } else {
                                        customStyle = { opacity: 0.6 };
                                      }
                                    } else if (isSelected) {
                                      customStyle = {
                                        borderColor: 'var(--color-accent)',
                                        background: 'var(--color-accent-soft)',
                                        fontWeight: 600,
                                      };
                                    }

                                    return (
                                      <button
                                        key={opt}
                                        type='button'
                                        disabled={isChecked}
                                        style={{
                                          ...customStyle,
                                          width: '100%',
                                          padding: '12px 16px',
                                          textAlign: 'left',
                                          borderRadius: 'var(--radius-sm)',
                                          border: '1px solid var(--color-border)',
                                          background: customStyle.background || 'var(--color-surface)',
                                          cursor: isChecked ? 'default' : 'pointer',
                                          fontSize: 14,
                                          transition: 'border-color var(--dur-fast) var(--ease-out)',
                                        }}
                                        onClick={() => setQuizAnswers({ ...quizAnswers, [q._id]: opt })}>
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Text Input */}
                              {q.type !== 'choice' && (
                                <div style={{ marginTop: 8 }}>
                                  <input
                                    type='text'
                                    disabled={!!questionResults[q._id]?.checked}
                                    className='input-text'
                                    placeholder={
                                      q.type === 'dictation'
                                        ? 'Type the key academic word you hear...'
                                        : 'Type your answer here...'
                                    }
                                    value={quizAnswers[q._id] || ''}
                                    onChange={(e) => setQuizAnswers({ ...quizAnswers, [q._id]: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === 'Enter' &&
                                        !questionResults[q._id]?.checked &&
                                        (quizAnswers[q._id] || '').trim()
                                      ) {
                                        handleCheckSingleQuestion(q);
                                      }
                                    }}
                                  />
                                </div>
                              )}

                              {/* Immediate Feedback Box (Pedagogical contrastive notes preserved in Vietnamese) */}
                              {questionResults[q._id]?.checked && (
                                <div
                                  style={{
                                    marginTop: 14,
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 13,
                                    background: questionResults[q._id].isCorrect
                                      ? 'var(--color-moss-soft)'
                                      : 'var(--color-brick-soft)',
                                    color: questionResults[q._id].isCorrect
                                      ? 'var(--color-moss)'
                                      : 'var(--color-brick)',
                                    border: '1px solid var(--color-rule)',
                                  }}>
                                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                                    {questionResults[q._id].isCorrect
                                      ? '✓ Accurate!'
                                      : `✗ Revision needed. Accepted standard: ${q.correctAnswer}`}
                                  </div>
                                  {q.explanation && (
                                    <p
                                      style={{
                                        marginTop: 4,
                                        color: 'var(--color-ink)',
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                      }}>
                                      <strong>Coach Explanation:</strong> {q.explanation}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Question Bottom Action Stepper */}
                              <div
                                style={{
                                  marginTop: 18,
                                  paddingTop: 14,
                                  borderTop: '1px solid var(--color-rule)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  flexWrap: 'wrap',
                                }}>
                                {questionResults[q._id]?.checked ? (
                                  <>
                                    <button
                                      type='button'
                                      className='btn btn-ghost btn-sm'
                                      onClick={() => handleRetryQuestion(q._id)}>
                                      <RotateCcw size={13} />
                                      <span>Retry Question</span>
                                    </button>

                                    {currentQuizIndex < allQuestions.length - 1 ? (
                                      <button
                                        type='button'
                                        className='btn btn-primary btn-sm'
                                        onClick={() => setCurrentQuizIndex(currentQuizIndex + 1)}>
                                        <span>Next Question</span>
                                        <ArrowRight size={14} />
                                      </button>
                                    ) : (
                                      <button
                                        type='button'
                                        className='btn btn-primary btn-sm'
                                        onClick={() => setQuizFinished(true)}>
                                        <span>View Drill Summary</span>
                                        <ArrowRight size={14} />
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div />
                                    <button
                                      type='button'
                                      className='btn btn-primary btn-sm'
                                      onClick={() => handleCheckSingleQuestion(q)}
                                      disabled={!(quizAnswers[q._id] || '').trim()}>
                                      <span>Check Answer</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : null}
                        </div>
                      );
                    })()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
