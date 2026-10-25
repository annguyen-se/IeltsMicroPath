import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio, preloadAudio } from '../../utils/audio';
import {
  Keyboard,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  BookmarkCheck
} from 'lucide-react';

const PROGRESS_STORAGE_KEY = 'ieltstrain_typing_progress_v1';

// Helper to get saved progress map from localStorage
const getSavedProgressMap = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[Get Typing Progress Error]:', err);
    return {};
  }
};

// Helper to save progress for a specific topic
const saveTopicProgress = (topic, index, total, isCompleted = false) => {
  try {
    const map = getSavedProgressMap();
    map[topic] = {
      currentIndex: index,
      totalWords: total,
      completed: isCompleted,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[Save Typing Progress Error]:', err);
  }
};

// Helper to clear progress for a specific topic
const clearTopicProgress = (topic) => {
  try {
    const map = getSavedProgressMap();
    delete map[topic];
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[Clear Typing Progress Error]:', err);
  }
};

export default function TypingDrill({ isAuthenticated = false, onOpenAuth }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(() => {
    return localStorage.getItem('ieltstrain_typing_topic') || '';
  });

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);

  const [autoPlayAudio, setAutoPlayAudio] = useState(() => {
    return localStorage.getItem('ieltstrain_typing_autoplay') !== 'false';
  });

  const [mistakeWordMap, setMistakeWordMap] = useState({});
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [resumeNotification, setResumeNotification] = useState('');

  // 1. Fetch available vocabulary topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/vocabulary/topics');
        const list = res?.topics || [];
        setTopics(list);
        if (list.length > 0 && (!selectedTopic || !list.some((t) => t.topic === selectedTopic))) {
          setSelectedTopic(list[0].topic);
        }
      } catch (err) {
        console.warn('[Fetch Topics Warning]:', err.message);
      }
    };
    fetchTopics();
  }, []);

  // 2. Fetch words for the selected topic and restore progress
  useEffect(() => {
    if (!selectedTopic) return;
    localStorage.setItem('ieltstrain_typing_topic', selectedTopic);

    const fetchWords = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/vocabulary?topic=${encodeURIComponent(selectedTopic)}&limit=500`);
        const items = res?.items || [];
        setWords(items);

        // Check for saved progress for this topic
        const progressMap = getSavedProgressMap();
        const saved = progressMap[selectedTopic];

        if (saved && typeof saved.currentIndex === 'number' && saved.currentIndex > 0 && saved.currentIndex < items.length) {
          setCurrentIndex(saved.currentIndex);
          setResumeNotification(`Đã khôi phục tiến trình: Tiếp tục từ từ số ${saved.currentIndex + 1} / ${items.length}`);
        } else {
          setCurrentIndex(0);
          setResumeNotification('');
        }

        setUserInput('');
        setStartTime(null);
        setWpm(0);
        setAccuracy(100);
        setIsFinished(false);
        setMistakeWordMap({});
        setSessionSaved(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 120);
      } catch (err) {
        console.warn('[Fetch Vocab Warning]:', err.message);
        setWords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [selectedTopic]);

  const resetState = () => {
    clearTopicProgress(selectedTopic);
    setCurrentIndex(0);
    setUserInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
    setMistakeWordMap({});
    setSessionSaved(false);
    setResumeNotification('Đã bắt đầu lại chủ đề này từ từ đầu tiên.');
    setTimeout(() => {
      setResumeNotification('');
    }, 3500);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleJumpToWord = (newIndex) => {
    if (newIndex < 0 || newIndex >= words.length) return;
    setCurrentIndex(newIndex);
    setUserInput('');
    setStartTime(null);
    saveTopicProgress(selectedTopic, newIndex, words.length);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const currentWordData = useMemo(() => words[currentIndex] || null, [words, currentIndex]);
  const currentWord = useMemo(() => (currentWordData?.word || '').trim(), [currentWordData]);

  // Auto-play audio when word changes
  useEffect(() => {
    if (!currentWordData || isFinished || !autoPlayAudio) return;
    playWordAudio(currentWordData.media?.url, currentWordData.word);
  }, [currentIndex, currentWordData, isFinished, autoPlayAudio]);

  // Preload next word's audio into browser cache for 0ms transition
  useEffect(() => {
    const nextItem = words[currentIndex + 1];
    if (nextItem?.media?.url) {
      preloadAudio(nextItem.media.url);
    }
  }, [currentIndex, words]);

  const toggleAutoPlay = () => {
    setAutoPlayAudio((prev) => {
      const next = !prev;
      localStorage.setItem('ieltstrain_typing_autoplay', String(next));
      return next;
    });
  };

  const playCurrentAudio = () => {
    if (!currentWordData) return;
    playWordAudio(currentWordData.media?.url, currentWordData.word);
  };

  // Normalize Unicode non-breaking spaces
  const normalizeInput = (str) => {
    return str.replace(/[  -​  　]/g, ' ');
  };

  const handleKeyDown = (e) => {
    // Backtick key (`) triggers audio replay without losing input focus
    if (e.key === '`') {
      e.preventDefault();
      playCurrentAudio();
    }
  };

  const handleInputChange = (e) => {
    if (isFinished) return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    const raw = e.target.value;
    const input = normalizeInput(raw);
    setUserInput(input);

    // Calculate accuracy for current input vs target word prefix
    let correctChars = 0;
    let hasMismatch = false;

    for (let i = 0; i < input.length; i++) {
      if (input[i] === currentWord[i]) {
        correctChars++;
      } else {
        hasMismatch = true;
      }
    }

    if (hasMismatch && currentWordData) {
      setMistakeWordMap((prev) => ({
        ...prev,
        [currentWordData._id || currentWord]: currentWordData
      }));
    }

    const currentAcc = input.length > 0 ? Math.round((correctChars / input.length) * 100) : 100;
    setAccuracy(currentAcc);

    // Calculate WPM: Standard 5 chars = 1 word
    const timeElapsedMinutes = (Date.now() - (startTime || Date.now())) / 1000 / 60;
    if (timeElapsedMinutes > 0.005) {
      const calcWpm = Math.round((input.length / 5) / timeElapsedMinutes);
      setWpm(calcWpm);
    }

    // Exact match: advance to next word after 180ms
    if (input === currentWord) {
      setTimeout(() => {
        if (currentIndex < words.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setUserInput('');
          setStartTime(null);
          // Persist progress immediately!
          saveTopicProgress(selectedTopic, nextIndex, words.length);

          // Background sync to backend every 10 words if authenticated
          if (isAuthenticated && nextIndex % 10 === 0) {
            syncBatchToBackend(nextIndex);
          }
        } else {
          setIsFinished(true);
          saveTopicProgress(selectedTopic, words.length, words.length, true);
          onCompleteSession();
        }
      }, 180);
    }
  };

  // Submit background batch or final session stats to backend
  const syncBatchToBackend = async (upToIndex) => {
    if (!isAuthenticated) return;
    try {
      const mistakeKeys = Object.keys(mistakeWordMap);
      const batchWords = words.slice(Math.max(0, upToIndex - 10), upToIndex);
      const results = batchWords.map((w) => ({
        vocabId: w._id,
        isCorrect: !mistakeKeys.includes(w._id) && !mistakeKeys.includes(w.word)
      }));

      await api.post('/learning/typing-session', {
        topic: selectedTopic,
        wpm,
        accuracy,
        results
      });
    } catch (err) {
      console.warn('[Sync Typing Batch Error]:', err.message);
    }
  };

  const onCompleteSession = async () => {
    if (!isAuthenticated) return;
    setSavingSession(true);
    try {
      const mistakeKeys = Object.keys(mistakeWordMap);
      const results = words.map((w) => ({
        vocabId: w._id,
        isCorrect: !mistakeKeys.includes(w._id) && !mistakeKeys.includes(w.word)
      }));

      await api.post('/learning/typing-session', {
        topic: selectedTopic,
        wpm,
        accuracy,
        results
      });
      setSessionSaved(true);
    } catch (err) {
      console.warn('[Save Typing Session Warning]:', err.message);
    } finally {
      setSavingSession(false);
    }
  };

  const topicOptions = useMemo(() => {
    const progressMap = getSavedProgressMap();
    return topics.map((t) => {
      const saved = progressMap[t.topic];
      const savedIndex = saved?.currentIndex || 0;
      const pct = t.count > 0 && savedIndex > 0 ? ` · ${Math.round((savedIndex / t.count) * 100)}%` : '';
      return {
        value: t.topic,
        label: `${t.topic.replace(/-/g, ' ').toUpperCase()} (${t.count} từ${pct})`
      };
    });
  }, [topics, currentIndex]);

  const progressPercent = words.length > 0 ? Math.round(((currentIndex + 1) / words.length) * 100) : 0;

  return (
    <div className="container" style={{ maxWidth: 900, paddingTop: 16, paddingBottom: 40 }}>
      {/* ─── Top Control Bar ─── */}
      <div className="row-between" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Workspace</span>
          </button>
          <div>
            <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Keyboard size={20} style={{ color: 'var(--color-accent)' }} />
              <span>Phòng Luyện Gõ Học Thuật (Typing Drill)</span>
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: 13, margin: '2px 0 0' }}>
              Rèn phản xạ chính tả & muscle memory. Tiến trình gõ của bạn được tự động lưu lại liên tục.
            </p>
          </div>
        </div>

        {/* Topic Selector & Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            className="input-select"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{ width: 'auto', minWidth: 200, fontSize: 13, padding: '7px 12px' }}
          >
            {topicOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            className="btn btn-secondary"
            onClick={toggleAutoPlay}
            title={autoPlayAudio ? 'Tắt tự động phát âm' : 'Bật tự động phát âm'}
            style={{ padding: '8px 10px' }}
          >
            {autoPlayAudio ? (
              <Volume2 size={16} style={{ color: 'var(--color-accent)' }} />
            ) : (
              <VolumeX size={16} style={{ color: 'var(--color-ink-muted)' }} />
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={resetState}
            title="Làm lại chủ đề này từ từ số 1"
            style={{ padding: '8px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <RotateCcw size={15} />
            <span style={{ fontSize: 12 }}>Làm lại</span>
          </button>
        </div>
      </div>

      {/* ─── Persistent Progress & Resume Banner ─── */}
      {resumeNotification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--color-rule)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--color-ink)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookmarkCheck size={16} style={{ color: 'var(--color-accent)' }} />
            <span>{resumeNotification}</span>
          </div>
          {currentIndex > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, padding: '2px 8px', color: 'var(--color-ink-muted)' }}
              onClick={resetState}
            >
              Bắt đầu lại từ đầu
            </button>
          )}
        </div>
      )}

      {/* ─── Visual Progress Bar ─── */}
      {words.length > 0 && !isFinished && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
            <span>Tiến trình chủ đề: {currentIndex + 1} / {words.length} từ</span>
            <span>{progressPercent}%</span>
          </div>
          <div
            style={{
              height: 4,
              width: '100%',
              background: 'var(--color-paper-3)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'var(--color-accent)',
                transition: 'width 0.2s ease-out'
              }}
            />
          </div>
        </div>
      )}

      {/* ─── Metrics Header ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20
        }}
      >
        {/* Accuracy */}
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            Độ chính xác
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: accuracy >= 90 ? 'var(--color-moss)' : 'var(--color-brick)'
            }}
          >
            {accuracy}%
          </div>
        </div>

        {/* WPM */}
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            Tốc độ (WPM)
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-accent)'
            }}
          >
            {wpm}
          </div>
        </div>

        {/* Progress Counter */}
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            Vị trí từ
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-ink)'
            }}
          >
            {words.length > 0 ? `${currentIndex + 1} / ${words.length}` : '0 / 0'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-muted)' }}>Đang nạp dữ liệu từ vựng chủ đề...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-muted)' }}>Không có từ vựng nào trong chủ đề này.</p>
        </div>
      ) : isFinished ? (
        /* ─── Completion Banner ─── */
        <div className="card" style={{ padding: 36, textAlign: 'center', border: '1.5px solid var(--color-moss)' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--color-moss-soft)',
              color: 'var(--color-moss)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}
          >
            <Award size={28} />
          </div>
          <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>Chúc mừng! Bạn đã hoàn thành toàn bộ chủ đề.</h2>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14.5, maxWidth: 480, margin: '0 auto 24px' }}>
            Tốc độ trung bình: <strong>{wpm} WPM</strong> · Độ chính xác: <strong>{accuracy}%</strong>.
            {isAuthenticated
              ? sessionSaved
                ? ' Kết quả gõ và thẻ từ vựng đã được đồng bộ vào hệ thống ôn tập.'
                : ' Đang đồng bộ kết quả...'
              : ' Đăng nhập để tự động lưu thẻ từ vào hàng đợi ôn tập Leitner SRS.'}
          </p>

          {Object.keys(mistakeWordMap).length > 0 && (
            <div style={{ marginBottom: 24, textAlign: 'left', maxWidth: 600, margin: '0 auto 24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brick)', marginBottom: 8, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Các từ gõ chưa chính xác ({Object.keys(mistakeWordMap).length}):
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.values(mistakeWordMap).map((m) => (
                  <span
                    key={m._id || m.word}
                    style={{
                      background: 'var(--color-brick-soft)',
                      color: 'var(--color-brick)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12.5,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {m.word} ({m.meaningVi})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={resetState} style={{ gap: 8 }}>
              <RotateCcw size={15} />
              <span>Luyện lại chủ đề từ đầu</span>
            </button>
            {!isAuthenticated && (
              <button className="btn btn-secondary" onClick={onOpenAuth}>
                Đăng nhập để đồng bộ tiến trình
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ─── Active Typing Arena ─── */
        <div
          className="card"
          onClick={() => inputRef.current?.focus()}
          style={{
            position: 'relative',
            padding: '48px 24px 32px',
            textAlign: 'center',
            cursor: 'text',
            minHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            border: '2px solid var(--color-rule)'
          }}
        >
          {/* Top Word Controls: Navigation & Audio */}
          <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={currentIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJumpToWord(currentIndex - 1);
                }}
                title="Từ trước đó"
                style={{ padding: '5px 8px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={currentIndex >= words.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJumpToWord(currentIndex + 1);
                }}
                title="Bỏ qua / Từ tiếp theo"
                style={{ padding: '5px 8px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              className="btn btn-ghost"
              onClick={(e) => {
                e.stopPropagation();
                playCurrentAudio();
              }}
              title="Nghe lại phát âm (hoặc bấm phím `)"
              style={{ padding: 8, borderRadius: '50%' }}
            >
              <Volume2 size={20} style={{ color: 'var(--color-cobalt)' }} />
            </button>
          </div>

          {/* Word Overlay Area */}
          <div
            style={{
              position: 'relative',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 24,
              userSelect: 'none'
            }}
          >
            {/* Background Word (Faint Muted Text) */}
            <div style={{ color: 'var(--color-border-strong)', opacity: 0.65 }}>
              {currentWord}
            </div>

            {/* Feedback Colored Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              {currentWord.split('').map((char, index) => {
                const isTyped = index < userInput.length;
                const isMatch = isTyped && userInput[index] === char;
                return (
                  <span
                    key={index}
                    style={{
                      color: !isTyped
                        ? 'transparent'
                        : isMatch
                        ? 'var(--color-moss)'
                        : 'var(--color-brick)',
                      background: !isTyped || isMatch ? 'transparent' : 'var(--color-brick-soft)',
                      borderRadius: 2
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Invisible Native Input (Captures All Real Keystrokes) */}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'default',
              caretColor: 'transparent'
            }}
          />

          {/* ─── Semantic Hints Card ─── */}
          <div
            style={{
              width: '100%',
              maxWidth: 580,
              borderTop: '1px solid var(--color-rule)',
              paddingTop: 18,
              marginTop: 12
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>
              <span style={{ color: 'var(--color-cobalt)', fontStyle: 'italic', marginRight: 8, fontSize: 14 }}>
                {currentWordData?.pos}
              </span>
              {currentWordData?.meaningVi}
            </div>

            {currentWordData?.ipa && (
              <div className="ipa" style={{ color: 'var(--color-cobalt)', fontSize: 14, marginBottom: 6 }}>
                {currentWordData.ipa}
              </div>
            )}

            {currentWordData?.paraphrases && currentWordData.paraphrases.length > 0 && (
              <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 4 }}>
                <strong>IELTS Paraphrases:</strong> {currentWordData.paraphrases.join(', ')}
              </div>
            )}

            {currentWordData?.exampleSentence && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--color-ink-muted)',
                  fontStyle: 'italic',
                  margin: '8px 0 0',
                  lineHeight: 1.5
                }}
              >
                "{currentWordData.exampleSentence}"
              </p>
            )}
          </div>

          {/* Key shortcut reminder */}
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--color-ink-muted)' }}>
            Gõ trực tiếp trên bàn phím · Bấm phím <kbd className="kbd" style={{ padding: '2px 6px', background: 'var(--color-paper-2)', border: '1px solid var(--color-rule)', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>`</kbd> để nghe lại âm thanh
          </div>
        </div>
      )}
    </div>
  );
}
