import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { ArrowLeft, Clock, RefreshCw, X, Check, Volume2, CheckCircle2, Lock } from 'lucide-react';

export default function SrsReviewRoom({ onBack, isAuthenticated = false, onOpenAuth }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDueItems();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchDueItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/due');
      setItems(res?.items || []);
    } catch (err) {
      console.warn('[Fetch Due Reviews Error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (url) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

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
      // Finished all cards in queue
      setItems([]);
      setCurrentIndex(0);
    }
  };

  const currentItem = items[currentIndex];
  const vocab = currentItem?.vocabId || {};

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── Top Header ─── */}
      <div className="row-between">
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Spaced Repetition Room (Leitner SRS)</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15 }}>
            Independently practice due vocabulary outside scheduled hours across 5 memory boxes.
          </p>
        </div>
        {onBack && (
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        )}
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
          <div className="empty-icon" style={{ width: 56, height: 56, margin: '0 auto 16px', background: 'var(--color-cobalt-surface)', color: 'var(--color-cobalt)', borderColor: 'var(--color-cobalt-border)' }}>
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
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: 'var(--fg-muted)' }}>Loading vocabulary queue...</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div className="empty-icon" style={{ width: 56, height: 56, margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: 22, marginBottom: 6 }}>You're all caught up!</h2>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14.5, marginBottom: 24 }}>
                No vocabulary cards are due for review right now. Great job keeping your memory curve fresh!
              </p>
              {onBack && (
                <button className="btn btn-primary" onClick={onBack}>
                  <span>Back to Dashboard</span>
                </button>
              )}
            </div>
          )}

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
                  <span>BOX {currentItem.box} · DUE TODAY ({currentIndex + 1} / {items.length})</span>
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
                {vocab.media?.url && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => playAudio(vocab.media.url)}
                    title="Play pronunciation"
                    style={{ padding: 6, borderRadius: '50%' }}
                  >
                    <Volume2 size={22} style={{ color: 'var(--color-cobalt)' }} />
                  </button>
                )}
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
                </div>
              )}

              {/* Flashcard Actions */}
              <div className="row" style={{ justifyContent: 'center', gap: 14 }}>
                {!isFlipped ? (
                  <button className="btn btn-secondary" onClick={() => setIsFlipped(true)}>
                    <RefreshCw size={16} />
                    <span>Flip card</span>
                  </button>
                ) : (
                  <div className="row" style={{ gap: 12 }}>
                    <button className="btn btn-danger" onClick={() => handleGrade(false)}>
                      <X size={16} />
                      <span>I forgot (Reset to Box 1)</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => handleGrade(true)}>
                      <Check size={16} />
                      <span>I remembered (Promote Box)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
