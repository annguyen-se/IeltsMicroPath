import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import {
  ArrowLeft,
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
  Sparkles
} from 'lucide-react';

const SKILLS = [
  { key: 'all', label: 'Tất cả', icon: Sparkles },
  { key: 'listening', label: 'Listening', icon: Headphones },
  { key: 'reading', label: 'Reading', icon: BookOpen },
  { key: 'speaking', label: 'Speaking', icon: Mic },
  { key: 'writing', label: 'Writing', icon: PenLine },
  { key: 'grammar', label: 'Grammar', icon: FileText },
  { key: 'phonetics', label: 'Pronunciation', icon: AudioLines }
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
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Vocab enrollment state
  const [enrolledVocabs, setEnrolledVocabs] = useState(new Set());
  const [enrollNotice, setEnrollNotice] = useState('');

  const handleEnrollSingleVocab = async (vocabId) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      await api.post('/reviews/enroll', { vocabId });
      setEnrolledVocabs(prev => new Set([...prev, vocabId]));
      setEnrollNotice('Đã thêm từ vào Hộp 1 SRS!');
      setTimeout(() => setEnrollNotice(''), 2500);
    } catch (err) {
      setEnrollNotice(`Lỗi: ${err.message}`);
    }
  };

  const handleEnrollAllVocabsInLesson = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const vocabIds = (lessonDetail?.vocabularies || []).map(v => v._id);
    if (vocabIds.length === 0) return;

    try {
      await api.post('/reviews/enroll', { vocabIds });
      setEnrolledVocabs(prev => new Set([...prev, ...vocabIds]));
      setEnrollNotice(`Đã nạp toàn bộ ${vocabIds.length} từ của bài vào Hộp 1 SRS!`);
      setTimeout(() => setEnrollNotice(''), 3000);
    } catch (err) {
      setEnrollNotice(`Lỗi: ${err.message}`);
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
      return; // Locked
    }

    setActiveLessonId(lesson._id);
    setActiveTab('theory');
    setQuizAnswers({});
    setQuizSubmitted(false);

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

  const playAudio = (url) => {
    if (!url) return;
    const a = new Audio(url);
    a.play().catch(() => {});
  };

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── Top Header ─── */}
      <div className="row-between">
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Thư viện bài học theo kỹ năng</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15 }}>
            Khám phá lộ trình bài học vi mô, học lý thuyết, nạp từ vựng và mở khóa các mốc điều kiện tiên quyết (DAG).
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => (onBack ? onBack() : navigate('/'))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} />
          <span>Về Dashboard</span>
        </button>
      </div>

      {/* ─── Skill Filter Tabs ─── */}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {SKILLS.map((sk) => {
          const Icon = sk.icon;
          const isActive = selectedSkill === sk.key;
          return (
            <button
              key={sk.key}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 13, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => handleSelectSkill(sk.key)}
            >
              <Icon size={15} />
              <span>{sk.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Level Filter Sub-tabs ─── */}
      <div className="row" style={{ gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontWeight: 600 }}>Cấp độ:</span>
        {['all', '0', '1', '2', '3'].map((lvl) => (
          <button
            key={lvl}
            className={`pill ${selectedLevel === lvl ? 'pill-cobalt' : 'pill-muted'}`}
            style={{ cursor: 'pointer', fontSize: 12, padding: '4px 10px' }}
            onClick={() => setSelectedLevel(lvl)}
          >
            {lvl === 'all' ? 'Tất cả level' : `Level ${lvl}`}
          </button>
        ))}
      </div>

      {/* ─── Lessons List ─── */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--fg-muted)' }}>Đang tải danh sách bài học...</p>
        </div>
      )}

      {!loading && lessons.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15 }}>
            Chưa có bài học nào được xuất bản cho kỹ năng và cấp độ này.
          </p>
        </div>
      )}

      {!loading && lessons.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {lessons.map((lesson) => {
            const isMastered = lesson.status === 'mastered';
            const isUnlocked = lesson.status === 'unlocked' || isMastered;

            return (
              <div
                key={lesson._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                  opacity: isUnlocked ? 1 : 0.65,
                  borderLeft: isMastered
                    ? '4px solid var(--color-emerald)'
                    : isUnlocked
                    ? '4px solid var(--color-cobalt)'
                    : '4px solid var(--border-strong)'
                }}
              >
                <div>
                  <div className="row-between" style={{ marginBottom: 8 }}>
                    <span className="soft-pill" style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
                      Level {lesson.level} · {lesson.skill}
                    </span>
                    {isMastered ? (
                      <span className="pill pill-success" style={{ fontSize: 11 }}>
                        <Check size={12} /> Đã thuộc
                      </span>
                    ) : isUnlocked ? (
                      <span className="pill pill-cobalt" style={{ fontSize: 11 }}>
                        Sẵn sàng học
                      </span>
                    ) : (
                      <span className="pill pill-muted" style={{ fontSize: 11 }}>
                        <Lock size={12} /> Bị khóa
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 17, margin: '6px 0', lineHeight: 1.3 }}>{lesson.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Chủ đề: {lesson.topic || 'General'}</p>

                  {lesson.prerequisites && lesson.prerequisites.length > 0 && !isUnlocked && (
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-rose)' }}>
                      Yêu cầu hoàn thành trước:{' '}
                      {lesson.prerequisites.map((p) => (typeof p === 'object' ? p.title : p)).join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  {isUnlocked ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: 13, padding: '8px 14px' }}
                      onClick={() => handleOpenLesson(lesson)}
                    >
                      <Play size={14} fill="currentColor" />
                      <span>{isMastered ? 'Học lại bài này' : 'Vào học ngay'}</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', fontSize: 13, padding: '8px 14px', cursor: 'not-allowed' }}
                      disabled
                    >
                      <Lock size={14} />
                      <span>Chưa mở khóa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Lesson Study Modal ─── */}
      {activeLessonId && (
        <div className="modal-backdrop" style={{ display: 'grid' }}>
          <div
            className="modal-box"
            style={{
              maxWidth: 780,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              textAlign: 'left',
              padding: 28
            }}
          >
            {/* Modal Topbar */}
            <div className="row-between" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <span className="soft-pill" style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
                  Level {lessonDetail?.lesson?.level ?? 0} · {lessonDetail?.lesson?.skill}
                </span>
                <h2 style={{ fontSize: 22, marginTop: 6 }}>{lessonDetail?.lesson?.title || 'Đang tải bài học...'}</h2>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setActiveLessonId(null);
                  setLessonDetail(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetail ? (
              <p style={{ color: 'var(--fg-muted)', padding: 30, textAlign: 'center' }}>Đang nạp dữ liệu bài học...</p>
            ) : (
              <>
                {/* Lesson Navigation Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <button
                    className={`btn ${activeTab === 'theory' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 13, padding: '7px 14px' }}
                    onClick={() => setActiveTab('theory')}
                  >
                    1. Lý thuyết bài học
                  </button>
                  <button
                    className={`btn ${activeTab === 'vocab' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 13, padding: '7px 14px' }}
                    onClick={() => setActiveTab('vocab')}
                  >
                    2. Từ vựng cốt lõi ({lessonDetail?.vocabularies?.length || 0})
                  </button>
                  <button
                    className={`btn ${activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 13, padding: '7px 14px' }}
                    onClick={() => setActiveTab('quiz')}
                  >
                    3. Bài tập thực hành ({lessonDetail?.questions?.length || 0})
                  </button>
                </div>

                {/* Tab 1: Theory */}
                {activeTab === 'theory' && (
                  <div className="card" style={{ background: 'var(--surface-subtle)', whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.7 }}>
                    {lessonDetail?.lesson?.contentMarkdown || 'Bài học này chưa có nội dung lý thuyết.'}
                  </div>
                )}

                {/* Tab 2: Vocabularies */}
                {activeTab === 'vocab' && (
                  <div className="stack" style={{ gap: 14 }}>
                    {enrollNotice && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          background: 'var(--color-emerald-surface)',
                          color: 'var(--color-emerald)',
                          border: '1px solid var(--color-emerald-border)',
                          textAlign: 'center'
                        }}
                      >
                        {enrollNotice}
                      </div>
                    )}

                    {lessonDetail?.vocabularies && lessonDetail.vocabularies.length > 0 && (
                      <div className="row-between" style={{ padding: '4px 0' }}>
                        <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                          {lessonDetail.vocabularies.length} từ vựng trọng tâm
                        </span>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: '6px 12px' }}
                          onClick={handleEnrollAllVocabsInLesson}
                        >
                          + Nạp tất cả từ này vào Hộp 1 SRS
                        </button>
                      </div>
                    )}

                    {(!lessonDetail?.vocabularies || lessonDetail.vocabularies.length === 0) && (
                      <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Bài học này không đính kèm từ vựng mới.</p>
                    )}

                    {lessonDetail?.vocabularies?.map((v) => {
                      const isEnrolled = enrolledVocabs.has(v._id);
                      return (
                        <div key={v._id} className="card" style={{ background: 'var(--surface-subtle)', padding: 18 }}>
                          <div className="row-between">
                            <div>
                              <h3 style={{ fontSize: 20, margin: 0 }}>{v.word}</h3>
                              <span className="ipa" style={{ color: 'var(--color-cobalt)', fontSize: 14 }}>
                                {v.ipa} · {v.pos}
                              </span>
                            </div>
                            <div className="row" style={{ gap: 8 }}>
                              {v.media?.url && (
                                <button className="btn btn-secondary" onClick={() => playAudio(v.media.url)} style={{ gap: 6, fontSize: 12 }}>
                                  <Volume2 size={14} />
                                  <span>Nghe</span>
                                </button>
                              )}
                              <button
                                className={`btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ fontSize: 12, padding: '5px 10px' }}
                                onClick={() => handleEnrollSingleVocab(v._id)}
                                disabled={isEnrolled}
                              >
                                {isEnrolled ? '✓ Đã trong SRS' : '+ Thêm vào SRS'}
                              </button>
                            </div>
                          </div>
                          <p style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>Nghĩa: {v.meaningVi}</p>
                          {v.exampleSentence && (
                            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--fg-muted)' }}>Ví dụ: "{v.exampleSentence}"</p>
                          )}
                          {v.collocations && v.collocations.length > 0 && (
                            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-emerald)' }}>
                              Collocations: {v.collocations.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab 3: Practice Questions */}
                {activeTab === 'quiz' && (
                  <div className="stack" style={{ gap: 16 }}>
                    {(!lessonDetail?.questions || lessonDetail.questions.length === 0) && (
                      <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Chưa có câu hỏi trắc nghiệm cho bài này.</p>
                    )}
                    {lessonDetail?.questions?.map((q, idx) => {
                      const userAns = quizAnswers[q._id];
                      const isCorrect = userAns && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                      return (
                        <div key={q._id} className="card" style={{ background: 'var(--surface-subtle)', padding: 18 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-cobalt)', fontWeight: 700 }}>
                            CÂU {idx + 1} ({q.errorTaxonomy || 'PRACTICE'})
                          </span>
                          <p style={{ fontSize: 16, fontWeight: 600, margin: '8px 0 12px' }}>{q.prompt}</p>

                          {q.type === 'choice' && q.options && (
                            <div className="option-grid" style={{ marginTop: 8 }}>
                              {q.options.map((opt) => (
                                <button
                                  key={opt}
                                  className={`option-btn ${userAns === opt ? 'selected' : ''}`}
                                  onClick={() => setQuizAnswers({ ...quizAnswers, [q._id]: opt })}
                                >
                                  <span>{opt}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {q.type !== 'choice' && (
                            <input
                              type="text"
                              className="input-text"
                              placeholder="Nhập câu trả lời..."
                              value={userAns || ''}
                              onChange={(e) => setQuizAnswers({ ...quizAnswers, [q._id]: e.target.value })}
                            />
                          )}

                          {quizSubmitted && (
                            <div
                              style={{
                                marginTop: 12,
                                padding: '10px 14px',
                                borderRadius: 8,
                                fontSize: 13,
                                background: isCorrect ? 'var(--color-emerald-surface)' : 'var(--color-rose-surface)',
                                color: isCorrect ? 'var(--color-emerald)' : 'var(--color-rose)'
                              }}
                            >
                              <strong>{isCorrect ? 'Chính xác!' : `Chưa đúng. Đáp án: ${q.correctAnswer}`}</strong>
                              {q.explanation && <p style={{ marginTop: 4, color: 'var(--fg)' }}>{q.explanation}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div style={{ textAlign: 'right', marginTop: 12 }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => setQuizSubmitted(true)}
                        disabled={lessonDetail?.questions?.length === 0}
                      >
                        Kiểm tra kết quả bài tập
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
