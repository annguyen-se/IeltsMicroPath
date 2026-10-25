/* Hallmark · macrostructure: Workbench · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const boxParam = searchParams.get('box');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [mode, setMode] = useState(boxParam ? 'all' : 'due'); // 'due' | 'all'
  const [selectedBox, setSelectedBox] = useState(
    boxParam && ['1', '2', '3', '4', '5'].includes(boxParam) ? boxParam : 'all'
  );
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [totalTracked, setTotalTracked] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [notification, setNotification] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/vocabulary/topics');
        setAvailableTopics(res?.topics || []);
      } catch (err) {
        console.warn('[Fetch Topics Error]:', err.message);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    const b = searchParams.get('box');
    if (b && ['1', '2', '3', '4', '5'].includes(b)) {
      setSelectedBox(b);
      setMode('all');
    }
  }, [searchParams]);

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
      setNotification(`Enrolled ${count} words from ${label} into Box 1!`);
      setTimeout(() => setNotification(''), 3000);
      setMode('all');
      setSelectedTopic(topic);
      await fetchItems();
    } catch (err) {
      setNotification(`Enrollment error: ${err.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEnrollAll = async () => {
    try {
      setIsEnrolling(true);
      const res = await api.post('/reviews/enroll-all', { limit: 1000 });
      const count = res?.enrolledCount ?? 0;
      setNotification(`Enrolled ${count} words into Box 1. Ready for review!`);
      setTimeout(() => setNotification(''), 3000);
      setMode('all');
      setSelectedBox('all');
      setSelectedTopic('all');
      await fetchItems();
    } catch (err) {
      setNotification(`Enrollment error: ${err.message}`);
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
      setItems([]);
      setCurrentIndex(0);
      fetchItems();
    }
  };

  const currentItem = items[currentIndex];
  const vocab = currentItem?.vocabId || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* ─── Top Header ─── */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-head-row">
          <div>
            <span className="section-kicker">
              <Layers size={13} aria-hidden="true" /> Spaced Repetition System
            </span>
            <h1 className="section-title">Leitner Memory Review Room</h1>
            <p className="section-desc">
              Long-term academic lexis retention tracked across five Ebbinghaus interval boxes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {isAuthenticated && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleEnrollAll}
                disabled={isEnrolling}
                title="Enroll all available database lexis into Box 1">
                <Plus size={13} />
                <span>{isEnrolling ? 'Enrolling...' : 'Enroll All Lexis'}</span>
              </button>
            )}
            {onBack && (
              <button className="btn btn-secondary btn-sm" onClick={onBack}>
                <ArrowLeft size={14} />
                <span>Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: 600,
            background: 'var(--color-moss-soft)',
            color: 'var(--color-moss)',
            border: '1px solid var(--color-rule)',
            textAlign: 'center'
          }}>
          {notification}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'var(--color-paper-2)',
              color: 'var(--color-accent)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              placeItems: 'center'
            }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>Review Room Requires Authentication</h2>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14, maxWidth: 460, margin: '0 auto 24px' }}>
            Your 5 Leitner boxes are personalized to track your individual forgetting curve and schedule daily recall intervals.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={onOpenAuth}>
              <span>Sign In Now</span>
            </button>
            {onBack && (
              <button className="btn btn-secondary" onClick={onBack}>
                <span>Back to Workspace</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ─── Mode & Box Filter Bar ─── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn btn-sm ${mode === 'due' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('due')}>
                Due Today ({dueCount})
              </button>
              <button
                className={`btn btn-sm ${mode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('all')}>
                All Enrolled Cards ({totalTracked})
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600 }}>Topic:</span>
              <button
                className={`pill ${selectedTopic === 'all' ? 'pill-cobalt' : 'pill-muted'}`}
                style={{ cursor: 'pointer', padding: '3px 8px' }}
                onClick={() => setSelectedTopic('all')}>
                All
              </button>
              {availableTopics.map((t) => {
                const topicKey = typeof t === 'object' ? t.topic : t;
                return (
                  <button
                    key={topicKey}
                    className={`pill ${selectedTopic === topicKey ? 'pill-cobalt' : 'pill-muted'}`}
                    style={{ cursor: 'pointer', padding: '3px 8px' }}
                    onClick={() => setSelectedTopic(topicKey)}>
                    {topicKey}
                  </button>
                );
              })}

              <span style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600, marginLeft: 8 }}>Box:</span>
              <button
                className={`pill ${selectedBox === 'all' ? 'pill-cobalt' : 'pill-muted'}`}
                style={{ cursor: 'pointer', padding: '3px 8px' }}
                onClick={() => setSelectedBox('all')}>
                All
              </button>
              {[1, 2, 3, 4, 5].map((b) => (
                <button
                  key={b}
                  className={`pill ${selectedBox === String(b) ? 'pill-cobalt' : 'pill-muted'}`}
                  style={{ cursor: 'pointer', padding: '3px 8px' }}
                  onClick={() => setSelectedBox(String(b))}>
                  Box {b}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>Loading flashcard queue...</p>
            </div>
          )}

          {/* Empty State: No cards enrolled */}
          {!loading && totalTracked === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: 'var(--color-paper-2)',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-border)',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                <Layers size={24} />
              </div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Your Flashcard Deck is Empty</h2>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: 14, maxWidth: 480, margin: '0 auto 24px' }}>
                Academic lexis is available in the library. Enroll vocabulary into Box 1 to start your spaced review routine.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleEnrollAll}
                disabled={isEnrolling}>
                <Sparkles size={15} />
                <span>{isEnrolling ? 'Enrolling words...' : 'Enroll All Lexis into Box 1 Now'}</span>
              </button>
            </div>
          )}

          {/* Empty State: No due cards today */}
          {!loading && totalTracked > 0 && items.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: 'var(--color-moss-soft)',
                  color: 'var(--color-moss)',
                  border: '1px solid var(--color-rule)',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                <CheckCircle2 size={26} />
              </div>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>All Scheduled Cards Reviewed for Today!</h2>
              <p style={{ color: 'var(--color-ink-muted)', fontSize: 14, maxWidth: 480, margin: '0 auto 24px' }}>
                {mode === 'due'
                  ? `No more cards due today. You have ${totalTracked} total words scheduled across your Leitner boxes.`
                  : 'No vocabulary items found in the selected box filter.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {mode === 'due' && (
                  <button className="btn btn-primary" onClick={() => setMode('all')}>
                    <span>Review Ahead ({totalTracked} Cards)</span>
                  </button>
                )}
                <button className="btn btn-secondary" onClick={handleEnrollAll} disabled={isEnrolling}>
                  <span>Enroll Additional Lexis into Box 1</span>
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
                padding: '44px 36px',
                width: '100%',
                background: 'var(--color-surface)'
              }}>
              {/* Box Pill */}
              <div style={{ marginBottom: 18 }}>
                <span className="syllabus-badge" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  <Clock size={12} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                  BOX {currentItem.box} · ({currentIndex + 1} OF {items.length})
                </span>
              </div>

              {/* Word Heading */}
              <div
                style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em',
                  marginBottom: 6,
                  color: 'var(--color-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12
                }}>
                <span>{vocab.word}</span>
                <button
                  className="btn btn-ghost"
                  onClick={() => playAudio(vocab.media?.url, vocab.word)}
                  title="Listen to pronunciation"
                  style={{ padding: 6, borderRadius: '50%' }}>
                  <Volume2 size={20} style={{ color: 'var(--color-accent)' }} />
                </button>
              </div>

              <div className="ipa" style={{ color: 'var(--color-accent)', fontSize: 17, marginBottom: 24 }}>
                {vocab.ipa} {vocab.pos ? `· ${vocab.pos}` : ''}
              </div>

              {/* Back of the Flashcard */}
              {isFlipped && (
                <div
                  style={{
                    padding: 'var(--space-md)',
                    background: 'var(--color-paper-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-rule)',
                    marginBottom: 24,
                    fontSize: 14.5,
                    textAlign: 'left',
                    lineHeight: 1.6
                  }}>
                  {vocab.definitionEn && (
                    <p>
                      <strong>Definition:</strong> {vocab.definitionEn}
                    </p>
                  )}
                  {vocab.exampleSentence && (
                    <p style={{ marginTop: 8 }}>
                      <strong>Academic Example:</strong> <em>"{vocab.exampleSentence}"</em>
                    </p>
                  )}
                  {/* MeaningVi preserved per Language Policy rule 3: abstract concept anchor for Vietnamese learners */}
                  {vocab.meaningVi && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px dashed var(--color-rule)',
                        fontSize: 13,
                        color: 'var(--color-ink-muted)'
                      }}>
                      <strong>Vietnamese Meaning (Nghĩa tiếng Việt):</strong> {vocab.meaningVi}
                    </div>
                  )}
                  {vocab.collocations && vocab.collocations.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--color-moss)', fontFamily: 'var(--font-mono)' }}>
                      <strong>Collocations:</strong> {vocab.collocations.join(', ')}
                    </div>
                  )}
                  {vocab.paraphrases && vocab.paraphrases.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--color-accent)' }}>
                      <strong>Paraphrases:</strong> {vocab.paraphrases.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Flashcard Actions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {!isFlipped ? (
                  <button className="btn btn-secondary" onClick={() => setIsFlipped(true)}>
                    <RefreshCw size={15} />
                    <span>Flip Card to View Meaning</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ borderColor: 'var(--color-brick)', color: 'var(--color-brick)' }}
                      onClick={() => handleGrade(false)}>
                      <X size={15} />
                      <span>Needs Review (Box 1)</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => handleGrade(true)}>
                      <Check size={15} />
                      <span>Recalled (+1 Box)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Keyboard Shortcuts Hint */}
              <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--color-ink-muted)', marginTop: 16, fontFamily: 'var(--font-mono)' }}>
                Shortcuts: [Space/↓] Flip · [1/←] Forgot (Box 1) · [2/→] Remembered (+1 Box) · [ ` ] Audio
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
