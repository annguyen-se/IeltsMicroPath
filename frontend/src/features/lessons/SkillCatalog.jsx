/* Hallmark · macrostructure: Narrative Workflow · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Narrative Workflow · design-system: design.md · designed-as-app */
import React, { useState, useEffect } from 'react';
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
  BookMarked
} from 'lucide-react';

const SKILLS = [
  { key: 'all', label: 'All Curriculum', icon: Sparkles },
  { key: 'writing', label: 'Writing (Task 1 & 2)', icon: PenLine },
  { key: 'grammar', label: 'Academic Grammar', icon: FileText },
  { key: 'reading', label: 'Reading & Paraphrasing', icon: BookOpen },
  { key: 'phonetics', label: 'Pronunciation & IPA', icon: AudioLines },
  { key: 'listening', label: 'Listening & Dictation', icon: Headphones },
  { key: 'speaking', label: 'Speaking Foundations', icon: Mic }
];

const STAGES = [
  { key: 'all', label: 'All Stages' },
  { key: '0', label: 'Stage 0: Sentence Foundation' },
  { key: '1', label: 'Stage 1: Paragraph Architecture' },
  { key: '2', label: 'Stage 2: Task 2 Argumentation' },
  { key: '3', label: 'Stage 3: Full Essay & Band Descriptors' }
];

