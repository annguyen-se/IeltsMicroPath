import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { playWordAudio, preloadAudio } from '../../utils/audio';
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  X,
  Check,
  Volume2,
  CheckCircle2,
  Lock,
  Plus,
  Layers,
  Sparkles
} from 'lucide-react';

export default function SrsReviewRoom({ onBack, isAuthenticated = false, onOpenAuth }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [mode, setMode] = useState('due'); // 'due' | 'all'
  const [selectedBox, setSelectedBox] = useState('all'); // 'all' | 1..5
  const [selectedTopic, setSelectedTopic] = useState('all'); // 'all' | 'listening-179' | 'reading-538'
  const [dueCount, setDueCount] = useState(0);
  const [totalTracked, setTotalTracked] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [notification, setNotification] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, mode, selectedBox, selectedTopic]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('mode', mode);
      if (selectedBox !== 'all') params.append('box', selectedBox);
      if (selectedTopic !== 'all') params.append('topic', selectedTopic);

      const res = await api.get(`/reviews/due?${params.toString()}`);
      setItems(res?.items || []);
      setDueCount(res?.dueCount ?? 0);
      setTotalTracked(res?.totalTracked ?? 0);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.warn('[Fetch SRS Reviews Error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollTopic = async (topic, label) => {
    try {
      setIsEnrolling(true);
      const res = await api.post('/reviews/enroll-all', { topic, limit: 1000 });
      const count = res?.enrolledCount ?? 0;
      setNotification(`Đã nạp ${count} từ thuộc ${label} vào Hộp 1 SRS!`);
      setTimeout(() => setNotification(''), 3000);
      setMode('all');
      setSelectedTopic(topic);
      await fetchItems();
    } catch (err) {
      setNotification(`Lỗi nạp từ: ${err.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEnrollAll = async () => {
    try {
      setIsEnrolling(true);
      const res = await api.post('/reviews/enroll-all', { limit: 1000 });
      const count = res?.enrolledCount ?? 0;
      setNotification(`Đã nạp thành công ${count} từ vựng vào Hộp 1! Bắt đầu học ngay.`);
      setTimeout(() => setNotification(''), 3000);
      setMode('all');
      setSelectedBox('all');
      setSelectedTopic('all');
      await fetchItems();
    } catch (err) {
      setNotification(`Lỗi nạp từ: ${err.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  // Keyboard navigation for smooth flashcard study
  useEffect(() => {
    const onKey = (e) => {
      if (!items[currentIndex] || loading) return;
      if (e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '`') {
        e.preventDefault();
        const v = items[currentIndex]?.vocabId;
        if (v) playAudio(v.media?.url, v.word);
      } else if (isFlipped) {
        if (e.key === '1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handleGrade(false);
        } else if (e.key === '2' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleGrade(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, currentIndex, isFlipped, loading]);

  const playAudio = (url, word) => {
    playWordAudio(url, word);
  };

  // Preload next flashcard audio into memory cache
  useEffect(() => {
    const nextItem = items[currentIndex + 1];
    const nextUrl = nextItem?.vocabId?.media?.url;
    if (nextUrl) {
      preloadAudio(nextUrl);
    }
  }, [currentIndex, items]);

  const handleGrade = async (isCorrect) => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    try {
      await api.post('/reviews/submit', {
        srsId: currentItem._id,
        isCorrect
      });
      setNotification(isCorrect ? 'Card promoted to next box!' : 'Reset to Box 1 for tomorrow!');
      setTimeout(() => setNotification(''), 2500);
    } catch (err) {
      console.warn('[Submit Review Warning]:', err.message);
    }

    setIsFlipped(false);
    if (currentIndex + 1 < items.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed current queue
      setItems([]);
      setCurrentIndex(0);
      fetchItems();
    }
  };

  const currentItem = items[currentIndex];
  const vocab = currentItem?.vocabId || {};

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── Top Header ─── */}
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Phòng Ôn tập ngắt quãng (Leitner SRS)</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15 }}>
            Tự do ôn tập từ vựng độc lập theo Ebbinghaus Forgetting Curve trên 5 hộp trí nhớ dài hạn.
          </p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {isAuthenticated && (
            <>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '6px 11px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={() => handleEnrollTopic('listening-179', 'Listening 179')}
                disabled={isEnrolling}
                title="Nạp 179 từ khóa Listening vào Hộp 1"
              >
                <Plus size={13} />
                <span>+ Listening 179</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '6px 11px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={() => handleEnrollTopic('reading-538', 'Reading 538')}
                disabled={isEnrolling}
                title="Nạp từ khóa Reading vào Hộp 1"
              >
                <Plus size={13} />
                <span>+ Reading 538</span>
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: 12, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={handleEnrollAll}
                disabled={isEnrolling}
                title="Nạp các từ vựng có trong database vào Hộp 1 để học"
              >
                <Plus size={13} />
                <span>{isEnrolling ? 'Đang nạp...' : 'Nạp tất cả'}</span>
              </button>
            </>
          )}
          {onBack && (
            <button className="btn btn-secondary" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={16} />
              <span>Về Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: 'var(--color-emerald-surface)',
            color: 'var(--color-emerald)',
            border: '1px solid var(--color-emerald-border)',
            textAlign: 'center'
          }}
        >
          {notification}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div
            className="empty-icon"
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              background: 'var(--color-cobalt-surface)',
              color: 'var(--color-cobalt)',
              borderColor: 'var(--color-cobalt-border)'
            }}
          >
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Phòng Ôn tập yêu cầu đăng nhập</h2>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14.5, maxWidth: 440, margin: '0 auto 24px' }}>
            Hàng đợi 5 hộp Leitner được cá nhân hóa theo từng tài khoản học viên để tự động xếp lịch ôn theo Ebbinghaus Forgetting Curve.
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={onOpenAuth}>
              <span>Đăng nhập ngay</span>
            </button>
            {onBack && (
              <button className="btn btn-secondary" onClick={onBack}>
                <span>Về Dashboard</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ─── Mode & Box Filter Bar ─── */}
          <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="row" style={{ gap: 8 }}>
              <button
                className={`btn ${mode === 'due' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 13, padding: '7px 14px' }}
                onClick={() => setMode('due')}
              >
                Cần ôn hôm nay ({dueCount})
              </button>
              <button
                className={`btn ${mode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 13, padding: '7px 14px' }}
                onClick={() => setMode('all')}
              >
                Tất cả từ đã lưu ({totalTracked})
              </button>
            </div>

            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600 }}>Chủ đề:</span>
              <button
                className={`pill ${selectedTopic === 'all' ? 'pill-cobalt' : 'pill-muted'}`}
                style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSelectedTopic('all')}
              >
                Tất cả
              </button>
              <button
                className={`pill ${selectedTopic === 'listening-179' ? 'pill-cobalt' : 'pill-muted'}`}
                style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSelectedTopic('listening-179')}
              >
                Listening 179
              </button>
              <button
                className={`pill ${selectedTopic === 'reading-538' ? 'pill-cobalt' : 'pill-muted'}`}
                style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSelectedTopic('reading-538')}
              >
                Reading 538
              </button>

              <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600, marginLeft: 8 }}>Hộp:</span>
              <button
                className={`pill ${selectedBox === 'all' ? 'pill-cobalt' : 'pill-muted'}`}
                style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSelectedBox('all')}
              >
                Tất cả
              </button>
              {[1, 2, 3, 4, 5].map((b) => (
                <button
                  key={b}
                  className={`pill ${selectedBox === String(b) ? 'pill-cobalt' : 'pill-muted'}`}
                  style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setSelectedBox(String(b))}
                >
                  Hộp {b}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: 'var(--fg-muted)' }}>Đang tải hàng đợi thẻ từ vựng...</p>
            </div>
          )}

          {/* Empty state: No words tracked yet in entire system for this user */}
          {!loading && totalTracked === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div
                className="empty-icon"
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 16px',
                  background: 'var(--color-cobalt-surface)',
                  color: 'var(--color-cobalt)',
                  borderColor: 'var(--color-cobalt-border)'
                }}
              >
                <Layers size={28} />
              </div>
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>Hộp từ vựng của bạn đang trống</h2>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14.5, maxWidth: 500, margin: '0 auto 24px' }}>
                Hệ thống đã có sẵn từ vựng trong cơ sở dữ liệu. Bấm nút bên dưới để nạp toàn bộ vào Hộp 1 và bắt đầu lật thẻ ôn tập ngay bây giờ!
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleEnrollAll}
                disabled={isEnrolling}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Sparkles size={16} />
                <span>{isEnrolling ? 'Đang nạp từ...' : 'Nạp toàn bộ từ vựng vào Hộp 1 ngay'}</span>
              </button>
            </div>
          )}

          {/* Empty state: No due cards today, but user has words in other boxes */}
          {!loading && totalTracked > 0 && items.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div className="empty-icon" style={{ width: 56, height: 56, margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: 22, marginBottom: 6 }}>Bạn đã hoàn thành các từ đến hạn hôm nay!</h2>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14.5, maxWidth: 480, margin: '0 auto 24px' }}>
                {mode === 'due'
                  ? `Hiện tại không còn từ nào đến hạn ôn trong ngày. Bạn có tổng cộng ${totalTracked} từ đang được lên lịch theo các hộp.`
                  : 'Không có từ nào trong hộp được chọn.'}
              </p>
              <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
                {mode === 'due' && (
                  <button className="btn btn-primary" onClick={() => setMode('all')}>
                    <span>Ôn luyện trước tất cả từ ({totalTracked})</span>
                  </button>
                )}
                <button className="btn btn-secondary" onClick={handleEnrollAll} disabled={isEnrolling}>
                  <span>Nạp thêm từ mới vào Hộp 1</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Flashcard Review View */}
          {!loading && currentItem && (
            <div
              className="card"
              style={{
                textAlign: 'center',
                maxWidth: 620,
                margin: '12px auto',
                padding: '48px 36px',
                width: '100%'
              }}
            >
              {/* Box Pill */}
              <div style={{ marginBottom: 20 }}>
                <span className="pill pill-err">
                  <Clock size={13} />
                  <span>
                    BOX {currentItem.box} · ({currentIndex + 1} / {items.length})
                  </span>
                </span>
              </div>

              {/* Word Heading */}
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.01em',
                  marginBottom: 8,
                  color: 'var(--fg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12
                }}
              >
                <span>{vocab.word}</span>
                <button
                  className="btn btn-ghost"
                  onClick={() => playAudio(vocab.media?.url, vocab.word)}
                  title="Play pronunciation"
                  style={{ padding: 6, borderRadius: '50%' }}
                >
                  <Volume2 size={22} style={{ color: 'var(--color-cobalt)' }} />
                </button>
              </div>

              <div className="ipa" style={{ color: 'var(--color-cobalt)', fontSize: 18, marginBottom: 24 }}>
                {vocab.ipa} {vocab.pos ? `· ${vocab.pos}` : ''}
              </div>

              {/* Back of the Flashcard */}
              {isFlipped && (
                <div
                  style={{
                    padding: 22,
                    background: 'var(--surface-subtle)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    marginBottom: 26,
                    fontSize: 15,
                    textAlign: 'left',
                    lineHeight: 1.65
                  }}
                >
                  {vocab.definitionEn && (
                    <p>
                      <strong>Definition:</strong> {vocab.definitionEn}
                    </p>
                  )}
                  {vocab.exampleSentence && (
                    <p style={{ marginTop: 10 }}>
                      <strong>Example:</strong> <em>"{vocab.exampleSentence}"</em>
                    </p>
                  )}
                  {vocab.meaningVi && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: '1px dashed var(--border)',
                        fontSize: 13,
                        color: 'var(--fg-muted)'
                      }}
                    >
                      <strong>Nghĩa tiếng Việt:</strong> {vocab.meaningVi}
                    </div>
                  )}
                  {vocab.collocations && vocab.collocations.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-emerald)' }}>
                      <strong>Collocations:</strong> {vocab.collocations.join(', ')}
                    </div>
                  )}
                  {vocab.paraphrases && vocab.paraphrases.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-cobalt)' }}>
                      <strong>Từ đồng nghĩa (Paraphrases):</strong> {vocab.paraphrases.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Flashcard Actions */}
              <div className="row" style={{ justifyContent: 'center', gap: 14 }}>
                {!isFlipped ? (
                  <button className="btn btn-secondary" onClick={() => setIsFlipped(true)}>
                    <RefreshCw size={16} />
                    <span>Lật thẻ xem nghĩa (Flip)</span>
                  </button>
                ) : (
                  <div className="row" style={{ gap: 12 }}>
                    <button className="btn btn-danger" onClick={() => handleGrade(false)}>
                      <X size={16} />
                      <span>Chưa thuộc (Về Hộp 1)</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => handleGrade(true)}>
                      <Check size={16} />
                      <span>Đã thuộc (Lên Hộp kế)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Keyboard Shortcuts Hint */}
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-muted)', marginTop: 16 }}>
                Phím tắt: [Space/↓] Lật thẻ · [1/←] Quên (Hộp 1) · [2/→] Nhớ (+1 Hộp) · [ ` ] Phát âm
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
