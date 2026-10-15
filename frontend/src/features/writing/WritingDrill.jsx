import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import {
  PenLine,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Check,
  Bot,
  BookCheck,
  Lightbulb,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const GRAMMAR_GROUPS = [
  'Tất cả cấu trúc (100 câu)',
  'Cấu trúc S + V + O đơn giản',
  'Cấu trúc S + V + O + Bổ ngữ (Object Complement)',
  'Cấu trúc S + V + Tân ngữ gián tiếp + Tân ngữ trực tiếp (IO + DO)',
  'Câu bị động học thuật (Academic Passive Voice)',
  'Cấu trúc S + Nội động từ (Intransitive Verbs)',
  'Cấu trúc S + Hệ từ/Liên động từ + Bổ ngữ (Linking Verbs)',
  'Cấu trúc Chủ ngữ / Tân ngữ giả với "It"',
  'Cấu trúc tồn tại "There be"',
  'Câu ghép đẳng lập (Compound Sentences)',
  'Mệnh đề trạng ngữ (Adverbial Clauses)',
  'Mệnh đề danh từ (Noun Clauses)',
  'Mệnh đề quan hệ (Relative Clauses)'
];

export default function WritingDrill({ isAuthenticated = false, onOpenAuth }) {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('Tất cả cấu trúc (100 câu)');
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
      // Tìm bài học writing-100
      const lessonsRes = await api.get('/lessons?skill=writing');
      const writingLesson = (lessonsRes?.lessons || []).find(
        (l) => l.topic === 'writing-100' || l.title?.includes('100 Câu')
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
  const filteredQuestions = questions.filter((q) => {
    if (selectedGroup === 'Tất cả cấu trúc (100 câu)') return true;
    return q.metadata?.groupTitleVi === selectedGroup;
  });

  const currentQ = filteredQuestions[currentIndex] || null;

  // Reset state when current question or mode changes
  useEffect(() => {
    setUserSentence('');
    setCheckResult(null);

    if (currentQ?.options && Array.isArray(currentQ.options)) {
      // Shuffle options for reorder mode
      const shuffled = [...currentQ.options].sort(() => Math.random() - 0.5);
      setAvailableChunks(shuffled);
      setSelectedChunks([]);
    } else {
      setAvailableChunks([]);
      setSelectedChunks([]);
    }
  }, [currentIndex, selectedGroup, practiceMode]);

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
    <div className="container" style={{ maxWidth: 940, paddingTop: 16, paddingBottom: 40 }}>
      {/* ─── Top Control Bar ─── */}
      <div className="row-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 style={{ fontSize: 22, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PenLine size={24} style={{ color: 'var(--color-violet)' }} />
              <span>100 Câu luyện dịch chuẩn IELTS Writing</span>
            </h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: 13, margin: '2px 0 0' }}>
              Xây dựng phản xạ viết câu không lỗi (Error-free) theo 12 cấu trúc ngữ pháp học thuật cốt lõi.
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-subtle)', padding: 4, borderRadius: 'var(--radius)' }}>
          <button
            className={`btn ${practiceMode === 'type' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={() => setPracticeMode('type')}
          >
            Gõ dịch tự do
          </button>
          <button
            className={`btn ${practiceMode === 'reorder' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={() => setPracticeMode('reorder')}
          >
            Xếp cụm từ (Reorder)
          </button>
        </div>
      </div>

      {/* ─── Grammar Group Selector ─── */}
      <div className="card" style={{ padding: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', whiteSpace: 'nowrap' }}>
            Chủ điểm ngữ pháp:
          </span>
          <select
            className="input"
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setCurrentIndex(0);
            }}
            style={{ flex: 1, minWidth: 260, fontSize: 13, padding: '6px 12px' }}
          >
            {GRAMMAR_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Question Workspace ─── */}
      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Đang nạp 100 câu luyện dịch...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>
            Chưa có câu hỏi nào trong chủ điểm này. Vui lòng chạy lệnh <code>npm run seed:writing100</code> tại thư mục backend.
          </p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 20 }}>
          <div className="card" style={{ padding: 28 }}>
            {/* Header: Question Meta & Navigation */}
            <div className="row-between" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    background: 'var(--color-violet-surface)',
                    color: 'var(--color-violet)',
                    border: '1px solid var(--color-violet-border)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  CÂU {currentQ?.metadata?.no || currentIndex + 1} / {filteredQuestions.length}
                </span>
                <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                  {currentQ?.metadata?.groupTitleVi}
                </span>
              </div>

              {/* Prev / Next controls */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-secondary"
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  style={{ padding: '6px 10px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  onClick={handleNext}
                  style={{ padding: '6px 10px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Vietnamese Prompt */}
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Đề bài tiếng Việt:
              </span>
              <p style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 0', lineHeight: 1.5, color: 'var(--fg)' }}>
                "{currentQ?.metadata?.promptVi || currentQ?.prompt}"
              </p>
            </div>

            {/* Input Area Based on Practice Mode */}
            {practiceMode === 'type' ? (
              /* Type Mode */
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--fg-muted)' }}>
                  Nhập câu dịch tiếng Anh của bạn:
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Type your English translation here..."
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
                    fontSize: 16,
                    padding: 12,
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>
            ) : (
              /* Reorder Chunks Mode */
              <div style={{ marginBottom: 20 }}>
                {/* Selected Chunks Area */}
                <div
                  style={{
                    minHeight: 64,
                    padding: 12,
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-subtle)',
                    border: '1px dashed var(--border-strong)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 16
                  }}
                >
                  {selectedChunks.length === 0 ? (
                    <span style={{ color: 'var(--fg-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      Bấm vào các khối từ bên dưới theo đúng thứ tự để ghép thành câu hoàn chỉnh...
                    </span>
                  ) : (
                    selectedChunks.map((chunk, idx) => (
                      <button
                        key={idx}
                        className="btn btn-secondary"
                        onClick={() => handleDeselectChunk(chunk, idx)}
                        style={{
                          background: 'var(--color-cobalt-surface)',
                          borderColor: 'var(--color-cobalt-border)',
                          color: 'var(--color-cobalt)',
                          fontWeight: 600,
                          fontSize: 14,
                          padding: '6px 12px'
                        }}
                      >
                        {chunk}
                      </button>
                    ))
                  )}
                </div>

                {/* Available Chunks Pool */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {availableChunks.map((chunk, idx) => (
                    <button
                      key={idx}
                      className="btn btn-secondary"
                      onClick={() => handleSelectChunk(chunk, idx)}
                      style={{ fontSize: 14, padding: '6px 12px' }}
                    >
                      {chunk}
                    </button>
                  ))}
                  {selectedChunks.length > 0 && (
                    <button
                      className="btn btn-ghost"
                      onClick={handleResetReorder}
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <RotateCcw size={14} />
                      <span>Xếp lại</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handleCheckAnswer}
                disabled={!userSentence.trim() || isChecking}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra bản dịch'}
                <Sparkles size={16} />
              </button>
            </div>
          </div>

          {/* ─── Bilingual Multi-Angle Feedback Card ─── */}
          {checkResult && (
            <div
              className="card"
              style={{
                padding: 24,
                border: `2px solid ${
                  checkResult.isExact
                    ? 'var(--color-emerald)'
                    : checkResult.isAccepted
                    ? 'var(--color-cobalt)'
                    : 'var(--color-amber)'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                {checkResult.isExact ? (
                  <CheckCircle2 size={24} style={{ color: 'var(--color-emerald)' }} />
                ) : (
                  <Sparkles size={24} style={{ color: 'var(--color-cobalt)' }} />
                )}
                <div>
                  <h3 style={{ fontSize: 17, margin: 0 }}>
                    {checkResult.isExact
                      ? 'Chính xác 100% so với sách mẫu!'
                      : `Bản dịch hợp lý (Độ tương đồng từ vựng: ${checkResult.similarityScore}%)`}
                  </h3>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 13, margin: '2px 0 0' }}>
                    Đối chiếu bản dịch học thuật chuẩn và bản dịch AI bên dưới:
                  </p>
                </div>
              </div>

              {/* Translation Comparisons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 16 }}>
                {/* 1. Academic Book Translation */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-cobalt)', marginBottom: 6 }}>
                    <BookCheck size={16} />
                    <span>BẢN DỊCH CHUẨN (ACADEMIC BOOK)</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)', margin: 0, lineHeight: 1.5 }}>
                    {checkResult.standardAnswer}
                  </p>
                </div>

                {/* 2. ChatGPT Natural Translation */}
                {checkResult.aiReferenceAnswer && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-emerald)', marginBottom: 6 }}>
                      <Bot size={16} />
                      <span>BẢN DỊCH THAM KHẢO (AI CHATGPT)</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)', margin: 0, lineHeight: 1.5 }}>
                      {checkResult.aiReferenceAnswer}
                    </p>
                  </div>
                )}
              </div>

              {/* Grammar Remark if present */}
              {checkResult.remark && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-amber-surface)',
                    color: 'var(--color-amber)',
                    border: '1px solid var(--color-amber-border)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 16
                  }}
                >
                  <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Ghi chú ngữ pháp & cụm từ:</strong> {checkResult.remark}
                  </div>
                </div>
              )}

              {/* Next Question Navigation */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Chuyển sang câu tiếp theo</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