export default function SkillCatalog({ onBack, isAuthenticated = false, onOpenAuth }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSkill = searchParams.get('skill') || 'all';
  const [selectedSkill, setSelectedSkill] = useState(initialSkill);
  const [selectedLevel, setSelectedLevel] = useState('all');

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
  const [, setIsSubmittingQuiz] = useState(false);

  // Vocab enrollment state
  const [enrolledVocabs, setEnrolledVocabs] = useState(new Set());
  const [enrollNotice, setEnrollNotice] = useState('');

  const submitCompletedQuiz = async (results = questionResults) => {
    if (!isAuthenticated) return;
    setIsSubmittingQuiz(true);
    try {
      const allQuestions = lessonDetail?.questions || [];
      const answersPayload = allQuestions.map((q) => ({
        questionId: q._id,
        userAnswer: quizAnswers[q._id] || ''
      }));

      const res = await api.post('/learning/submit-session', {
        lessonResults: {
          lessonId: activeLessonId,
          answers: answersPayload
        }
      });

      if (res?.isLessonMastered || res?.lessonReviewData?.passed) {
        setEnrollNotice('Lesson completed! The next module on your curriculum DAG is now unlocked.');
        await fetchLessons();
      }
    } catch (err) {
      console.warn('[Quiz Submit Error]:', err.message);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleCheckSingleQuestion = async (q) => {
    const userAns = (quizAnswers[q._id] || '').trim();
    if (!userAns) return;

    const cleanAns = userAns.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.,!?;:]+$/, '');
    const correctAns = (q.correctAnswer || '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.,!?;:]+$/, '');

    const hasVariant =
      (q.options && q.options.some((opt) => opt.trim().toLowerCase().replace(/[.,!?;:]+$/, '') === cleanAns && cleanAns === correctAns)) ||
      (q.acceptableAnswers && q.acceptableAnswers.some((opt) => opt.trim().toLowerCase().replace(/[.,!?;:]+$/, '') === cleanAns));

    const isCorrect = cleanAns === correctAns || hasVariant;

    const updatedResults = {
      ...questionResults,
      [q._id]: {
        checked: true,
        isCorrect,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      }
    };
    setQuestionResults(updatedResults);

    const allQuestions = lessonDetail?.questions || [];
    if (Object.keys(updatedResults).length === allQuestions.length) {
      await submitCompletedQuiz(updatedResults);
    }
  };

  const handleRetryQuestion = (qId) => {
    setQuestionResults((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setQuizAnswers((prev) => ({
      ...prev,
      [qId]: ''
    }));
  };

  const handleResetQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizAnswers({});
    setQuestionResults({});
    setQuizFinished(false);
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
  }, [selectedSkill, selectedLevel]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSkill !== 'all') params.append('skill', selectedSkill);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);

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

    if (lesson.contentType === 'practice') {
      navigate(`/reading/${lesson._id}`);
      return;
    }

    setActiveLessonId(lesson._id);
    setActiveTab('theory');
    setCurrentQuizIndex(0);
    setQuizAnswers({});
    setQuestionResults({});
    setQuizFinished(false);
    setEnrollNotice('');

    try {
      setLoadingDetail(true);
      const res = await api.get(`/lessons/${lesson._id}`);
      setLessonDetail(res || null);
    } catch (err) {
      console.warn('[Fetch Lesson Detail Error]:', err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const playAudio = (url, word) => {
    playWordAudio(url, word);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* ─── 1. Academic Syllabus Header ─── */}
      <section className="catalog-header">
        <div className="section-head" style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="section-kicker">
            <BookMarked size={13} aria-hidden="true" /> IELTS Writing Hub · Micro-Skill Curriculum
          </span>
          <div className="section-head-row">
            <div>
              <h1 className="section-title">Curriculum Library & Prerequisite DAG Graph</h1>
              <p className="section-desc">
                Structured academic micro-lessons arranged in a prerequisite learning graph: acquire sentence theory, master academic collocations, and evaluate drills to activate subsequent milestones.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => (onBack ? onBack() : navigate('/'))}>
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to Workspace</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. Filter Bar: Skill Tracks & Stages ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {/* Track filter row */}
        <div className="filter-track-bar" role="tablist" aria-label="Filter by skill track">
          {SKILLS.map((sk) => {
            const Icon = sk.icon;
            const isActive = selectedSkill === sk.key;
            return (
              <button
                key={sk.key}
                role="tab"
                aria-selected={isActive}
                className={`filter-chip ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectSkill(sk.key)}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{sk.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stage / Level sub-filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', textTransform: 'uppercase', marginRight: 4 }}>
            Stage:
          </span>
          {STAGES.map((stg) => (
            <button
              key={stg.key}
              className={`pill ${selectedLevel === stg.key ? 'pill-cobalt' : 'pill-muted'}`}
              style={{ cursor: 'pointer', padding: '5px 12px' }}
              onClick={() => setSelectedLevel(stg.key)}
            >
              {stg.label}
            </button>
          ))}
        </div>
      </section>

      {/* ─── 3. Course Syllabus Cards Grid ─── */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
            Loading curriculum modules...
          </p>
        </div>
      )}

      {!loading && lessons.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
            No lessons published for this skill track and stage combination.
          </p>
        </div>
      )}

      {!loading && lessons.length > 0 && (
        <div className="syllabus-grid">
          {lessons.map((lesson) => {
            const isMastered = lesson.status === 'mastered';
            const isUnlocked = lesson.status === 'unlocked' || isMastered;

            return (
              <div
                key={lesson._id}
                className={`syllabus-card ${!isUnlocked ? 'is-locked' : ''}`}
                style={{
                  borderLeft: isMastered
                    ? '3px solid var(--color-moss)'
                    : isUnlocked
                    ? '3px solid var(--color-accent)'
                    : '3px solid var(--color-border)'
                }}
              >
                <div>
                  <div className="syllabus-meta-row">
                    <span className="syllabus-badge">
                      LEVEL {lesson.level} · {lesson.skill?.toUpperCase()} {lesson.contentType === 'practice' ? '· PRACTICE & READING' : '· THEORY & DRILL'}
                    </span>
                    {isMastered ? (
                      <span className="syllabus-badge mastered">
                        <Check size={11} aria-hidden="true" /> MASTERED
                      </span>
                    ) : isUnlocked ? (
                      <span className="syllabus-badge" style={{ color: 'var(--color-accent)' }}>
                        READY TO LEARN
                      </span>
                    ) : (
                      <span className="syllabus-badge">
                        <Lock size={11} aria-hidden="true" /> LOCKED (PREREQUISITES)
                      </span>
                    )}
                  </div>

                  <h3 className="syllabus-title">{lesson.title}</h3>
                  <p className="syllabus-summary">
                    Topic: {lesson.topic || 'General Academic'}
                  </p>

                  {lesson.prerequisites && lesson.prerequisites.length > 0 && !isUnlocked && (
                    <div style={{ marginTop: 'var(--space-xs)', fontSize: 11, color: 'var(--color-brick)', fontFamily: 'var(--font-mono)' }}>
                      Prerequisites required: {lesson.prerequisites.map((p) => (typeof p === 'object' ? p.title : p)).join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-rule)' }}>
                  {isUnlocked ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => handleOpenLesson(lesson)}
                    >
                      <Play size={13} fill="currentColor" aria-hidden="true" />
                      <span>{isMastered ? 'Review Lesson' : 'Open Lesson'}</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', opacity: 0.6 }}
                      disabled
                    >
                      <Lock size={13} aria-hidden="true" />
                      <span>Locked (Prerequisites)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 4. Outer Study Workspace Modal Container ─── */}
      {activeLessonId && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Lesson Study Sanctuary"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveLessonId(null);
              setLessonDetail(null);
            }
          }}
        >
          <div className="bg-[#fcfbf9] dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl max-w-4xl w-full min-h-[580px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Topbar */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 mb-1">
                  LEVEL {lessonDetail?.lesson?.level ?? 0} · {lessonDetail?.lesson?.skill?.toUpperCase()}
                </span>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 tracking-tight">
                  {lessonDetail?.lesson?.title || 'Loading lesson...'}
                </h2>
              </div>
              <button
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                onClick={() => {
                  setActiveLessonId(null);
                  setLessonDetail(null);
                }}
                aria-label="Close study window"
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-12 text-center text-sm text-stone-500">
                Loading lesson framework and practice blocks...
              </div>
            ) : (
              <>
                {/* Lesson Navigation Tabs */}
                <div className="flex items-center gap-1 px-6 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 shrink-0 overflow-x-auto" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'theory'}
                    className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'theory'
                        ? 'border-orange-700 text-orange-700 dark:border-orange-500 dark:text-orange-500 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    onClick={() => setActiveTab('theory')}
                  >
                    1. Theoretical Framework & Rules
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'vocab'}
                    className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'vocab'
                        ? 'border-orange-700 text-orange-700 dark:border-orange-500 dark:text-orange-500 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    onClick={() => setActiveTab('vocab')}
                  >
                    2. Core Academic Lexis ({lessonDetail?.vocabularies?.length || 0})
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'quiz'}
                    className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'quiz'
                        ? 'border-orange-700 text-orange-700 dark:border-orange-500 dark:text-orange-500 font-bold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                    onClick={() => setActiveTab('quiz')}
                  >
                    3. Practice Drills & Application ({lessonDetail?.questions?.length || 0})
                  </button>
                </div>

                {/* Main Content Sanctuary Body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-3xl w-full mx-auto">
                  {/* Tab 1: Theory */}
                  {activeTab === 'theory' && (
                    <div className="card" style={{ background: 'var(--color-surface)', padding: 'var(--space-xl)' }}>
                      <MarkdownView content={lessonDetail?.lesson?.contentMarkdown} />
                      {lessonDetail?.questions && lessonDetail.questions.length > 0 && (
                        <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-rule)' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => setActiveTab('quiz')}
                          >
                            <span>Proceed to Practice Drill ({lessonDetail.questions.length} questions)</span>
                            <ArrowRight size={14} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

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
                            textAlign: 'center'
                          }}
                        >
                          {enrollNotice}
                        </div>
                      )}

                      {lessonDetail?.vocabularies && lessonDetail.vocabularies.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                            {lessonDetail.vocabularies.length} Core Academic Collocations
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleEnrollAllVocabsInLesson}
                          >
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
                          <div key={v._id} className="card" style={{ padding: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                              <div>
                                <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>{v.word}</h3>
                                <span className="ipa" style={{ color: 'var(--color-accent)', fontSize: 13, display: 'inline-block', marginTop: 2 }}>
                                  {v.ipa} · {v.pos}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => playAudio(v.media?.url, v.word)}
                                >
                                  <Volume2 size={13} />
                                  <span>Listen</span>
                                </button>
                                <button
                                  className={`btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                                  onClick={() => handleEnrollSingleVocab(v._id)}
                                  disabled={isEnrolled}
                                >
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
                              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-moss)', fontFamily: 'var(--font-mono)' }}>
                                Collocations: {v.collocations.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 3: Practice Questions (One-by-one check stepper container) */}
                  {activeTab === 'quiz' && (() => {
                    const allQuestions = lessonDetail?.questions || [];
                    const checkedKeys = Object.keys(questionResults);
                    const correctCount = checkedKeys.filter((k) => questionResults[k]?.isCorrect).length;
                    const passedPercentage = allQuestions.length > 0 ? Math.round((correctCount / allQuestions.length) * 100) : 0;
                    const q = allQuestions[currentQuizIndex];

                    return (
                      <div>
                        {allQuestions.length === 0 ? (
                          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                            <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
                              No practice drill questions attached to this lesson.
                            </p>
                          </div>
                        ) : quizFinished ? (
                          /* Quiz Summary */
                          <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                            <div
                              style={{
                                width: 52,
                                height: 52,
                                margin: '0 auto var(--space-md)',
                                borderRadius: '50%',
                                background: passedPercentage >= 75 ? 'var(--color-moss-soft)' : 'var(--color-brick-soft)',
                                color: passedPercentage >= 75 ? 'var(--color-moss)' : 'var(--color-brick)',
                                display: 'grid',
                                placeItems: 'center'
                              }}
                            >
                              {passedPercentage >= 75 ? <Trophy size={26} /> : <XCircle size={26} />}
                            </div>

                            <h3 style={{ fontSize: 20, margin: '0 0 6px' }}>
                              {passedPercentage >= 75 ? 'Drill Completed Successfully!' : 'Benchmark Not Reached (Requires ≥ 75%)'}
                            </h3>

                            <div
                              style={{
                                fontSize: 28,
                                fontWeight: 700,
                                margin: '10px 0',
                                color: passedPercentage >= 75 ? 'var(--color-moss)' : 'var(--color-brick)',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              {correctCount} / {allQuestions.length} correct ({passedPercentage}%)
                            </div>

                            <p style={{ color: 'var(--color-ink-muted)', fontSize: 14, maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
                              {passedPercentage >= 75
                                ? 'Congratulations! You have demonstrated mastery of this syntactic structure and unlocked the next curriculum milestone.'
                                : 'You scored below the 75% accuracy threshold. Review the coach feedback on incorrect items or retry the drill.'}
                            </p>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                  setQuizFinished(false);
                                  setCurrentQuizIndex(0);
                                }}
                              >
                                <span>Review Questions One by One</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleResetQuiz}
                              >
                                <RotateCcw size={14} />
                                <span>Retry Practice Drill</span>
                              </button>
                            </div>
                          </div>
                        ) : q ? (
                          /* Single Question Workbench Frame */
                          <div className="card" style={{ padding: 'var(--space-xl)' }}>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                marginBottom: 16,
                                paddingBottom: 14,
                                borderBottom: '1px solid var(--color-rule)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                  Question {currentQuizIndex + 1} of {allQuestions.length}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                                  Progress: {Object.keys(questionResults).length}/{allQuestions.length} answered
                                </span>
                              </div>

                              {/* Numbered Stepper */}
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 6,
                                  alignItems: 'center',
                                  overflowX: 'auto',
                                  padding: '4px 2px',
                                  scrollbarWidth: 'none'
                                }}
                              >
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
                                      type="button"
                                      onClick={() => setCurrentQuizIndex(idx)}
                                      style={{
                                        minWidth: 28,
                                        width: 28,
                                        height: 28,
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        display: 'grid',
                                        placeItems: 'center',
                                        cursor: 'pointer',
                                        background: bg,
                                        border,
                                        color,
                                        padding: 0
                                      }}
                                    >
                                      {qRes?.checked ? (qRes.isCorrect ? '✓' : '✗') : idx + 1}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Question Prompt */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span className="syllabus-badge">
                                {q.type ? q.type.toUpperCase() : 'PRACTICE'} · {q.errorTaxonomy || 'ERR_STRUCTURE'}
                              </span>
                              {questionResults[q._id]?.checked && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: questionResults[q._id].isCorrect ? 'var(--color-moss)' : 'var(--color-brick)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  {questionResults[q._id].isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
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
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => playAudio(q.media?.url, q.correctAnswer)}
                                >
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
                                        fontWeight: 600
                                      };
                                    } else if (isSelected && !isThisCorrect) {
                                      customStyle = {
                                        background: 'var(--color-brick-soft)',
                                        borderColor: 'var(--color-brick)',
                                        color: 'var(--color-brick)',
                                        fontWeight: 600
                                      };
                                    } else {
                                      customStyle = { opacity: 0.6 };
                                    }
                                  } else if (isSelected) {
                                    customStyle = {
                                      borderColor: 'var(--color-accent)',
                                      background: 'var(--color-accent-soft)',
                                      fontWeight: 600
                                    };
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      type="button"
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
                                        transition: 'border-color var(--dur-fast) var(--ease-out)'
                                      }}
                                      onClick={() => setQuizAnswers({ ...quizAnswers, [q._id]: opt })}
                                    >
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
                                  type="text"
                                  disabled={!!questionResults[q._id]?.checked}
                                  className="input-text"
                                  placeholder={q.type === 'dictation' ? 'Type the key academic word you hear...' : 'Type your answer here...'}
                                  value={quizAnswers[q._id] || ''}
                                  onChange={(e) => setQuizAnswers({ ...quizAnswers, [q._id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !questionResults[q._id]?.checked && (quizAnswers[q._id] || '').trim()) {
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
                                  background: questionResults[q._id].isCorrect ? 'var(--color-moss-soft)' : 'var(--color-brick-soft)',
                                  color: questionResults[q._id].isCorrect ? 'var(--color-moss)' : 'var(--color-brick)',
                                  border: '1px solid var(--color-rule)'
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                                  {questionResults[q._id].isCorrect
                                    ? '✓ Accurate!'
                                    : `✗ Revision needed. Accepted standard: ${q.correctAnswer}`}
                                </div>
                                {q.explanation && (
                                  <p style={{ marginTop: 4, color: 'var(--color-ink)', fontSize: 13, lineHeight: 1.5 }}>
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
                                flexWrap: 'wrap'
                              }}
                            >
                              {questionResults[q._id]?.checked ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleRetryQuestion(q._id)}
                                  >
                                    <RotateCcw size={13} />
                                    <span>Retry Question</span>
                                  </button>

                                  {currentQuizIndex < allQuestions.length - 1 ? (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => setCurrentQuizIndex(currentQuizIndex + 1)}
                                    >
                                      <span>Next Question</span>
                                      <ArrowRight size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => setQuizFinished(true)}
                                    >
                                      <span>View Drill Summary</span>
                                      <ArrowRight size={14} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div />
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleCheckSingleQuestion(q)}
                                    disabled={!(quizAnswers[q._id] || '').trim()}
                                  >
                                    <span>Check Answer</span>
                                  </button>
                                </>
                              )}
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
