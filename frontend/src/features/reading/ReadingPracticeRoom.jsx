import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio } from '../../utils/audio';
import MarkdownView from '../../components/MarkdownView';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Volume2,
  ExternalLink,
  Award,
  Sparkles,
  RotateCcw,
  ZoomIn,
  Lightbulb,
  X
} from 'lucide-react';

const FORMAT_LABELS = {
  tfng: 'TRUE / FALSE / NOT GIVEN',
  ynng: 'YES / NO / NOT GIVEN',
  mcq: 'MULTIPLE CHOICE',
  'mcq-multiple': 'MULTIPLE CHOICE (PICK ANSWERS)',
  'matching-headings': 'MATCHING HEADINGS',
  'matching-info': 'MATCHING INFORMATION',
  'matching-features': 'MATCHING FEATURES',
  'matching-endings': 'MATCHING SENTENCE ENDINGS',
  'sentence-completion': 'SENTENCE COMPLETION',
  'short-answer': 'SHORT-ANSWER QUESTION',
  'summary-completion': 'SUMMARY COMPLETION',
  'diagram-label': 'DIAGRAM LABEL COMPLETION',
  'vocab-context': 'VOCABULARY IN CONTEXT'
};

function MatchingSelector({
  q,
  currentAns,
  onAnswerChange,
  isReviewUnlocked,
  isCorrect,
  allQuestions,
  answers,
  onScrollToParagraph
}) {
  const [showOptionsList, setShowOptionsList] = useState(true);
  const options = q.options || [];

  const peerQuestions = (allQuestions || []).filter(
    (other) => other._id !== q._id && other.format === q.format
  );

  const getUsedInQuestion = (opt) => {
    const cleanOpt = opt.trim().toLowerCase();
    const found = peerQuestions.find(
      (other) => (answers[other._id] || '').trim().toLowerCase() === cleanOpt
    );
    if (!found) return null;
    return found.orderIndex || allQuestions.indexOf(found) + 1;
  };

  const pMatch = q.prompt.match(/(?:Paragraph|Đoạn)\s+([A-Z])|\[([A-Z])\]/i);
  const targetP = pMatch ? (pMatch[1] || pMatch[2]).toUpperCase() : q.evidence?.paragraphLabel || null;

  return (
    <div className="space-y-3">
      {targetP && onScrollToParagraph && (
        <div>
          <button
            type="button"
            onClick={() => onScrollToParagraph(targetP)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-950/50 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors"
          >
            <span>Đến đoạn [{targetP}] trong bài đọc</span>
            <ExternalLink size={11} />
          </button>
        </div>
      )}

      {options.length > 0 && (
        <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-200/60 dark:border-stone-700/60">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              Danh sách lựa chọn ({options.length})
            </span>
            <button
              type="button"
              className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
              onClick={() => setShowOptionsList((prev) => !prev)}
            >
              {showOptionsList ? 'Thu gọn' : 'Xem tất cả'}
            </button>
          </div>

          {showOptionsList && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {options.map((opt, idx) => {
                const isSelectedForThis = currentAns === opt;
                const usedAtQ = getUsedInQuestion(opt);
                const isRight = isReviewUnlocked && q.correctAnswer === opt;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isReviewUnlocked}
                    onClick={() => onAnswerChange(q._id, opt)}
                    className={`text-left text-xs p-2 rounded border transition-all flex items-start justify-between gap-1.5 ${
                      isRight
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : isSelectedForThis
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-600 text-orange-900 dark:text-orange-200 font-semibold shadow-xs'
                        : usedAtQ
                        ? 'opacity-60 bg-stone-100 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-500 line-through'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-orange-400'
                    }`}
                  >
                    <span className="line-clamp-2 leading-snug">{opt}</span>
                    {usedAtQ && !isSelectedForThis && (
                      <span className="no-underline shrink-0 text-[9px] px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-mono">
                        Câu {usedAtQ}
                      </span>
                    )}
                    {isSelectedForThis && (
                      <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-orange-700 text-white font-mono">
                        Đang chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
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
          onChange={(e) => onAnswerChange(q._id, e.target.value)}
        >
          <option value="">-- Chọn phương án ghép nối --</option>
          {options.map((opt, optIdx) => {
            const usedAtQ = getUsedInQuestion(opt);
            const labelSuffix = usedAtQ && currentAns !== opt ? ` [Đã chọn ở Câu ${usedAtQ}]` : '';
            return (
              <option key={optIdx} value={opt}>
                {opt}{labelSuffix}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}

function SummaryCompletionItem({
  q,
  currentAns,
  onAnswerChange,
  isReviewUnlocked,
  isCorrect,
  onScrollToParagraph
}) {
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;
  const maxWords = q.metadata?.maxWords || 2;
  const targetP = q.evidence?.paragraphLabel;

  const blankRegex = /(_{3,}|\[\.\.\.\]|\{gap\}|\[blank\])/i;
  const hasInlineBlank = blankRegex.test(q.prompt);

  return (
    <div className="space-y-3">
      {targetP && onScrollToParagraph && (
        <div>
          <button
            type="button"
            onClick={() => onScrollToParagraph(targetP)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-950/50 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors"
          >
            <span>Tham chiếu đoạn [{targetP}]</span>
            <ExternalLink size={11} />
          </button>
        </div>
      )}

      <div className="text-[11px] font-mono font-medium text-stone-500 uppercase tracking-wide">
        {hasOptions
          ? 'COMPLETE THE SUMMARY USING THE WORD BANK'
          : `COMPLETE THE SUMMARY (NO MORE THAN ${maxWords === 1 ? 'ONE WORD' : maxWords === 2 ? 'TWO WORDS' : `${maxWords} WORDS`})`}
      </div>

      {hasOptions && (
        <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2 pb-1 border-b border-stone-200/60 dark:border-stone-700/60">
            Ngân hàng từ vựng (Word Bank)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((opt, idx) => {
              const isSelected = currentAns === opt;
              const isRight = isReviewUnlocked && q.correctAnswer === opt;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isReviewUnlocked}
                  onClick={() => onAnswerChange(q._id, opt)}
                  className={`text-xs px-2.5 py-1.5 rounded border transition-all ${
                    isRight
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : isSelected
                      ? 'bg-orange-700 border-orange-700 text-white font-semibold shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-orange-400'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasInlineBlank ? (
        <div className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200">
          {q.prompt.split(blankRegex).map((part, pIdx) => {
            if (blankRegex.test(part)) {
              if (hasOptions) {
                return (
                  <select
                    key={pIdx}
                    disabled={isReviewUnlocked}
                    className={`inline-block mx-1.5 px-2 py-1 rounded border text-xs font-semibold ${
                      isReviewUnlocked
                        ? isCorrect
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                          : 'bg-red-100 border-red-500 text-red-900'
                        : 'bg-white dark:bg-stone-800 border-orange-400 text-stone-900 dark:text-stone-100'
                    }`}
                    value={currentAns}
                    onChange={(e) => onAnswerChange(q._id, e.target.value)}
                  >
                    <option value="">[____]</option>
                    {q.options.map((opt, optIdx) => (
                      <option key={optIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                );
              }
              return (
                <input
                  key={pIdx}
                  type="text"
                  disabled={isReviewUnlocked}
                  className={`inline-block mx-1.5 px-2.5 py-1 w-36 sm:w-44 rounded border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-600 ${
                    isReviewUnlocked
                      ? isCorrect
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-red-50 border-red-500 text-red-900'
                      : 'bg-white dark:bg-stone-800 border-orange-500 text-stone-900 dark:text-stone-100'
                  }`}
                  placeholder="điền từ..."
                  value={currentAns}
                  onChange={(e) => onAnswerChange(q._id, e.target.value)}
                />
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      ) : hasOptions ? (
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
          onChange={(e) => onAnswerChange(q._id, e.target.value)}
        >
          <option value="">-- Chọn từ phù hợp từ Word Bank --</option>
          {q.options.map((opt, optIdx) => (
            <option key={optIdx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          disabled={isReviewUnlocked}
          className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 text-xs"
          placeholder={`Nhập từ vào tóm tắt (tối đa ${maxWords} từ)...`}
          value={currentAns}
          onChange={(e) => onAnswerChange(q._id, e.target.value)}
        />
      )}
    </div>
  );
}

function DiagramLabelItem({
  q,
  currentAns,
  onAnswerChange,
  isReviewUnlocked,
  isCorrect,
  onScrollToParagraph
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const maxWords = q.metadata?.maxWords || 2;
  const targetP = q.evidence?.paragraphLabel;

  return (
    <div className="space-y-3">
      {targetP && onScrollToParagraph && (
        <div>
          <button
            type="button"
            onClick={() => onScrollToParagraph(targetP)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-950/50 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors"
          >
            <span>Tham chiếu đoạn [{targetP}]</span>
            <ExternalLink size={11} />
          </button>
        </div>
      )}

      <div className="text-[11px] font-mono font-medium text-stone-500 uppercase tracking-wide">
        LABEL THE DIAGRAM ({maxWords === 1 ? 'ONE WORD ONLY' : `NO MORE THAN ${maxWords} WORDS`})
      </div>

      {q.media?.url && (
        <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 p-2.5 group">
          <img
            src={q.media.url}
            alt={q.prompt}
            className="max-h-60 mx-auto object-contain rounded-lg cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
          />
          <button
            type="button"
            className="absolute right-3 bottom-3 px-2 py-1 rounded bg-stone-900/70 hover:bg-stone-900 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xs transition-opacity opacity-80 group-hover:opacity-100 shadow-sm"
            onClick={() => setIsZoomed(true)}
          >
            <ZoomIn size={12} />
            <span>Phóng to</span>
          </button>
        </div>
      )}

      {isZoomed && q.media?.url && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-2xl overflow-auto border border-stone-300 dark:border-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold font-mono text-stone-700 dark:text-stone-300">
                Sơ đồ kỹ thuật (Technical Diagram / Flow-chart)
              </span>
              <button
                type="button"
                className="p-1 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                onClick={() => setIsZoomed(false)}
              >
                ✕
              </button>
            </div>
            <img
              src={q.media.url}
              alt={q.prompt}
              className="max-h-[75vh] w-auto mx-auto object-contain rounded"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="shrink-0 px-2.5 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold text-orange-700 dark:text-orange-500">
          Nhãn [{q.orderIndex || '1'}]
        </span>
        <input
          type="text"
          disabled={isReviewUnlocked}
          className={`w-full px-3.5 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all ${
            isReviewUnlocked
              ? isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200'
              : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400'
          }`}
          placeholder={`Nhập nhãn từ đoạn văn (tối đa ${maxWords} từ)...`}
          value={currentAns}
          onChange={(e) => onAnswerChange(q._id, e.target.value)}
        />
      </div>
    </div>
  );
}

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
  const [showTheoryModal, setShowTheoryModal] = useState(false);

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
            paraphrasePairs: res.lesson?.paraphrasePairs || [],
            vocabAnchors: res.lesson?.vocabAnchors || [],
          });
        } else {
          setReviewResult(null);
          setAnswers({});
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

  const scrollToParagraph = (label) => {
    if (activeMobileTab === 'questions') {
      setActiveMobileTab('passage');
    }
    setTimeout(() => {
      const el = document.getElementById(`paragraph-${label}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-orange-50/70', 'dark:bg-orange-950/40');
        setTimeout(() => {
          el.classList.remove('bg-orange-50/70', 'dark:bg-orange-950/40');
        }, 1600);
      }
    }, 60);
  };

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
              }}
            >
              <RotateCcw size={14} />
              <span>Làm lại bài này</span>
            </button>
          )}
        </div>
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
                id={`paragraph-${p.label}`}
                className="relative pl-8 border-l-2 border-stone-200 dark:border-stone-700 rounded-r p-1 transition-all duration-300"
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
                      Câu {q.orderIndex || qIdx + 1} · {FORMAT_LABELS[q.format] || q.format?.toUpperCase() || 'QUESTION'}
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
                  {!(q.format === 'summary-completion' && /(_{3,}|\[\.\.\.\]|\{gap\}|\[blank\])/i.test(q.prompt)) && (
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3 leading-relaxed">
                      {q.prompt}
                    </p>
                  )}

                  {/* Input by format */}
                  {q.format === 'tfng' || q.format === 'ynng' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {(q.format === 'ynng'
                        ? ['YES', 'NO', 'NOT GIVEN']
                        : ['TRUE', 'FALSE', 'NOT GIVEN']
                      ).map((opt) => (
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
                  ) : q.format === 'mcq-multiple' ? (
                    (() => {
                      const selectedList = (currentAns || '')
                        .split(/[,;\n]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const correctList = isReviewUnlocked
                        ? String(q.correctAnswer || '')
                            .split(/[,;\n]+/)
                            .map((s) => s.trim().toLowerCase())
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
                            Chọn {reqSelections} đáp án ({selectedList.length}/{reqSelections})
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
                  ) : ['matching-headings', 'matching-info', 'matching-features', 'matching-endings'].includes(q.format) ? (
                    <MatchingSelector
                      q={q}
                      currentAns={currentAns}
                      onAnswerChange={handleAnswerChange}
                      isReviewUnlocked={isReviewUnlocked}
                      isCorrect={isCorrect}
                      allQuestions={detailedQuestions}
                      answers={answers}
                      onScrollToParagraph={scrollToParagraph}
                    />
                  ) : q.format === 'diagram-label' ? (
                    <DiagramLabelItem
                      q={q}
                      currentAns={currentAns}
                      onAnswerChange={handleAnswerChange}
                      isReviewUnlocked={isReviewUnlocked}
                      isCorrect={isCorrect}
                      onScrollToParagraph={scrollToParagraph}
                    />
                  ) : q.format === 'summary-completion' ? (
                    <SummaryCompletionItem
                      q={q}
                      currentAns={currentAns}
                      onAnswerChange={handleAnswerChange}
                      isReviewUnlocked={isReviewUnlocked}
                      isCorrect={isCorrect}
                      onScrollToParagraph={scrollToParagraph}
                    />
                  ) : (
                    <div className="space-y-1.5">
                      {q.format === 'short-answer' && (
                        <div className="text-[11px] font-mono font-medium text-stone-500 uppercase tracking-wide">
                          {q.metadata?.maxWords ? `NO MORE THAN ${q.metadata.maxWords} WORDS` : 'NO MORE THAN THREE WORDS'}
                        </div>
                      )}
                      <input
                        type="text"
                        disabled={isReviewUnlocked}
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 text-xs"
                        placeholder={
                          q.format === 'short-answer'
                            ? `Nhập câu trả lời ngắn (${q.metadata?.maxWords ? `tối đa ${q.metadata.maxWords} từ` : 'tối đa 3 từ'})...`
                            : 'Nhập 1 từ điền vào chỗ trống...'
                        }
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
                  {lesson?.relatedTheoryLesson?.title || 'Chiến lược & Lý thuyết làm bài'}
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
                  'Chưa có tài liệu lý thuyết nào được gắn với bài tập này.'
                }
              />
            </div>
            <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                onClick={() => setShowTheoryModal(false)}
              >
                Quay lại làm bài đọc hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
