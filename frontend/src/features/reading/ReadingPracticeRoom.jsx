import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio } from '../../utils/audio';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Volume2,
  ExternalLink,
  Award,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function ReadingPracticeRoom({ isAuthenticated = false, onOpenAuth }) {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [activeMobileTab, setActiveMobileTab] = useState('passage'); // 'passage' | 'questions'
  const [reviewResult, setReviewResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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

        // If the user already unlocked review on load
        if (res.isReviewUnlocked && res.questions?.[0]?.correctAnswer) {
          setReviewResult({
            isReviewUnlocked: true,
            passed: true,
            detailedQuestions: res.questions,
            paraphrasePairs: res.lesson?.paraphrasePairs || [],
            vocabAnchors: res.lesson?.vocabAnchors || [],
            vocabularies: res.vocabularies || []
          });
        }
      }
    } catch (err) {
      console.warn('[Fetch Reading Lesson Error]:', err.message);
      setErrorMsg(err.message || 'Không thể tải bài đọc.');
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
      setErrorMsg(err.message || 'Lỗi khi nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Merges overlapping substring ranges and renders highlighted text
  const renderHighlightedText = (text, paragraphLabel, anchors = [], pairs = []) => {
    if (!reviewResult?.isReviewUnlocked) {
      return <span>{text}</span>;
    }

    const ranges = [];

    // 1. Collect anchor ranges
    anchors.forEach((a) => {
      if (a.paragraphLabel === paragraphLabel && a.text) {
        let startIdx = text.indexOf(a.text);
        while (startIdx !== -1) {
          ranges.push({
            start: startIdx,
            end: startIdx + a.text.length,
            type: 'anchor',
            label: a.text
          });
          startIdx = text.indexOf(a.text, startIdx + 1);
        }
      }
    });

    // 2. Collect paraphrase pair ranges
    pairs.forEach((p) => {
      if (p.paragraphLabel === paragraphLabel && p.passageText) {
        let startIdx = text.indexOf(p.passageText);
        while (startIdx !== -1) {
          ranges.push({
            start: startIdx,
            end: startIdx + p.passageText.length,
            type: 'pair',
            label: p.passageText
          });
          startIdx = text.indexOf(p.passageText, startIdx + 1);
        }
      }
    });

    if (ranges.length === 0) return <span>{text}</span>;

    // Sort ranges by start position
    ranges.sort((a, b) => a.start - b.start || b.end - a.end);

    // Merge overlapping or nested ranges
    const merged = [];
    let current = { ...ranges[0] };

    for (let i = 1; i < ranges.length; i++) {
      const next = ranges[i];
      if (next.start < current.end) {
        current.end = Math.max(current.end, next.end);
        if (next.type === 'pair') current.type = 'pair';
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);

    // Build segments
    const elements = [];
    let lastIdx = 0;

    merged.forEach((m, idx) => {
      if (m.start > lastIdx) {
        elements.push(text.substring(lastIdx, m.start));
      }
      const matchedSnippet = text.substring(m.start, m.end);
      const isPair = m.type === 'pair';
      elements.push(
        <mark
          key={idx}
          className={`px-1 py-0.5 rounded font-semibold ${
            isPair
              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-b-2 border-emerald-600'
              : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 border-b-2 border-indigo-600'
          }`}
          title={isPair ? 'Cụm từ Paraphrase đối chiếu' : 'Từ vựng mục tiêu'}
        >
          {matchedSnippet}
        </mark>
      );
      lastIdx = m.end;
    });

    if (lastIdx < text.length) {
      elements.push(text.substring(lastIdx));
    }

    return <span>{elements}</span>;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <p className="text-stone-500 text-base">Đang nạp bài đọc IELTS...</p>
      </div>
    );
  }

  if (errorMsg && !lesson) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-white dark:bg-stone-900 border border-red-300 dark:border-red-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Không thể truy cập bài đọc</h2>
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
  const paraphrasePairs = reviewResult?.paraphrasePairs || lesson?.paraphrasePairs || [];
  const vocabAnchors = reviewResult?.vocabAnchors || lesson?.vocabAnchors || [];
  const paragraphs = lesson?.passage?.paragraphs || [];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-16">
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
                Level {lesson?.level ?? 2} · Reading Practice
              </span>
              {reviewResult?.passed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Award size={11} /> Đã thành thạo
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight mt-1 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-700 dark:text-emerald-500" />
              <span>{lesson?.title}</span>
            </h1>
          </div>
        </div>

        {isReviewUnlocked && (
          <button
            className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            onClick={() => {
              setReviewResult(null);
              setAnswers({});
            }}
          >
            <RotateCcw size={14} />
            <span>Làm lại bài này</span>
          </button>
        )}
      </div>

      {/* ─── Mobile Tab Toggles ─── */}
      <div className="lg:hidden flex gap-2 mb-4 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
        <button
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeMobileTab === 'passage'
              ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          onClick={() => setActiveMobileTab('passage')}
        >
          Đoạn văn (Passage)
        </button>
        <button
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeMobileTab === 'questions'
              ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          onClick={() => setActiveMobileTab('questions')}
        >
          Câu hỏi ({questions.length})
        </button>
      </div>

      {/* ─── Review Result Banner (If Submitted) ─── */}
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
                {reviewResult.passed ? 'Hoàn thành xuất sắc!' : 'Chưa đạt ngưỡng thành thạo (≥ 75%)'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">{reviewResult.message}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">
              {reviewResult.scorePercentage != null ? `${reviewResult.scorePercentage}%` : ''}
            </div>
            <div className="text-[11px] opacity-75">Lượt nộp: #{reviewResult.attemptNumber || 1}</div>
          </div>
        </div>
      )}

      {/* ─── Main Split-Screen Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
        {/* ─── LEFT COLUMN: Reading Passage ─── */}
        <div
          className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 sm:p-6 lg:sticky lg:top-20 max-h-[calc(100vh-80px)] overflow-y-auto shadow-sm ${
            activeMobileTab === 'questions' ? 'hidden lg:block' : ''
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Đoạn văn đọc hiểu (Reading Passage)
            </span>
            <span className="text-xs font-mono text-stone-500">
              {paragraphs.length} đoạn · Band {lesson?.level === 2 ? '5.5–6.0' : lesson?.level === 3 ? '6.5–7.0' : '7.5+'}
            </span>
          </div>

          <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-stone-800 dark:text-stone-200 font-sans">
            {paragraphs.map((p) => (
              <div
                key={p.label}
                className="relative pl-8 border-l-2 border-stone-200 dark:border-stone-700"
              >
                <span className="absolute left-2 top-0 font-mono font-bold text-xs text-orange-700 dark:text-orange-500">
                  [{p.label}]
                </span>
                <p className="m-0 text-justify">
                  {renderHighlightedText(p.text, p.label, vocabAnchors, paraphrasePairs)}
                </p>
              </div>
            ))}
          </div>

          {/* ─── Paraphrase Mapping Table (Shown after review unlocked) ─── */}
          {isReviewUnlocked && paraphrasePairs.length > 0 && (
            <div className="mt-8 pt-5 border-t border-stone-200 dark:border-stone-800">
              <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-1.5 mb-3">
                <Sparkles size={15} className="text-emerald-600" />
                <span>Bảng Đối chiếu Cặp Paraphrase (Question ↔ Passage)</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-700">
                      <th className="p-2 font-semibold text-stone-600 dark:text-stone-300">Cụm trong câu hỏi</th>
                      <th className="p-2 font-semibold text-stone-600 dark:text-stone-300">Cụm trong bài đọc</th>
                      <th className="p-2 font-semibold text-stone-600 dark:text-stone-300">Từ vựng gốc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {paraphrasePairs.map((pair, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <td className="p-2 font-medium text-blue-700 dark:text-blue-400">
                          "{pair.questionText}"
                        </td>
                        <td className="p-2 font-medium text-emerald-700 dark:text-emerald-400">
                          "{pair.passageText}" [{pair.paragraphLabel}]
                        </td>
                        <td className="p-2">
                          {pair.vocabId?.word ? (
                            <button
                              className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-orange-700 inline-flex items-center gap-1"
                              onClick={() => navigate(`/paraphrases?word=${pair.vocabId.word}`)}
                              title="Xem trong Paraphrase Explorer"
                            >
                              <span>{pair.vocabId.word}</span>
                              <ExternalLink size={10} />
                            </button>
                          ) : (
                            <span className="text-stone-400">Cấu trúc</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT COLUMN: Questions & Drill ─── */}
        <div className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 sm:p-6 shadow-sm ${
          activeMobileTab === 'passage' ? 'hidden lg:block' : ''
        }`}>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Bài tập thực hành ({questions.length} câu)
            </span>
            <span className="text-xs font-mono text-stone-500">Ngưỡng đạt: ≥ 75%</span>
          </div>

          <div className="flex flex-col gap-5">
            {detailedQuestions.map((q, qIdx) => {
              const currentAns = answers[q._id] || '';
              const isCorrect = q.isCorrect;

              return (
                <div
                  key={q._id}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isReviewUnlocked
                      ? isCorrect
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-red-50/30 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                      : 'bg-stone-50/80 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/60'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500">
                      Câu {q.orderIndex || qIdx + 1} · {q.format?.toUpperCase() || 'QUESTION'}
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
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3 leading-relaxed">
                    {q.prompt}
                  </p>

                  {/* Input by format */}
                  {q.format === 'tfng' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                        <button
                          key={opt}
                          disabled={isReviewUnlocked}
                          className={`py-2 px-1 text-xs font-semibold rounded-md border transition-all ${
                            currentAns === opt
                              ? 'bg-orange-700 text-white border-orange-700 shadow-sm'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                          } ${isReviewUnlocked && q.correctAnswer === opt ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}
                          onClick={() => handleAnswerChange(q._id, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.format === 'mcq' || q.format === 'vocab-context' ? (
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
                  ) : (
                    <div>
                      <input
                        type="text"
                        disabled={isReviewUnlocked}
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 text-xs"
                        placeholder="Nhập 1 từ điền vào chỗ trống..."
                        value={currentAns}
                        onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                      />
                    </div>
                  )}

                  {/* Detailed Explanation & Evidence (When review is unlocked) */}
                  {isReviewUnlocked && (
                    <div className="mt-3 pt-2.5 border-t border-dashed border-stone-200 dark:border-stone-700 text-xs leading-relaxed">
                      <div className="mb-1">
                        <strong className="text-stone-700 dark:text-stone-300">Đáp án đúng:</strong>{' '}
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {q.correctAnswer}
                        </span>
                      </div>
                      {q.evidence?.text ? (
                        <div className="mb-1 text-stone-500">
                          <strong>Bằng chứng [{q.evidence.paragraphLabel}]:</strong> <em>"{q.evidence.text}"</em>
                        </div>
                      ) : q.correctAnswer === 'NOT GIVEN' ? (
                        <div className="mb-1 text-stone-500">
                          <strong>Bằng chứng:</strong> <em>Đoạn văn không cung cấp thông tin cho nội dung này.</em>
                        </div>
                      ) : null}
                      <p className="text-stone-600 dark:text-stone-400 mt-1">
                        <strong>Giải thích:</strong> {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Action */}
          {!isReviewUnlocked && (
            <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800">
              {errorMsg && (
                <p className="text-red-600 text-xs mb-3">{errorMsg}</p>
              )}
              <button
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-orange-700 hover:bg-orange-800 active:translate-y-px rounded-lg shadow-sm transition-all disabled:opacity-50"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Đang chấm điểm...' : 'Nộp bài kiểm tra'}
              </button>
            </div>
          )}

          {/* Vocabulary Recap (After Review Unlocked) */}
          {isReviewUnlocked && lesson?.vocabIds && lesson.vocabIds.length > 0 && (
            <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800 text-left">
              <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-1.5 mb-1.5">
                <Award size={15} className="text-orange-700 dark:text-orange-500" />
                <span>Từ vựng trọng tâm bài đọc ({lesson.vocabIds.length} từ)</span>
              </h4>
              <p className="text-xs text-stone-500 mb-3">
                Toàn bộ từ vựng đã được nạp tự động vào Hộp 1 SRS của bạn (Lịch ôn tập: Ngày mai).
              </p>
              <div className="flex flex-col gap-2">
                {lesson.vocabIds.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 rounded-lg text-xs"
                  >
                    <div>
                      <strong className="text-stone-800 dark:text-stone-200">{v.word}</strong>{' '}
                      <span className="text-stone-400 italic">({v.pos})</span>
                      <div className="text-stone-600 dark:text-stone-400 mt-0.5">{v.meaningVi}</div>
                    </div>
                    <button
                      className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-md hover:bg-stone-200/50"
                      onClick={() => playWordAudio(v.media?.url, v.word)}
                      title="Nghe phát âm"
                    >
                      <Volume2 size={15} className="text-blue-700 dark:text-blue-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
