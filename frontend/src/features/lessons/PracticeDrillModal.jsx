import React, { useState, useRef, useEffect, useMemo } from 'react';
import MarkdownView from '../../components/MarkdownView';
import {
  X,
  BookOpen,
  Volume2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function PracticeDrillModal({
  practiceLessonDetail,
  loading,
  onClose,
  quizAnswers,
  onAnswerChange,
  questionResults,
  currentQuizIndex,
  onSelectQuizIndex,
  onCheckSingleQuestion,
  onRetryQuestion,
  onResetQuiz,
  quizFinished,
  onSetQuizFinished,
  isStepperExpanded,
  onToggleStepperExpanded,
  onPlayAudio,
}) {
  const [showTheoryInDrill, setShowTheoryInDrill] = useState(false);
  const currentButtonRef = useRef(null);

  const lesson = practiceLessonDetail?.lesson;
  const allQuestions = practiceLessonDetail?.questions || [];
  const relatedTheory = practiceLessonDetail?.relatedTheoryLesson;

  useEffect(() => {
    if (currentButtonRef.current) {
      currentButtonRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }, [currentQuizIndex]);

  const checkedKeys = Object.keys(questionResults);
  const correctCount = checkedKeys.filter((k) => questionResults[k]?.isCorrect).length;
  const passedPercentage = allQuestions.length > 0 ? Math.round((correctCount / allQuestions.length) * 100) : 0;
  const q = allQuestions[currentQuizIndex];

  const isReorder =
    q?.type === 'reorder' ||
    q?.format === 'reorder' ||
    /sắp xếp|reorder|unscramble/i.test(q?.prompt || '');

  const reorderWords = useMemo(() => {
    if (!isReorder || !q) return [];
    let list = [];
    if (Array.isArray(q.options) && q.options.length > 0) {
      if (q.options.length === 1 && q.options[0].includes('/')) {
        list = q.options[0].split('/').map((w) => w.trim()).filter(Boolean);
      } else {
        list = q.options.map((w) => String(w).trim()).filter(Boolean);
      }
    } else if (q.prompt && q.prompt.includes('/')) {
      const parts = q.prompt.includes(':') ? q.prompt.split(':')[1] : q.prompt;
      const parsed = parts.split('/').map((w) => w.trim()).filter(Boolean);
      if (parsed.length > 1) list = parsed;
    } else if (q.correctAnswer) {
      list = q.correctAnswer.trim().replace(/[.?!;:]+$/, '').split(/\s+/).filter(Boolean);
    }

    if (list.length > 1 && (!q.options || q.options.length <= 1)) {
      const seed = String(q._id || 'seed').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const shuffled = [...list];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (seed * (i + 1) + 7) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return list;
  }, [q, isReorder]);

  const usedWordIndices = useMemo(() => {
    if (!isReorder || reorderWords.length === 0 || !q) return new Set();
    const currentTokens = (quizAnswers[q._id] || '')
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:]+$/, '')
      .split(/\s+/)
      .filter(Boolean);

    const matched = new Set();
    const tokensRemaining = [...currentTokens];

    for (let idx = 0; idx < reorderWords.length; idx++) {
      const wordClean = reorderWords[idx].trim().toLowerCase().replace(/[.,!?;:]+$/, '');
      const foundIdx = tokensRemaining.indexOf(wordClean);
      if (foundIdx !== -1) {
        matched.add(idx);
        tokensRemaining.splice(foundIdx, 1);
      }
    }
    return matched;
  }, [quizAnswers[q?._id], q?._id, reorderWords, isReorder]);

  const handleWordChipClick = (word, idx) => {
    if (questionResults[q._id]?.checked) return;
    if (usedWordIndices.has(idx)) return;
    const current = (quizAnswers[q._id] || '').trim();
    const nextAns = current ? `${current} ${word}` : word;
    onAnswerChange(q._id, nextAns);
  };

  const handleClearAnswer = () => {
    if (questionResults[q._id]?.checked) return;
    onAnswerChange(q._id, '');
  };

  const handleRemoveLastWord = () => {
    if (questionResults[q._id]?.checked) return;
    const current = (quizAnswers[q._id] || '').trim();
    if (!current) return;
    const words = current.split(/\s+/);
    words.pop();
    onAnswerChange(q._id, words.join(' '));
  };

  return (
    <div
      className='fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto'
      role='dialog'
      aria-modal='true'
      aria-label='Practice Drill Workbench'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className='bg-[#fcfbf9] dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl max-w-3xl w-full min-h-[500px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl'>
        {/* Topbar */}
        <div className='flex items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0'>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className='flex items-center gap-2 mb-1 flex-wrap'>
              <span className='inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'>
                BÀI TẬP THỰC CHIẾN · LEVEL {lesson?.level ?? 0} · {lesson?.skill?.toUpperCase()}
              </span>
              <span className='text-xs font-semibold text-stone-500 dark:text-stone-400'>
                {allQuestions.length} câu hỏi
              </span>
            </div>
            <h2 className='text-lg font-semibold text-stone-800 dark:text-stone-100 tracking-tight'>
              {lesson?.title || 'Đang tải bài tập...'}
            </h2>
          </div>

          <div className='flex items-center gap-2'>
            {/* Theory Reference Drawer Toggle */}
            {(relatedTheory?.contentMarkdown || lesson?.contentMarkdown) && (
              <button
                type='button'
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                  showTheoryInDrill
                    ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                }`}
                onClick={() => setShowTheoryInDrill(!showTheoryInDrill)}
              >
                <BookOpen size={13} className='text-amber-600 dark:text-amber-400' />
                <span>{showTheoryInDrill ? 'Đóng lý thuyết' : '📖 Xem lý thuyết'}</span>
              </button>
            )}

            <button
              className='p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors'
              onClick={onClose}
              aria-label='Đóng cửa sổ'
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className='p-12 text-center text-sm text-stone-500'>
            Đang nạp câu hỏi bài tập & dữ liệu chấm điểm...
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto p-6 sm:p-8 max-w-2xl w-full mx-auto space-y-6'>
            {/* Collapsible Theory Drawer */}
            {showTheoryInDrill && (
              <div className='card p-5 border-2 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 max-h-72 overflow-y-auto'>
                <div className='flex items-center justify-between pb-2 mb-3 border-b border-amber-200 dark:border-amber-800'>
                  <span className='text-xs font-bold font-mono text-amber-800 dark:text-amber-300 uppercase tracking-wide'>
                    Lý thuyết nền tảng & Gợi ý làm bài
                  </span>
                  <button type='button' onClick={() => setShowTheoryInDrill(false)} className='text-xs text-stone-400 hover:text-stone-700'>✕</button>
                </div>
                <MarkdownView content={relatedTheory?.contentMarkdown || lesson?.contentMarkdown || 'Đang cập nhật...'} />
              </div>
            )}

            {/* Questions Workbench / Results */}
            {allQuestions.length === 0 ? (
              <div className='card' style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
                  Chưa có câu hỏi bài tập nào cho bài thực hành này.
                </p>
              </div>
            ) : quizFinished ? (
              /* Drill Result Summary */
              <div className='card' style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    margin: '0 auto var(--space-md)',
                    borderRadius: '50%',
                    background: passedPercentage >= 75 ? 'var(--color-moss-soft)' : 'var(--color-brick-soft)',
                    color: passedPercentage >= 75 ? 'var(--color-moss)' : 'var(--color-brick)',
                    display: 'grid',
                    placeItems: 'center',
                  }}>
                  {passedPercentage >= 75 ? <Trophy size={26} /> : <XCircle size={26} />}
                </div>

                <h3 style={{ fontSize: 20, margin: '0 0 6px', fontWeight: 700 }}>
                  {passedPercentage >= 75 ? 'Hoàn thành bài tập xuất sắc!' : 'Chưa đạt chuẩn (Yêu cầu ≥ 75%)'}
                </h3>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    margin: '10px 0',
                    color: passedPercentage >= 75 ? 'var(--color-moss)' : 'var(--color-brick)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                  {correctCount} / {allQuestions.length} câu đúng ({passedPercentage}%)
                </div>

                <p style={{ color: 'var(--color-ink-muted)', fontSize: 14, maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  {passedPercentage >= 75
                    ? 'Chúc mừng! Bạn đã nắm vững cấu trúc bài học và mở khóa chặng tiếp theo trên lộ trình.'
                    : 'Bạn đạt điểm dưới 75%. Hãy xem lại giải thích chi tiết hoặc thử lại để hoàn thiện kiến thức.'}
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => {
                      onSetQuizFinished(false);
                      onSelectQuizIndex(0);
                    }}>
                    <span>Xem lại từng câu</span>
                  </button>
                  <button type='button' className='btn btn-primary' onClick={onResetQuiz}>
                    <RotateCcw size={14} />
                    <span>Làm lại bài tập</span>
                  </button>
                </div>
              </div>
            ) : q ? (
              /* Single Question Card */
              <div className='card' style={{ padding: 'var(--space-xl)' }}>
                {/* Stepper Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--color-rule)', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Câu {currentQuizIndex + 1} / {allQuestions.length}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                      Tiến độ: {Object.keys(questionResults).length}/{allQuestions.length}
                    </span>
                    {Object.keys(questionResults).length > 0 && (
                      <button type='button' onClick={onResetQuiz} className='btn btn-ghost btn-sm' style={{ fontSize: 11 }}>
                        <RotateCcw size={11} />
                        <span>Đặt lại</span>
                      </button>
                    )}
                    {allQuestions.length > 15 && (
                      <button
                        type='button'
                        onClick={onToggleStepperExpanded}
                        className='btn btn-ghost btn-sm'
                        style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                      >
                        <span>{isStepperExpanded ? 'Thu gọn' : `Xem tất cả (${allQuestions.length})`}</span>
                        {isStepperExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Numbered Stepper Buttons */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    alignItems: 'center',
                    maxHeight: isStepperExpanded ? '360px' : allQuestions.length > 20 ? '114px' : 'none',
                    overflowY: allQuestions.length > 20 ? 'auto' : 'visible',
                    padding: '4px 2px',
                    marginBottom: 16,
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
                        onClick={() => onSelectQuizIndex(idx)}
                        style={{
                          minWidth: 28,
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11.5,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          background: bg,
                          border: border,
                          color: color,
                          cursor: 'pointer',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                        title={`Câu ${idx + 1}`}
                      >
                        {qRes?.checked ? (qRes.isCorrect ? '✓' : '✗') : idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Question Prompt */}
                <p style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 16px', lineHeight: 1.5 }}>
                  {q.prompt}
                </p>

                {/* Dictation audio if needed */}
                {q.type === 'dictation' && onPlayAudio && (
                  <div style={{ marginBottom: 14 }}>
                    <button
                      type='button'
                      className='btn btn-secondary btn-sm'
                      onClick={() => onPlayAudio(q.media?.url, q.correctAnswer)}>
                      <Volume2 size={15} />
                      <span>Nghe phát âm</span>
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
                          }}
                          onClick={() => onAnswerChange(q._id, opt)}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Reorder Word Chips */}
                {isReorder && reorderWords.length > 0 && (
                  <div style={{ marginTop: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink-muted)' }}>
                        Bấm các từ bên dưới để ghép thành câu:
                      </span>
                      {(quizAnswers[q._id] || '').trim() && !questionResults[q._id]?.checked && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type='button'
                            onClick={handleRemoveLastWord}
                            className='btn btn-ghost btn-sm'
                            style={{ fontSize: 11, padding: '2px 8px' }}
                            title='Xóa từ vừa bấm'>
                            ← Xóa từ cuối
                          </button>
                          <button
                            type='button'
                            onClick={handleClearAnswer}
                            className='btn btn-ghost btn-sm'
                            style={{ fontSize: 11, padding: '2px 8px', color: 'var(--color-brick)' }}
                            title='Xóa toàn bộ câu'>
                            ↺ Đặt lại câu
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      padding: 12,
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--color-border)'
                    }}>
                      {reorderWords.map((word, wIdx) => {
                        const isUsed = usedWordIndices.has(wIdx);
                        const isChecked = !!questionResults[q._id]?.checked;

                        return (
                          <button
                            key={`${word}-${wIdx}`}
                            type='button'
                            disabled={isChecked || isUsed}
                            onClick={() => handleWordChipClick(word, wIdx)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 13.5,
                              fontWeight: 600,
                              border: isUsed
                                ? '1px dashed var(--color-border)'
                                : '1px solid var(--color-border)',
                              background: isUsed
                                ? 'transparent'
                                : 'var(--color-paper, #ffffff)',
                              color: isUsed
                                ? 'var(--color-ink-muted)'
                                : 'var(--color-ink)',
                              opacity: isUsed ? 0.35 : 1,
                              cursor: isChecked || isUsed ? 'default' : 'pointer',
                              transform: isUsed ? 'scale(0.96)' : 'scale(1)',
                              transition: 'all 0.15s ease',
                              boxShadow: isUsed ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                            }}>
                            {word}
                          </button>
                        );
                      })}
                    </div>
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
                        isReorder
                          ? 'Bấm các từ ở trên hoặc gõ câu trả lời của bạn...'
                          : q.type === 'dictation'
                          ? 'Nhập từ bạn nghe được...'
                          : 'Nhập câu trả lời của bạn...'
                      }
                      value={quizAnswers[q._id] || ''}
                      onChange={(e) => onAnswerChange(q._id, e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          !questionResults[q._id]?.checked &&
                          (quizAnswers[q._id] || '').trim()
                        ) {
                          onCheckSingleQuestion(q);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Feedback Box */}
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
                        ? '✓ Chính xác!'
                        : `✗ Chưa đúng. Đáp án chuẩn: ${questionResults[q._id]?.correctAnswer || q.correctAnswer || ''}`}
                    </div>
                    {q.explanation && (
                      <p style={{ marginTop: 4, color: 'var(--color-ink)', fontSize: 13, lineHeight: 1.5 }}>
                        <strong>Giải thích sư phạm:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Bottom Step Actions */}
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  {questionResults[q._id]?.checked ? (
                    <>
                      <button
                        type='button'
                        className='btn btn-ghost btn-sm'
                        onClick={() => onRetryQuestion(q._id)}>
                        <RotateCcw size={13} />
                        <span>Thử lại câu này</span>
                      </button>

                      {currentQuizIndex < allQuestions.length - 1 ? (
                        <button
                          type='button'
                          className='btn btn-primary btn-sm'
                          onClick={() => onSelectQuizIndex(currentQuizIndex + 1)}>
                          <span>Câu tiếp theo</span>
                          <ArrowRight size={14} />
                        </button>
                      ) : (
                        <button
                          type='button'
                          className='btn btn-primary btn-sm'
                          onClick={() => onSetQuizFinished(true)}>
                          <span>Xem kết quả bài tập</span>
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
                        onClick={() => onCheckSingleQuestion(q)}
                        disabled={!(quizAnswers[q._id] || '').trim()}>
                        <span>Kiểm tra đáp án</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
