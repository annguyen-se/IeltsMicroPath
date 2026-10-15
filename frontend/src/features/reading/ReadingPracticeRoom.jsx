import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio } from '../../utils/audio';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  ExternalLink,
  Award,
  Sparkles,
  ChevronRight,
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
        // Fallback: re-fetch lesson detail
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
        if (next.type === 'pair') current.type = 'pair'; // Prioritize pair highlight
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
          style={{
            background: isPair ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.2)',
            color: 'inherit',
            padding: '2px 4px',
            borderRadius: 4,
            fontWeight: 600,
            borderBottom: isPair ? '2px solid var(--color-emerald)' : '2px solid var(--color-cobalt)'
          }}
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
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-muted)', fontSize: 16 }}>Đang nạp bài đọc IELTS...</p>
      </div>
    );
  }

  if (errorMsg && !lesson) {
    return (
      <div className="container" style={{ padding: '40px 20px', maxWidth: 600, textAlign: 'center' }}>
        <div className="card" style={{ padding: 30, border: '1px solid var(--color-rose)' }}>
          <h2 style={{ fontSize: 20, color: 'var(--color-rose)', marginBottom: 8 }}>Không thể truy cập bài đọc</h2>
          <p style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => navigate('/lessons')}>
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
    <div className="container" style={{ maxWidth: 1200, paddingTop: 16, paddingBottom: 60 }}>
      {/* ─── Top Control Bar ─── */}
      <div className="row-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/lessons')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} />
            <span>Danh mục</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="soft-pill" style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
                Level {lesson?.level ?? 2} · Reading Practice
              </span>
              {reviewResult?.passed && (
                <span className="pill pill-success" style={{ fontSize: 11 }}>
                  <Award size={12} /> Đã thành thạo
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 22, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={22} style={{ color: 'var(--color-emerald)' }} />
              <span>{lesson?.title}</span>
            </h1>
          </div>
        </div>

        {isReviewUnlocked && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setReviewResult(null);
              setAnswers({});
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={15} />
            <span>Làm lại bài này</span>
          </button>
        )}
      </div>

      {/* ─── Mobile Tab Toggles ─── */}
      <div className="mobile-only" style={{ display: 'none', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeMobileTab === 'passage' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveMobileTab('passage')}
          >
            Đoạn văn (Passage)
          </button>
          <button
            className={`btn ${activeMobileTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveMobileTab('questions')}
          >
            Câu hỏi ({questions.length})
          </button>
        </div>
      </div>

      {/* ─── Review Result Banner (If Submitted) ─── */}
      {reviewResult && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            padding: 20,
            background: reviewResult.passed ? 'var(--color-emerald-surface)' : 'var(--color-rose-surface)',
            borderColor: reviewResult.passed ? 'var(--color-emerald-border)' : 'var(--color-rose-border)',
            color: reviewResult.passed ? 'var(--color-emerald)' : 'var(--color-rose)'
          }}
        >
          <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {reviewResult.passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              <div>
                <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>
                  {reviewResult.passed ? 'Hoàn thành xuất sắc!' : 'Chưa đạt ngưỡng thành thạo (≥ 75%)'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 14 }}>{reviewResult.message}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {reviewResult.scorePercentage != null ? `${reviewResult.scorePercentage}%` : ''}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Lượt nộp: #{reviewResult.attemptNumber || 1}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Split-Screen Layout ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 0.85fr)',
          gap: 24,
          alignItems: 'start'
        }}
      >
        {/* ─── LEFT COLUMN: Reading Passage ─── */}
        <div
          className={`card ${activeMobileTab === 'questions' ? 'hide-on-mobile' : ''}`}
          style={{ padding: 24, position: 'sticky', top: 20, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}
        >
          <div className="row-between" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase' }}>
              Đoạn văn đọc hiểu (Reading Passage)
            </span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {paragraphs.length} đoạn · Band {lesson?.level === 2 ? '5.5–6.0' : lesson?.level === 3 ? '6.5–7.0' : '7.5+'}
            </span>
          </div>

          <div className="stack" style={{ gap: 20, lineHeight: 1.7, fontSize: 15 }}>
            {paragraphs.map((p) => (
              <div
                key={p.label}
                style={{
                  position: 'relative',
                  paddingLeft: 34,
                  borderLeft: '3px solid var(--border)'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 0,
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'var(--color-cobalt)'
                  }}
                >
                  [{p.label}]
                </span>
                <p style={{ margin: 0, textAlign: 'justify' }}>
                  {renderHighlightedText(p.text, p.label, vocabAnchors, paraphrasePairs)}
                </p>
              </div>
            ))}
          </div>

          {/* ─── Paraphrase Mapping Table (Shown after review unlocked) ─── */}
          {isReviewUnlocked && paraphrasePairs.length > 0 && (
            <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h4 style={{ fontSize: 16, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: 'var(--color-emerald)' }} />
                <span>Bảng Đối chiếu Cặp Paraphrase (Question ↔ Passage)</span>
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>Cụm trong câu hỏi</th>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>Cụm trong bài đọc</th>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>Từ vựng gốc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paraphrasePairs.map((pair, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-cobalt)' }}>
                          "{pair.questionText}"
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--color-emerald)', fontWeight: 600 }}>
                          "{pair.passageText}" [{pair.paragraphLabel}]
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {pair.vocabId?.word ? (
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '2px 6px', fontSize: 12, fontWeight: 700 }}
                              onClick={() => navigate(`/paraphrases?word=${pair.vocabId.word}`)}
                              title="Xem trong Paraphrase Explorer"
                            >
                              {pair.vocabId.word}
                              <ExternalLink size={11} style={{ marginLeft: 4 }} />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--fg-muted)' }}>Cấu trúc</span>
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
        <div className={`card ${activeMobileTab === 'passage' ? 'hide-on-mobile' : ''}`} style={{ padding: 24 }}>
          <div className="row-between" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase' }}>
              Bài tập thực hành ({questions.length} câu)
            </span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Ngưỡng đạt: ≥ 75%</span>
          </div>

          <div className="stack" style={{ gap: 24 }}>
            {detailedQuestions.map((q, qIdx) => {
              const currentAns = answers[q._id] || '';
              const isCorrect = q.isCorrect;

              return (
                <div
                  key={q._id}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: isReviewUnlocked
                      ? isCorrect
                        ? 'rgba(16, 185, 129, 0.05)'
                        : 'rgba(239, 68, 68, 0.05)'
                      : 'var(--surface-subtle)',
                    border: '1px solid',
                    borderColor: isReviewUnlocked
                      ? isCorrect
                        ? 'var(--color-emerald-border)'
                        : 'var(--color-rose-border)'
                      : 'var(--border)'
                  }}
                >
                  {/* Question Header */}
                  <div className="row-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-cobalt)', textTransform: 'uppercase' }}>
                      Câu {q.orderIndex || qIdx + 1} · {q.format?.toUpperCase() || 'QUESTION'}
                    </span>
                    {isReviewUnlocked && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isCorrect ? 'var(--color-emerald)' : 'var(--color-rose)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                      </span>
                    )}
                  </div>

                  {/* Prompt */}
                  <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', lineHeight: 1.5 }}>
                    {q.prompt}
                  </p>

                  {/* Input by format */}
                  {q.format === 'tfng' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                        <button
                          key={opt}
                          disabled={isReviewUnlocked}
                          className={`btn ${currentAns === opt ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            fontSize: 12,
                            padding: '8px 4px',
                            fontWeight: 700,
                            borderColor:
                              isReviewUnlocked && q.correctAnswer === opt ? 'var(--color-emerald)' : undefined
                          }}
                          onClick={() => handleAnswerChange(q._id, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.format === 'mcq' || q.format === 'vocab-context' ? (
                    <div className="stack" style={{ gap: 6 }}>
                      {(q.options || []).map((opt, optIdx) => {
                        const isSelected = currentAns === opt;
                        const isRightAnswer = isReviewUnlocked && q.correctAnswer === opt;
                        return (
                          <button
                            key={optIdx}
                            disabled={isReviewUnlocked}
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                              textAlign: 'left',
                              fontSize: 13,
                              padding: '8px 12px',
                              justifyContent: 'flex-start',
                              background: isRightAnswer
                                ? 'var(--color-emerald-surface)'
                                : undefined,
                              borderColor: isRightAnswer ? 'var(--color-emerald)' : undefined,
                              color: isRightAnswer ? 'var(--color-emerald)' : undefined
                            }}
                            onClick={() => handleAnswerChange(q._id, opt)}
                          >
                            <span style={{ marginRight: 8, opacity: 0.6 }}>•</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // Sentence completion / Cloze
                    <div>
                      <input
                        type="text"
                        disabled={isReviewUnlocked}
                        className="input"
                        placeholder="Nhập 1 từ điền vào chỗ trống..."
                        value={currentAns}
                        onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                        style={{ fontSize: 14 }}
                      />
                    </div>
                  )}

                  {/* Detailed Explanation & Evidence (When review is unlocked) */}
                  {isReviewUnlocked && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border)', fontSize: 13 }}>
                      <div style={{ marginBottom: 4 }}>
                        <strong>Đáp án đúng:</strong>{' '}
                        <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>
                          {q.correctAnswer}
                        </span>
                      </div>
                      {q.evidence?.text ? (
                        <div style={{ marginBottom: 4, color: 'var(--fg-muted)' }}>
                          <strong>Bằng chứng [{q.evidence.paragraphLabel}]:</strong> <em>"{q.evidence.text}"</em>
                        </div>
                      ) : q.correctAnswer === 'NOT GIVEN' ? (
                        <div style={{ marginBottom: 4, color: 'var(--fg-muted)' }}>
                          <strong>Bằng chứng:</strong> <em>Đoạn văn không cung cấp thông tin cho nội dung này.</em>
                        </div>
                      ) : null}
                      <p style={{ margin: '4px 0 0', color: 'var(--fg)' }}>
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
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {errorMsg && (
                <p style={{ color: 'var(--color-rose)', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>
              )}
              <button
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '10px 18px', fontSize: 15, fontWeight: 700 }}
                onClick={handleSubmit}
              >
                {submitting ? 'Đang chấm điểm...' : 'Nộp bài kiểm tra'}
              </button>
            </div>
          )}

          {/* Vocabulary Recap (After Review Unlocked) */}
          {isReviewUnlocked && lesson?.vocabIds && lesson.vocabIds.length > 0 && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 15, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} style={{ color: 'var(--color-emerald)' }} />
                <span>Từ vựng trọng tâm bài đọc ({lesson.vocabIds.length} từ)</span>
              </h4>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '0 0 12px' }}>
                Toàn bộ từ vựng đã được nạp tự động vào Hộp 1 SRS của bạn (Lịch ôn tập: Ngày mai).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {lesson.vocabIds.map((v) => (
                  <div
                    key={v._id}
                    className="row-between"
                    style={{
                      padding: '8px 12px',
                      background: 'var(--surface-subtle)',
                      borderRadius: 6,
                      fontSize: 13
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14 }}>{v.word}</strong>{' '}
                      <span style={{ color: 'var(--fg-muted)', fontStyle: 'italic', fontSize: 12 }}>
                        ({v.pos})
                      </span>
                      <div style={{ fontSize: 12, color: 'var(--fg)' }}>{v.meaningVi}</div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() => playWordAudio(v.media?.url, v.word)}
                      title="Nghe phát âm"
                      style={{ padding: 4 }}
                    >
                      <Volume2 size={16} style={{ color: 'var(--color-cobalt)' }} />
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
