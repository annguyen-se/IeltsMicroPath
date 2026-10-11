import React, { useState } from 'react';
import api from '../../api/apiClient';
import { X, Volume2, AlertTriangle, CheckCircle, XCircle, ArrowRight, BookOpen } from 'lucide-react';

export default function MissionRunner({ missionPayload, onFinish, onExit }) {
  const phase1Items = missionPayload?.phase1_srsReview || [];
  const phase2Items = missionPayload?.phase2_mistakeRemediation || [];
  const phase3Questions = missionPayload?.phase3_newLesson?.questions || [];
  const lessonMeta = missionPayload?.phase3_newLesson?.lesson || null;
  const lessonVocabs = missionPayload?.phase3_newLesson?.vocabularies || [];

  // Build list of active phases with their items
  const activePhases = [];
  if (phase1Items.length > 0) activePhases.push({ phaseNumber: 1, type: 'srs', items: phase1Items });
  if (phase2Items.length > 0) activePhases.push({ phaseNumber: 2, type: 'mistake', items: phase2Items });
  if (phase3Questions.length > 0) activePhases.push({ phaseNumber: 3, type: 'lesson', items: phase3Questions });

  const [phaseCursor, setPhaseCursor] = useState(0);
  const [itemCursor, setItemCursor] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [feedbackState, setFeedbackState] = useState(null);
  const [phase3Stage, setPhase3Stage] = useState('study'); // 'study' | 'quiz'

  const [srsResults, setSrsResults] = useState([]);
  const [mistakeResults, setMistakeResults] = useState([]);
  const [lessonAnswers, setLessonAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activePhases.length === 0) {
    return (
      <div className="mission-runner-view">
        <div className="runner-topbar">
          <button className="btn btn-ghost" onClick={onExit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <X size={15} />
            <span>Thoát</span>
          </button>
        </div>
        <div className="runner-body" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div className="runner-card">
            <h2>Nhiệm vụ hôm nay trống</h2>
            <p style={{ color: 'var(--fg-muted)', margin: '14px 0 24px' }}>
              Hiện tại không có mục từ vựng, bẫy lỗi hay bài học nào cần làm.
            </p>
            <button className="btn btn-primary" onClick={onExit}>
              Quay về Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPhase = activePhases[phaseCursor];
  const currentItem = currentPhase?.items[itemCursor];

  const totalItemsCount = activePhases.reduce((acc, p) => acc + p.items.length, 0);
  const completedItemsCount = activePhases.slice(0, phaseCursor).reduce((acc, p) => acc + p.items.length, 0) + itemCursor;

  const playAudio = (url) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const checkAnswer = () => {
    if (feedbackState) return;

    let isCorrect = false;
    let correctAnswer = '';
    let explanation = '';

    if (currentPhase.type === 'srs') {
      const vocab = currentItem.vocab || {};
      correctAnswer = vocab.word || '';
      isCorrect = (userAnswer || '').trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      explanation = vocab.meaningVi ? `Nghĩa tiếng Việt: ${vocab.meaningVi}` : '';
      setSrsResults((prev) => [
        ...prev,
        { srsId: currentItem.srsId, isCorrect, vocabId: vocab._id }
      ]);
    } else if (currentPhase.type === 'mistake') {
      const q = currentItem.question || {};
      correctAnswer = q.correctAnswer || '';
      const ans = q.type === 'choice' ? selectedOption : userAnswer;
      isCorrect = (ans || '').trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      explanation = q.explanation || '';
      setMistakeResults((prev) => [
        ...prev,
        { mistakeId: currentItem.mistakeId, isCorrect }
      ]);
    } else {
      // Lesson question
      correctAnswer = currentItem.correctAnswer || '';
      const ans = currentItem.type === 'choice' ? selectedOption : userAnswer;
      isCorrect = (ans || '').trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      explanation = currentItem.explanation || '';
      setLessonAnswers((prev) => [
        ...prev,
        { questionId: currentItem.id || currentItem._id, userAnswer: ans, isCorrect }
      ]);
    }

    setFeedbackState({ isCorrect, correctAnswer, explanation });
  };

  const nextQuestion = async () => {
    setFeedbackState(null);
    setUserAnswer('');
    setSelectedOption('');

    // Check if more items in current phase
    if (itemCursor + 1 < currentPhase.items.length) {
      setItemCursor(itemCursor + 1);
      return;
    }

    // Check if more phases
    if (phaseCursor + 1 < activePhases.length) {
      setPhaseCursor(phaseCursor + 1);
      setItemCursor(0);
      return;
    }

    // Finished all items! Submit session to backend
    setIsSubmitting(true);
    try {
      const payload = {
        sessionId: missionPayload?.sessionId || `sess_${Date.now()}`,
        srsResults,
        mistakeResults,
        lessonResults: lessonMeta ? {
          lessonId: lessonMeta.id || lessonMeta._id,
          answers: lessonAnswers
        } : undefined
      };

      const result = await api.post('/learning/submit-session', payload);
      const totalAnswersCount = srsResults.length + mistakeResults.length + lessonAnswers.length;
      const correctAnswersCount =
        srsResults.filter((r) => r.isCorrect).length +
        mistakeResults.filter((r) => r.isCorrect).length +
        lessonAnswers.filter((r) => r.isCorrect).length;
      const localScore = totalAnswersCount > 0 ? Math.round((correctAnswersCount / totalAnswersCount) * 100) : 0;

      onFinish({
        streak: result?.streak ?? 0,
        reviewedCount: srsResults.length,
        scorePercent: result?.scorePercentage ?? localScore
      });
    } catch (err) {
      console.warn('[Submit Session Warning]:', err.message);
      const totalAnswersCount = srsResults.length + mistakeResults.length + lessonAnswers.length;
      const correctAnswersCount =
        srsResults.filter((r) => r.isCorrect).length +
        mistakeResults.filter((r) => r.isCorrect).length +
        lessonAnswers.filter((r) => r.isCorrect).length;
      const localScore = totalAnswersCount > 0 ? Math.round((correctAnswersCount / totalAnswersCount) * 100) : 0;

      onFinish({
        streak: 0,
        reviewedCount: srsResults.length,
        scorePercent: localScore
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mission-runner-view">
      <div className="runner-topbar">
        <button className="btn btn-ghost" onClick={onExit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <X size={15} />
          <span>Thoát</span>
        </button>
        <div className="runner-progress-track">
          <div
            className="runner-progress-fill"
            style={{ width: `${(completedItemsCount / totalItemsCount) * 100}%` }}
          ></div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
          Giai đoạn {currentPhase.phaseNumber} / 3 · Câu {completedItemsCount + 1}/{totalItemsCount}
        </span>
      </div>

      <div className="runner-body">
        {/* Phase 1: SRS */}
        {currentPhase.type === 'srs' && currentItem && (
          <div>
            <span className="runner-phase-title">PHASE 1: GỢI NHỚ TỪ VỰNG ÔN TẬP (SPACED RETRIEVAL)</span>
            <div className="runner-card">
              <div className="row-between">
                <div>
                  <h2 style={{ fontSize: 26, margin: 0 }}>{currentItem.vocab?.word}</h2>
                  <span className="ipa">
                    {currentItem.vocab?.ipa} · {currentItem.vocab?.pos}
                  </span>
                </div>
                {currentItem.vocab?.media?.url && (
                  <button className="btn btn-secondary" onClick={() => playAudio(currentItem.vocab.media.url)}>
                    <Volume2 size={16} />
                    <span>Nghe phát âm</span>
                  </button>
                )}
              </div>
              {currentItem.vocab?.meaningVi && (
                <p style={{ marginTop: 12, color: 'var(--fg-muted)', fontSize: 14 }}>
                  Nghĩa tiếng Việt: {currentItem.vocab.meaningVi}
                </p>
              )}
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
                  {currentItem.vocab?.exampleSentence ? (
                    <>
                      Điền từ vào chỗ trống: "{currentItem.vocab.exampleSentence.replace(new RegExp(currentItem.vocab.word, 'gi'), '________')}"
                    </>
                  ) : (
                    'Gõ lại từ vựng để ôn tập:'
                  )}
                </p>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Nhập từ cần điền..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (!feedbackState ? checkAnswer() : nextQuestion())}
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Mistake Remediation */}
        {currentPhase.type === 'mistake' && currentItem && (
          <div>
            <span className="runner-phase-title" style={{ color: 'var(--color-rose)' }}>
              PHASE 2: KHẮC PHỤC LỖI SAI TRONG QUÁ KHỨ (MISTAKE VAULT)
            </span>
            <div className="runner-card">
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="phase-badge phase-2" style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} />
                  <span>[{currentItem.errorCode || currentItem.question?.errorTaxonomy || 'ERR'}] Lỗi cần sửa</span>
                </span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 600 }}>
                {currentItem.question?.prompt}
              </p>
              {currentItem.previousWrongAnswer && (
                <p style={{ fontSize: 13, color: 'var(--color-rose)', margin: '8px 0 16px' }}>
                  Lần trước bạn đã làm sai: "{currentItem.previousWrongAnswer}"
                </p>
              )}

              {currentItem.question?.type === 'choice' && currentItem.question?.options ? (
                <div className="option-grid">
                  {currentItem.question.options.map((opt) => (
                    <button
                      key={opt}
                      className={`option-btn ${selectedOption === opt ? 'selected' : ''}`}
                      onClick={() => setSelectedOption(opt)}
                    >
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  className="input-text"
                  placeholder="Gõ từ đã từng làm sai..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (!feedbackState ? checkAnswer() : nextQuestion())}
                  autoFocus
                />
              )}
            </div>
          </div>
        )}

        {/* Phase 3: Micro-Lesson (Theory & Vocabulary FIRST, Quiz SECOND) */}
        {currentPhase.type === 'lesson' && currentItem && (
          <div>
            {phase3Stage === 'study' ? (
              <div className="stack" style={{ gap: 20 }}>
                <div>
                  <span className="runner-phase-title" style={{ color: 'var(--color-violet)' }}>
                    PHASE 3: BÀI HỌC VI MÔ MỚI {lessonMeta?.title ? `(${lessonMeta.title.toUpperCase()})` : ''}
                  </span>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
                    Nắm vững lý thuyết và phát âm từ vựng mới trước khi chuyển sang làm bài tập đánh giá.
                  </p>
                </div>

                {/* Section A: Lesson Vocabularies */}
                {lessonVocabs && lessonVocabs.length > 0 && (
                  <div className="card" style={{ borderLeft: '4px solid var(--color-cobalt)' }}>
                    <h3 style={{ fontSize: 17, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Volume2 size={18} style={{ color: 'var(--color-cobalt)' }} />
                      <span>Từ vựng cốt lõi của bài ({lessonVocabs.length} từ)</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                      {lessonVocabs.map((v) => (
                        <div
                          key={v._id || v.word}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--surface-subtle)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <div className="row-between">
                            <span style={{ fontSize: 17, fontWeight: 700 }}>{v.word}</span>
                            {v.media?.url && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                onClick={() => playAudio(v.media.url)}
                              >
                                <Volume2 size={12} />
                                <span>Nghe</span>
                              </button>
                            )}
                          </div>
                          <div className="ipa" style={{ color: 'var(--color-cobalt)', fontSize: 13, margin: '2px 0 6px' }}>
                            {v.ipa} · {v.pos}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{v.meaningVi}</p>
                          {v.exampleSentence && (
                            <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>Ví dụ: "{v.exampleSentence}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B: Lesson Theory */}
                {lessonMeta?.contentMarkdown && (
                  <div
                    className="card"
                    style={{
                      background: 'var(--surface-subtle)',
                      whiteSpace: 'pre-line',
                      fontSize: 14,
                      lineHeight: 1.7,
                      borderLeft: '4px solid var(--color-violet)'
                    }}
                  >
                    <h3 style={{ fontSize: 17, marginBottom: 12, color: 'var(--color-violet)' }}>
                      Lý thuyết & Hướng dẫn thi
                    </h3>
                    {lessonMeta.contentMarkdown}
                  </div>
                )}

                {/* Transition to Practice Quiz */}
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => setPhase3Stage('quiz')}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 8
                  }}
                >
                  <span>Tôi đã hiểu bài & nhớ từ vựng · Bắt đầu làm bài tập</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div>
                <div className="row-between" style={{ marginBottom: 12 }}>
                  <span className="runner-phase-title" style={{ color: 'var(--color-violet)', margin: 0 }}>
                    THỰC HÀNH: {lessonMeta?.title?.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPhase3Stage('study')}
                    style={{ fontSize: 12, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <BookOpen size={13} />
                    <span>Xem lại lý thuyết & từ vựng</span>
                  </button>
                </div>

                <div className="runner-card">
                  <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
                    {currentItem.prompt}
                  </p>

                  {currentItem.type === 'choice' && currentItem.options ? (
                    <div className="option-grid">
                      {currentItem.options.map((opt) => (
                        <button
                          key={opt}
                          className={`option-btn ${selectedOption === opt ? 'selected' : ''}`}
                          onClick={() => setSelectedOption(opt)}
                        >
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="input-text"
                      placeholder="Nhập câu trả lời..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (!feedbackState ? checkAnswer() : nextQuestion())}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback Banner */}
        {feedbackState && (
          <div className={`feedback-banner ${feedbackState.isCorrect ? 'success' : 'danger'}`}>
            <div className="feedback-header">
              {feedbackState.isCorrect ? (
                <>
                  <CheckCircle size={18} />
                  <span>CHÍNH XÁC! XUẤT SẮC</span>
                </>
              ) : (
                <>
                  <XCircle size={18} />
                  <span>CHƯA CHÍNH XÁC</span>
                </>
              )}
            </div>
            {!feedbackState.isCorrect && feedbackState.correctAnswer && (
              <p style={{ fontWeight: 700, margin: '4px 0' }}>Đáp án đúng: {feedbackState.correctAnswer}</p>
            )}
            {feedbackState.explanation && (
              <p className="feedback-reason">{feedbackState.explanation}</p>
            )}
            <button className="btn btn-primary" onClick={nextQuestion} disabled={isSubmitting}>
              <span>{isSubmitting ? 'Đang gửi...' : 'Tiếp tục (Enter)'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {!feedbackState && !(currentPhase.type === 'lesson' && phase3Stage === 'study') && (
          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button className="btn btn-primary btn-lg" onClick={checkAnswer}>
              Kiểm tra đáp án
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
