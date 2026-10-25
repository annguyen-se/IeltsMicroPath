/* Hallmark · macrostructure: Split View / Studio · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Split View · design-system: design.md · designed-as-app */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import MarkdownView from '../../components/MarkdownView';
import {
  ArrowLeft,
  Headphones,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  Sparkles,
  ExternalLink,
  ZoomIn,
  FileText,
  SkipBack,
  SkipForward,
  Lightbulb,
  X
} from 'lucide-react';

const LISTENING_FORMAT_LABELS = {
  mcq: 'MULTIPLE CHOICE',
  'mcq-multiple': 'MULTIPLE CHOICE (PICK ANSWERS)',
  matching: 'MATCHING',
  'matching-features': 'MATCHING',
  'matching-info': 'MATCHING INFORMATION',
  'diagram-label': 'PLAN / MAP / DIAGRAM LABELLING',
  'form-completion': 'FORM COMPLETION',
  'note-completion': 'NOTE COMPLETION',
  'table-completion': 'TABLE COMPLETION',
  'sentence-completion': 'SENTENCE COMPLETION',
  'summary-completion': 'SUMMARY / FLOW-CHART COMPLETION',
  'short-answer': 'SHORT-ANSWER QUESTION',
  standard: 'QUESTION'
};

export default function ListeningPracticeRoom({ isAuthenticated = false, onOpenAuth }) {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeSection, setActiveSection] = useState('all');
  const [reviewResult, setReviewResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTheoryModal, setShowTheoryModal] = useState(false);

  // Audio Player State
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/lessons/${lessonId}`);
      if (res) {
        setLesson(res.lesson);
        setQuestions(res.questions || []);

        // Restore previous attempt IF the user previously took the test
        if (res.lastAttempt && Array.isArray(res.lastAttempt.answers) && res.lastAttempt.answers.length > 0) {
          const attemptAnswersMap = new Map(
            res.lastAttempt.answers.map((a) => [String(a.questionId), a])
          );
          const restoredAnswers = {};
          const detailed = (res.questions || []).map((q) => {
            const userAtt = attemptAnswersMap.get(String(q._id));
            const uAns = userAtt ? userAtt.userAnswer : '';
            restoredAnswers[q._id] = uAns;
            return {
              ...q,
              userAnswer: uAns,
              isCorrect: userAtt ? !!userAtt.isCorrect : false,
            };
          });

          setAnswers(restoredAnswers);
          setReviewResult({
            isReviewUnlocked: true,
            passed: !!res.lastAttempt.passed,
            score: res.lastAttempt.score,
            totalQuestions: res.lastAttempt.totalQuestions,
            scorePercentage: res.lastAttempt.percentage,
            attemptNumber: res.lastAttempt.attemptNumber,
            message: res.lastAttempt.passed
              ? `Bạn đã hoàn thành bài thi với ${res.lastAttempt.percentage}%.`
              : `Lượt làm bài trước: ${res.lastAttempt.score}/${res.lastAttempt.totalQuestions} câu.`,
            detailedQuestions: detailed,
            audioTranscript: res.lesson?.audioTranscript || '',
            paraphrasePairs: res.lesson?.paraphrasePairs || [],
          });
        } else {
          setReviewResult(null);
          setAnswers({});
        }
      }
    } catch (err) {
      console.warn('[Fetch Listening Lesson Error]:', err.message);
      setErrorMsg(err.message || 'Không thể tải bài thi Listening.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Audio Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.warn('Audio play blocked:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds) => {
    if (!audioRef.current) return;
    const next = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const handleSpeedToggle = () => {
    const speeds = [0.8, 1.0, 1.25];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.muted = next;
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Submission
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const payloadAnswers = questions.map((q) => ({
      questionId: q._id,
      userAnswer: (answers[q._id] || '').trim()
    }));

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/learning/submit-session', {
        lessonResults: {
          lessonId,
          answers: payloadAnswers
        }
      });

      const reviewData = res?.lessonReviewData;
      if (reviewData) {
        setReviewResult(reviewData);
      } else {
        await fetchLessonData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi nộp bài thi Listening.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <Headphones className="animate-bounce mx-auto text-orange-700 dark:text-orange-500 mb-3" size={32} />
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
          Đang nạp bài thi Listening & Audio tracks...
        </p>
      </div>
    );
  }

  if (errorMsg && !lesson) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-white dark:bg-stone-900 border border-red-300 dark:border-red-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Không thể truy cập bài thi</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-5">{errorMsg}</p>
          <button
            className="px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            onClick={() => navigate('/lessons')}
          >
            Về Danh mục bài học
          </button>
        </div>
      </div>
    );
  }

  const isReviewUnlocked = !!reviewResult?.isReviewUnlocked;
  const detailedQuestions = reviewResult?.detailedQuestions || questions;
  const audioTranscript = reviewResult?.audioTranscript || lesson?.audioTranscript || '';
  const audioUrl = lesson?.media?.url || '';

  // Filter questions by section if questions have metadata.section
  const sections = ['all', 'Section 1', 'Section 2', 'Section 3', 'Section 4'];
  const hasSections = questions.some((q) => q.metadata?.section);
  const filteredQuestions = hasSections && activeSection !== 'all'
    ? detailedQuestions.filter((q) => q.metadata?.section === activeSection)
    : detailedQuestions;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 pt-4 pb-20">
      {/* Hidden Native Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* ─── Top Control Bar ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            onClick={() => navigate('/lessons')}
          >
            <ArrowLeft size={14} />
            <span>Danh mục</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                Level {lesson?.level ?? 1} · IELTS Listening
              </span>
              {reviewResult?.passed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Award size={11} /> Đã thành thạo
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight mt-1 flex items-center gap-2">
              <Headphones size={20} className="text-orange-700 dark:text-orange-500" />
              <span>{lesson?.title}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(lesson?.relatedTheoryLesson?.contentMarkdown || lesson?.contentMarkdown) && (
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors inline-flex items-center gap-1.5 shadow-sm"
              onClick={() => setShowTheoryModal(true)}
            >
              <Lightbulb size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Chiến lược & Lý thuyết</span>
            </button>
          )}

          {isReviewUnlocked && (
            <button
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
              onClick={() => {
                setReviewResult(null);
                setAnswers({});
                setShowTranscript(false);
              }}
            >
              <RotateCcw size={14} />
              <span>Làm lại bài thi</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Sticky IELTS Audio Player ─── */}
      <div className="sticky top-16 z-30 mb-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Play / Skip Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Lùi 10 giây"
            >
              <SkipBack size={18} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-orange-700 hover:bg-orange-800 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              aria-label={isPlaying ? 'Tạm dừng audio' : 'Phát audio'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Tiến 10 giây"
            >
              <SkipForward size={18} />
            </button>

            <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 ml-2">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>

          {/* Scrub Bar */}
          <div className="flex-1 max-w-xl mx-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-orange-700 dark:accent-orange-500 cursor-pointer h-2 bg-stone-200 dark:bg-stone-700 rounded-lg"
            />
          </div>

          {/* Speed & Volume Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSpeedToggle}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-orange-500 transition-colors"
              title="Tốc độ phát"
            >
              {playbackRate}x
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {isReviewUnlocked && audioTranscript && (
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all inline-flex items-center gap-1.5 ${
                  showTranscript
                    ? 'bg-orange-700 text-white border-orange-700'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:bg-stone-200'
                }`}
              >
                <FileText size={13} />
                <span>Audio Script</span>
              </button>
            )}
          </div>
        </div>

        {/* Revealed Audio Transcript in Review Mode */}
        {showTranscript && isReviewUnlocked && audioTranscript && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300 max-h-60 overflow-y-auto whitespace-pre-wrap bg-stone-50/60 dark:bg-stone-800/40 p-4 rounded-xl">
            <div className="font-mono font-bold text-xs uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-2">
              Bản ghi âm hội thoại (Tape Script)
            </div>
            {audioTranscript}
          </div>
        )}
      </div>

      {/* ─── Review Result Banner ─── */}
      {reviewResult && (
        <div
          className={`p-4 sm:p-5 rounded-xl border mb-6 flex items-center justify-between flex-wrap gap-4 ${
            reviewResult.passed
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {reviewResult.passed ? <CheckCircle2 size={28} className="shrink-0" /> : <XCircle size={28} className="shrink-0" />}
            <div>
              <h3 className="text-base font-semibold">
                {reviewResult.passed ? 'Hoàn thành xuất sắc bài Listening!' : 'Chưa đạt chuẩn thành thạo (≥ 75%)'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">{reviewResult.message}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">
              {reviewResult.scorePercentage != null ? `${reviewResult.scorePercentage}%` : ''}
            </div>
            <div className="text-[11px] opacity-75">
              Đúng {reviewResult.score}/{reviewResult.totalQuestions} câu · Lượt: #{reviewResult.attemptNumber || 1}
            </div>
          </div>
        </div>
      )}

      {/* ─── Section Nav Filter (If segmented into Section 1-4) ─── */}
      {hasSections && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeSection === sec
                  ? 'bg-orange-700 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              {sec === 'all' ? `Tất cả (${questions.length} câu)` : sec}
            </button>
          ))}
        </div>
      )}

      {/* ─── Listening Questions Workbench ─── */}
      <div className="flex flex-col gap-5">
        {filteredQuestions.map((q, qIdx) => {
          const currentAns = answers[q._id] || '';
          const isCorrect = q.isCorrect;
          const maxWords = q.metadata?.maxWords || 2;
          const hasOptions = Array.isArray(q.options) && q.options.length > 0;

          return (
            <div
              key={q._id}
              className={`p-5 rounded-2xl border transition-all ${
                isReviewUnlocked
                  ? isCorrect
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-red-50/30 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100 dark:border-stone-800">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500">
                  Câu {q.orderIndex || qIdx + 1} · {LISTENING_FORMAT_LABELS[q.format] || q.format?.toUpperCase() || 'QUESTION'}
                </span>
                {isReviewUnlocked && (
                  <span
                    className={`text-xs font-semibold inline-flex items-center gap-1 ${
                      isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>{isCorrect ? 'Chính xác' : 'Chưa đúng'}</span>
                  </span>
                )}
              </div>

              {/* Prompt */}
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3.5 leading-relaxed">
                {q.prompt}
              </p>

              {/* Format 1: Form Completion (Table / Form Key-Value view) */}
              {q.format === 'form-completion' ? (
                <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800/40 p-3.5 space-y-2">
                  <div className="text-[11px] font-mono font-medium text-stone-500 uppercase tracking-wide">
                    COMPLETE THE FORM ({maxWords === 1 ? 'ONE WORD AND/OR A NUMBER' : `NO MORE THAN ${maxWords} WORDS AND/OR A NUMBER`})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs font-semibold text-stone-600 dark:text-stone-300 font-mono">
                      [Ghi chú {q.orderIndex || qIdx + 1}]:
                    </span>
                    <input
                      type="text"
                      disabled={isReviewUnlocked}
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 text-xs font-medium"
                      placeholder={`Điền câu trả lời ngắn...`}
                      value={currentAns}
                      onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                    />
                  </div>
                </div>
              ) : q.format === 'mcq' ? (
                /* Format 2: Multiple Choice (Single) */
                <div className="flex flex-col gap-2">
                  {(q.options || []).map((opt, optIdx) => {
                    const isSelected = currentAns === opt;
                    const isRightAnswer = isReviewUnlocked && q.correctAnswer === opt;
                    return (
                      <button
                        key={optIdx}
                        disabled={isReviewUnlocked}
                        className={`p-2.5 text-xs text-left rounded-lg border transition-all flex items-start gap-2 ${
                          isRightAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold'
                            : isSelected
                            ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-600 text-orange-900 dark:text-orange-200 font-semibold'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/50'
                        }`}
                        onClick={() => handleAnswerChange(q._id, opt)}
                      >
                        <span className="opacity-40">•</span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : q.format === 'mcq-multiple' ? (
                /* Format 3: Multiple Choice (Pick 2 or more) */
                (() => {
                  const selectedList = (currentAns || '').split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
                  const correctList = isReviewUnlocked
                    ? String(q.correctAnswer || '').split(/[,;\n]+/).map((s) => s.trim().toLowerCase())
                    : [];
                  const reqSelections = q.metadata?.requiredSelections || 2;

                  const toggleMulti = (opt) => {
                    if (isReviewUnlocked) return;
                    let next = [...selectedList];
                    const idx = next.indexOf(opt);
                    if (idx > -1) {
                      next.splice(idx, 1);
                    } else {
                      if (next.length >= reqSelections) {
                        next = [...next.slice(1), opt];
                      } else {
                        next.push(opt);
                      }
                    }
                    handleAnswerChange(q._id, next.join(', '));
                  };

                  return (
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-mono text-stone-500 font-medium mb-0.5">
                        Chọn {reqSelections} phương án ({selectedList.length}/{reqSelections})
                      </div>
                      {(q.options || []).map((opt, optIdx) => {
                        const isSelected = selectedList.includes(opt);
                        const isRight = isReviewUnlocked && correctList.includes(opt.trim().toLowerCase());
                        return (
                          <button
                            key={optIdx}
                            disabled={isReviewUnlocked}
                            className={`p-2.5 text-xs text-left rounded-lg border transition-all flex items-start gap-2.5 ${
                              isRight
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold'
                                : isSelected
                                ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-600 text-orange-900 dark:text-orange-200 font-semibold'
                                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/50'
                            }`}
                            onClick={() => toggleMulti(opt)}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-4 h-4 rounded border text-[10px] shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-orange-700 border-orange-700 text-white'
                                  : 'border-stone-400 bg-white dark:bg-stone-800 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()
              ) : q.format === 'diagram-label' ? (
                /* Format 4: Plan / Map / Diagram Labelling */
                <div className="space-y-3">
                  {q.media?.url && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 p-2">
                      <img
                        src={q.media.url}
                        alt={q.prompt}
                        className="max-h-64 mx-auto object-contain rounded-lg"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    disabled={isReviewUnlocked}
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 text-xs"
                    placeholder={`Nhập tên vị trí trên bản đồ / sơ đồ...`}
                    value={currentAns}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  />
                </div>
              ) : hasOptions ? (
                /* Format 5: Matching / Word Bank Selection */
                <div className="space-y-2">
                  <select
                    disabled={isReviewUnlocked}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isReviewUnlocked
                        ? isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                          : 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-orange-600'
                    }`}
                    value={currentAns}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  >
                    <option value="">-- Chọn đáp án phù hợp --</option>
                    {q.options.map((opt, optIdx) => (
                      <option key={optIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Format 6: Sentence / Note / Summary Completion */
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono font-medium text-stone-500 uppercase tracking-wide">
                    NO MORE THAN {maxWords === 1 ? 'ONE WORD' : `${maxWords} WORDS`}
                  </div>
                  <input
                    type="text"
                    disabled={isReviewUnlocked}
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 text-xs font-medium"
                    placeholder={`Nhập từ nghe được vào chỗ trống (tối đa ${maxWords} từ)...`}
                    value={currentAns}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  />
                </div>
              )}

              {/* Review Feedback */}
              {isReviewUnlocked && (
                <div className="mt-3 pt-2.5 border-t border-dashed border-stone-200 dark:border-stone-700 text-xs leading-relaxed">
                  <div className="mb-1">
                    <strong className="text-stone-700 dark:text-stone-300">Đáp án chính xác:</strong>{' '}
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                      {q.correctAnswer}
                    </span>
                  </div>
                  {q.explanation && (
                    <div className="text-stone-600 dark:text-stone-400 mt-1">
                      <strong>Giải thích chi tiết:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Bottom Submit Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 p-3.5 z-40">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-stone-500 font-mono">
            Đã điền:{' '}
            <strong className="text-stone-800 dark:text-stone-200">
              {Object.keys(answers).filter((k) => (answers[k] || '').trim()).length}
            </strong>{' '}
            / {questions.length} câu
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="px-6 py-2 bg-orange-700 hover:bg-orange-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Đang chấm điểm...' : isReviewUnlocked ? 'Nộp lại bài thi' : 'Nộp bài thi Listening'}
          </button>
        </div>
      </div>

      {/* ─── Linked Strategy & Theory Modal ─── */}
      {showTheoryModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowTheoryModal(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
                  {lesson?.relatedTheoryLesson?.title || 'Chiến lược & Phương pháp nghe'}
                </h3>
              </div>
              <button
                type="button"
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                onClick={() => setShowTheoryModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <MarkdownView
                content={
                  lesson?.relatedTheoryLesson?.contentMarkdown ||
                  lesson?.contentMarkdown ||
                  'Chưa có tài liệu lý thuyết nào được gắn với bài thi nghe này.'
                }
              />
            </div>
            <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                onClick={() => setShowTheoryModal(false)}
              >
                Quay lại làm bài nghe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
