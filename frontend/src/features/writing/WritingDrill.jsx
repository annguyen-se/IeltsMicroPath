/* Hallmark · macrostructure: Workbench · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Workbench · design-system: design.md · designed-as-app */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import {
  PenLine,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookCheck,
  Bot,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  LayoutGrid,
  AlertTriangle
} from 'lucide-react';

const GRAMMAR_GROUPS = [
  { key: 'all', labelEn: 'All Sentence Patterns (100 Sentences)', matchVi: 'Tất cả cấu trúc (100 câu)' },
  { key: 'svo', labelEn: 'Simple S + V + O Patterns', matchVi: 'Cấu trúc S + V + O đơn giản' },
  { key: 'svoc', labelEn: 'S + V + O + Object Complement', matchVi: 'Cấu trúc S + V + O + Bổ ngữ (Object Complement)' },
  { key: 'svio', labelEn: 'Direct & Indirect Objects (IO + DO)', matchVi: 'Cấu trúc S + V + Tân ngữ gián tiếp + Tân ngữ trực tiếp (IO + DO)' },
  { key: 'passive', labelEn: 'Academic Passive Voice', matchVi: 'Câu bị động học thuật (Academic Passive Voice)' },
  { key: 'intransitive', labelEn: 'Intransitive Verbs (S + V)', matchVi: 'Cấu trúc S + Nội động từ (Intransitive Verbs)' },
  { key: 'linking', labelEn: 'Linking Verbs & Subject Complements', matchVi: 'Cấu trúc S + Hệ từ/Liên động từ + Bổ ngữ (Linking Verbs)' },
  { key: 'dummy-it', labelEn: 'Dummy Subjects & Objects with "It"', matchVi: 'Cấu trúc Chủ ngữ / Tân ngữ giả với "It"' },
  { key: 'there-be', labelEn: 'Existential "There be" Structures', matchVi: 'Cấu trúc tồn tại "There be"' },
  { key: 'compound', labelEn: 'Compound Sentences', matchVi: 'Câu ghép đẳng lập (Compound Sentences)' },
  { key: 'adverbial', labelEn: 'Adverbial Clauses (Reason, Concession, Time)', matchVi: 'Mệnh đề trạng ngữ (Adverbial Clauses)' },
  { key: 'noun-clause', labelEn: 'Noun Clauses (Wh- / That clauses)', matchVi: 'Mệnh đề danh từ (Noun Clauses)' },
  { key: 'relative', labelEn: 'Relative Clauses (Defining & Non-defining)', matchVi: 'Mệnh đề quan hệ (Relative Clauses)' }
];

