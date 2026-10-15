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
  Sparkles,
  BookOpen,
  ArrowLeft,
  Flame,
  Award
} from 'lucide-react';

export default function TypingDrill({ isAuthenticated = false, onOpenAuth }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(() => {
    return localStorage.getItem('ieltstrain_typing_topic') || 'listening-179';
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

  // 1. Fetch available vocabulary topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/vocabulary/topics');
        const list = res?.topics || [];
        setTopics(list);
        if (list.length > 0 && !list.some((t) => t.topic === selectedTopic)) {
          setSelectedTopic(list[0].topic);
        }
      } catch (err) {
        console.warn('[Fetch Topics Warning]:', err.message);
      }
    };
    fetchTopics();
  }, []);

  // 2. Fetch words for the selected topic
  useEffect(() => {
    if (!selectedTopic) return;
    localStorage.setItem('ieltstrain_typing_topic', selectedTopic);

    const fetchWords = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/vocabulary?topic=${encodeURIComponent(selectedTopic)}&limit=500`);
        const items = res?.items || [];
        setWords(items);
        resetState();
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
    setCurrentIndex(0);
    setUserInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
    setMistakeWordMap({});
    setSessionSaved(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
          setCurrentIndex((prev) => prev + 1);
          setUserInput('');
          setStartTime(null);
        } else {
          setIsFinished(true);
          onCompleteSession();
        }
      }, 180);
    }
  };

  // Submit session stats to backend
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
    return topics.map((t) => ({
      value: t.topic,
      label: `${t.topic.replace(/-/g, ' ').toUpperCase()} (${t.count} từ)`
    }));
  }, [topics]);

  return (
    <div className="container" style={{ maxWidth: 900, paddingTop: 16, paddingBottom: 40 }}>
      {/* ─── Top Control Bar ─── */}
      <div className="row-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
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
              <Keyboard size={24} style={{ color: 'var(--color-cobalt)' }} />
              <span>Luyện gõ từ vựng (Typing Drill)</span>
            </h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: 13, margin: '2px 0 0' }}>
              Tăng tốc độ gõ máy, cải thiện trí nhớ vận động (muscle memory) & phản xạ chính tả IELTS.
            </p>
          </div>
        </div>

        {/* Topic Selector & Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            className="input"
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
            title={autoPlayAudio ? 'Tắt tự động phát âm thanh' : 'Bật tự động phát âm thanh'}
            style={{ padding: '8px 10px' }}
          >
            {autoPlayAudio ? (
              <Volume2 size={16} style={{ color: 'var(--color-cobalt)' }} />
            ) : (
              <VolumeX size={16} style={{ color: 'var(--fg-muted)' }} />
            )}
          </button>

          <button className="btn btn-secondary" onClick={resetState} title="Luyện tập lại từ đầu" style={{ padding: '8px 10px' }}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

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
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-muted)', fontWeight: 700 }}>
            Độ chính xác
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: accuracy >= 90 ? 'var(--color-emerald)' : 'var(--color-rose)'
            }}
          >
            {accuracy}%
          </div>
        </div>

        {/* WPM */}
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-muted)', fontWeight: 700 }}>
            Tốc độ (WPM)
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-cobalt)'
            }}
          >
            {wpm}
          </div>
        </div>

        {/* Progress */}
        <div className="card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-muted)', fontWeight: 700 }}>
            Tiến độ
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)'
            }}
          >
            {words.length > 0 ? `${currentIndex + 1} / ${words.length}` : '0 / 0'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Đang nạp danh sách từ vựng...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Không có từ vựng nào trong chủ đề này.</p>
        </div>
      ) : isFinished ? (
        /* ─── Completion Banner ─── */
        <div className="card" style={{ padding: 36, textAlign: 'center', border: '2px solid var(--color-emerald)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--color-emerald-soft)',
              color: 'var(--color-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}
          >
            <Award size={32} />
          </div>
          <h2 style={{ fontSize: 24, margin: '0 0 8px' }}>Xuất sắc! Bạn đã hoàn thành chủ đề 🎉</h2>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15, maxWidth: 500, margin: '0 auto 24px' }}>
            Tốc độ trung bình: <strong>{wpm} WPM</strong> · Độ chính xác: <strong>{accuracy}%</strong>.
            {isAuthenticated
              ? sessionSaved
                ? ' Lịch sử bài tập và từ cần ôn đã được ghi nhận vào hệ thống SRS.'
                : ' Đang lưu phiên học...'
              : ' Đăng nhập để tự động lưu từ khó vào lộ trình ôn tập Leitner 5 hộp.'}
          </p>

          {Object.keys(mistakeWordMap).length > 0 && (
            <div style={{ marginBottom: 24, textAlign: 'left', maxWidth: 600, margin: '0 auto 24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-rose)', marginBottom: 8 }}>
                Các từ đã gõ nhầm ({Object.keys(mistakeWordMap).length} từ):
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.values(mistakeWordMap).map((m) => (
                  <span
                    key={m._id || m.word}
                    style={{
                      background: 'var(--color-rose-soft)',
                      color: 'var(--color-rose)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
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
              <RotateCcw size={16} />
              <span>Luyện lại chủ đề này</span>
            </button>
            {!isAuthenticated && (
              <button className="btn btn-secondary" onClick={onOpenAuth}>
                Đăng nhập để lưu tiến độ
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
            border: '2px solid var(--color-cobalt-border)'
          }}
        >
          {/* Audio Replay Button */}
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
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
            <div style={{ color: 'var(--border-strong)', opacity: 0.65 }}>
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
                        ? 'var(--color-emerald)'
                        : 'var(--color-rose)',
                      background: !isTyped || isMatch ? 'transparent' : 'var(--color-rose-soft)',
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
              borderTop: '1px solid var(--border)',
              paddingTop: 18,
              marginTop: 12
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
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
              <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 4 }}>
                <strong>Từ đồng nghĩa IELTS:</strong> {currentWordData.paraphrases.join(', ')}
              </div>
            )}

            {currentWordData?.exampleSentence && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--fg-muted)',
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
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--fg-muted)' }}>
            Gõ trực tiếp trên bàn phím · Bấm phím <kbd className="kbd">`</kbd> để nghe lại âm thanh
          </div>
        </div>
      )}
    </div>
  );
}