export default function WritingDrill(props) {
  const isAuthenticated = props?.isAuthenticated || false;
  const onOpenAuth = props?.onOpenAuth;
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupKey, setSelectedGroupKey] = useState('all');
  const [practiceMode, setPracticeMode] = useState('type'); // 'type' | 'reorder'

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSentence, setUserSentence] = useState('');
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [availableChunks, setAvailableChunks] = useState([]);
  const [checkResult, setCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // 1. Fetch Writing Lesson and Questions
  useEffect(() => {
    fetchWritingQuestions();
  }, []);

  const fetchWritingQuestions = async () => {
    setLoading(true);
    try {
      const lessonsRes = await api.get('/lessons?skill=writing');
      const writingLesson = (lessonsRes?.lessons || []).find(
        (l) => l.topic === 'writing-100' || l.title?.includes('100 Câu') || l.title?.includes('100 Sentences')
      );

      if (writingLesson) {
        const detailRes = await api.get(`/lessons/${writingLesson._id}`);
        const qs = detailRes?.questions || [];
        setQuestions(qs);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.warn('[Fetch Writing Questions Warning]:', err.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter questions by grammar group
  const activeGroup = GRAMMAR_GROUPS.find((g) => g.key === selectedGroupKey) || GRAMMAR_GROUPS[0];
  const filteredQuestions = questions.filter((q) => {
    if (activeGroup.key === 'all') return true;
    return q.metadata?.groupTitleVi === activeGroup.matchVi || q.metadata?.groupTitleEn === activeGroup.labelEn;
  });

  const currentQ = filteredQuestions[currentIndex] || null;

  // Reset state when current question or mode changes
  useEffect(() => {
    setUserSentence('');
    setCheckResult(null);

    if (currentQ?.options && Array.isArray(currentQ.options)) {
      const shuffled = [...currentQ.options].sort(() => Math.random() - 0.5);
      setAvailableChunks(shuffled);
      setSelectedChunks([]);
    } else {
      setAvailableChunks([]);
      setSelectedChunks([]);
    }
  }, [currentIndex, selectedGroupKey, practiceMode]);

  // Handle reorder chunk selection
  const handleSelectChunk = (chunk, idx) => {
    const nextAvailable = [...availableChunks];
    nextAvailable.splice(idx, 1);
    setAvailableChunks(nextAvailable);

    const nextSelected = [...selectedChunks, chunk];
    setSelectedChunks(nextSelected);
    setUserSentence(nextSelected.join(' '));
  };

  const handleDeselectChunk = (chunk, idx) => {
    const nextSelected = [...selectedChunks];
    nextSelected.splice(idx, 1);
    setSelectedChunks(nextSelected);

    setAvailableChunks([...availableChunks, chunk]);
    setUserSentence(nextSelected.join(' '));
  };

  const handleResetReorder = () => {
    if (currentQ?.options) {
      setAvailableChunks([...currentQ.options].sort(() => Math.random() - 0.5));
      setSelectedChunks([]);
      setUserSentence('');
      setCheckResult(null);
    }
  };

  // Check sentence translation via API
  const handleCheckAnswer = async () => {
    if (!currentQ || !userSentence.trim()) return;

    if (!isAuthenticated && onOpenAuth) {
      onOpenAuth();
      return;
    }

    setIsChecking(true);
    try {
      const res = await api.post('/learning/writing-check', {
        questionId: currentQ._id,
        userSentence
      });
      setCheckResult(res);
    } catch (err) {
      // Fallback local comparison
      const cleanUser = userSentence.trim().toLowerCase().replace(/[^\w\s]/g, '');
      const cleanTarget = (currentQ.correctAnswer || '').trim().toLowerCase().replace(/[^\w\s]/g, '');
      const isExact = cleanUser === cleanTarget;

      setCheckResult({
        isExact,
        isAccepted: isExact,
        similarityScore: isExact ? 100 : 60,
        standardAnswer: currentQ.correctAnswer,
        aiReferenceAnswer: currentQ.metadata?.aiReferenceAnswer || '',
        remark: currentQ.metadata?.remark || ''
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* ─── Top Workbench Header & Controls ─── */}
      <section className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-head-row" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              aria-label="Return to Workspace">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Workspace</span>
            </button>
            <div>
              <span className="section-kicker">
                <PenLine size={13} aria-hidden="true" /> Guided Sentence Construction
              </span>
              <h1 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>
                IELTS Academic Writing Clinic
              </h1>
            </div>
          </div>

          {/* Mode Switcher: Free Translation vs Chunk Reorder */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--color-paper-2)',
              padding: 3,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-rule)'
            }}
            role="group"
            aria-label="Practice Mode Switcher">
            <button
              className={`btn btn-sm ${practiceMode === 'type' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPracticeMode('type')}>
              <FileEdit size={13} aria-hidden="true" />
              <span>Free Translation</span>
            </button>
            <button
              className={`btn btn-sm ${practiceMode === 'reorder' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPracticeMode('reorder')}>
              <LayoutGrid size={13} aria-hidden="true" />
              <span>Chunk Reorder</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Grammar Focus Track Filter ─── */}
      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <label htmlFor="grammar-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
            Grammar Pattern:
          </label>
          <select
            id="grammar-select"
            className="input-select"
            value={selectedGroupKey}
            onChange={(e) => {
              setSelectedGroupKey(e.target.value);
              setCurrentIndex(0);
            }}
            style={{ flex: 1, minWidth: 280, fontSize: 13.5 }}>
            {GRAMMAR_GROUPS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Main Question Workbench ─── */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>Loading academic writing questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
            No questions available under this grammar pattern. Please verify database seeding.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Active Question Desk */}
          <div className="card-desk">
            {/* Header: Status Counter & Stepper Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <span className="syllabus-badge" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  SENTENCE {currentQ?.metadata?.no || currentIndex + 1} OF {filteredQuestions.length}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  {activeGroup.labelEn}
                </span>
              </div>

              {/* Prev / Next Steppers */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  title="Previous sentence">
                  <ChevronLeft size={15} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  onClick={handleNext}
                  title="Next sentence">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Vietnamese Prompt (Preserved in Vietnamese per language policy) */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="section-kicker" style={{ color: 'var(--color-ink-muted)', fontSize: 11 }}>
                Source sentence (Tiếng Việt):
              </span>
              <p
                style={{
                  fontSize: 'clamp(1.15rem, 2.2vw, 1.35rem)',
                  fontWeight: 600,
                  lineHeight: 1.45,
                  color: 'var(--color-ink)',
                  marginTop: 4
                }}>
                "{currentQ?.metadata?.promptVi || currentQ?.prompt}"
              </p>
            </div>

            {/* Input Workspace */}
            {practiceMode === 'type' ? (
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label
                  htmlFor="user-translation-input"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--color-ink)'
                  }}>
                  Your Academic English Translation:
                </label>
                <textarea
                  id="user-translation-input"
                  className="input-text"
                  rows={3}
                  placeholder="Draft your English translation here... (Press Enter to evaluate)"
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCheckAnswer();
                    }
                  }}
                  style={{
                    width: '100%',
                    fontSize: 15,
                    padding: 'var(--space-sm)',
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-body)',
                    resize: 'vertical'
                  }}
                />
              </div>
            ) : (
              /* Chunk Reorder Mode */
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>
                  Assemble sentence chunks in grammatical sequence:
                </div>
                {/* Assembly Tray */}
                <div
                  style={{
                    minHeight: 56,
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-paper-2)',
                    border: '1px dashed var(--color-border-strong)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)'
                  }}>
                  {selectedChunks.length === 0 ? (
                    <span style={{ color: 'var(--color-ink-muted)', fontSize: 13 }}>
                      Click on the word blocks below in order to build your sentence...
                    </span>
                  ) : (
                    selectedChunks.map((chunk, idx) => (
                      <button
                        key={idx}
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDeselectChunk(chunk, idx)}
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-accent)',
                          color: 'var(--color-ink)',
                          fontWeight: 600
                        }}>
                        {chunk}
                      </button>
                    ))
                  )}
                </div>

                {/* Chunks Pool */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {availableChunks.map((chunk, idx) => (
                    <button
                      key={idx}
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSelectChunk(chunk, idx)}>
                      {chunk}
                    </button>
                  ))}
                  {selectedChunks.length > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handleResetReorder}
                      style={{ fontSize: 12, marginLeft: 'auto' }}>
                      <RotateCcw size={13} aria-hidden="true" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                {practiceMode === 'type' ? 'Tip: Use formal register and academic collocations.' : 'Tip: Pay attention to clause boundaries.'}
              </span>
              <button
                className="btn btn-primary"
                onClick={handleCheckAnswer}
                disabled={!userSentence.trim() || isChecking}>
                <Sparkles size={14} aria-hidden="true" />
                <span>{isChecking ? 'Evaluating syntax...' : 'Evaluate Translation'}</span>
              </button>
            </div>
          </div>

          {/* ─── Coach Feedback Panel (Comparative Academic Diagnosis) ─── */}
          {checkResult && (
            <div
              className="card"
              style={{
                border: `1.5px solid ${
                  checkResult.isExact
                    ? 'var(--color-moss)'
                    : checkResult.isAccepted
                    ? 'var(--color-accent)'
                    : 'var(--color-brick)'
                }`,
                background: 'var(--color-surface)'
              }}>
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                {checkResult.isExact ? (
                  <CheckCircle2 size={22} style={{ color: 'var(--color-moss)', flexShrink: 0 }} aria-hidden="true" />
                ) : checkResult.isAccepted ? (
                  <Sparkles size={22} style={{ color: 'var(--color-accent)', flexShrink: 0 }} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={22} style={{ color: 'var(--color-brick)', flexShrink: 0 }} aria-hidden="true" />
                )}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {checkResult.isExact
                      ? 'Accurate match with academic standard (100%)'
                      : checkResult.isAccepted
                      ? `Acceptable academic variation (${checkResult.similarityScore}% lexical similarity)`
                      : `Revision recommended (${checkResult.similarityScore}% lexical similarity)`}
                  </h3>
                  <p style={{ color: 'var(--color-ink-muted)', fontSize: 13, marginTop: 2 }}>
                    Compare your submission against the verified standard and native AI alternative:
                  </p>
                </div>
              </div>

              {/* Comparative Translation Models */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-md)'
                }}>
                {/* Academic Standard Model */}
                <div
                  style={{
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)'
                  }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 6
                    }}>
                    <BookCheck size={14} aria-hidden="true" />
                    <span>Academic Standard Model</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
                    {checkResult.standardAnswer}
                  </p>
                </div>

                {/* AI Band 8.0+ Alternative */}
                {checkResult.aiReferenceAnswer && (
                  <div
                    style={{
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-paper-2)',
                      border: '1px solid var(--color-rule)'
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-moss)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: 6
                      }}>
                      <Bot size={14} aria-hidden="true" />
                      <span>Band 8.0+ Native Alternative</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
                      {checkResult.aiReferenceAnswer}
                    </p>
                  </div>
                )}
              </div>

              {/* Pedagogical Vietnamese Coach Note (Preserved per language policy for L1 contrast & common traps) */}
              {(checkResult.remark || checkResult.explanation) && (
                <div
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-amber-soft)',
                    border: '1px solid var(--color-rule)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-xs)',
                    marginBottom: 'var(--space-md)'
                  }}>
                  <Lightbulb size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <div style={{ color: 'var(--color-ink)', lineHeight: 1.55 }}>
                    <strong>Writing Coach Note:</strong>{' '}
                    <span>{checkResult.remark || checkResult.explanation}</span>
                  </div>
                </div>
              )}

              {/* Navigation Action to Next Sentence */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-xs)' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Proceed to Next Sentence</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
