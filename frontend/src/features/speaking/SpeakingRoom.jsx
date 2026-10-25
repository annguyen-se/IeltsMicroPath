/* Hallmark · macrostructure: Studio / Workbench · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Studio · design-system: design.md · designed-as-app */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Volume2,
  Clock,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Award,
  FileText
} from 'lucide-react';

const SPEAKING_TOPICS = [
  {
    key: 'travel',
    title: 'Travel & Public Transport',
    part1: [
      'Do you often use public transport in your hometown?',
      'What is your favorite mode of transportation and why?',
      'Did you travel much when you were a child?'
    ],
    part2: {
      topic: 'Describe a memorable journey you made by public transport',
      bullets: [
        'Where you went and when this journey happened',
        'What type of transport you took',
        'Who you traveled with',
        'And explain why this journey was so memorable to you'
      ]
    },
    part3: [
      'How has public transportation changed in your country over the last decade?',
      'Do you think governments should make public transit completely free of charge?',
      'What environmental benefits can cities achieve by reducing private car usage?'
    ]
  },
  {
    key: 'technology',
    title: 'Technology & Artificial Intelligence',
    part1: [
      'What piece of technology do you use most frequently every day?',
      'Do you prefer reading books on paper or on an electronic screen?',
      'How has the internet changed the way you study or work?'
    ],
    part2: {
      topic: 'Describe an artificial intelligence tool or app you find particularly useful',
      bullets: [
        'What the tool is and how you first discovered it',
        'How frequently you use it',
        'What specific tasks it helps you accomplish',
        'And explain how it has impacted your productivity or learning'
      ]
    },
    part3: [
      'Will automated technology replace traditional human educators in the near future?',
      'What ethical concerns arise when AI systems make legal or medical decisions?',
      'How can schools ensure students still develop critical thinking in an automated era?'
    ]
  }
];

export default function SpeakingRoom({ isAuthenticated = false, onOpenAuth }) {
  const navigate = useNavigate();

  const [selectedTopicKey, setSelectedTopicKey] = useState('travel');
  const [activePart, setActivePart] = useState('part1'); // 'part1' | 'part2' | 'part3'

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Part 2 Prep Timer State
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const [prepNotes, setPrepNotes] = useState('');

  const currentTopic = SPEAKING_TOPICS.find((t) => t.key === selectedTopicKey) || SPEAKING_TOPICS[0];

  // Prep timer interval
  useEffect(() => {
    let interval = null;
    if (isPrepRunning && prepSeconds > 0) {
      interval = setInterval(() => {
        setPrepSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPrepRunning, prepSeconds]);

  // Recording timer interval
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordedAudioUrl(null);
    } catch (err) {
      alert('Không thể truy cập microphone. Vui lòng cấp quyền micro trong trình duyệt.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* ─── Top Header ─── */}
      <section className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-head-row" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={14} />
              <span>Workspace</span>
            </button>
            <div>
              <span className="section-kicker">
                <Mic size={13} aria-hidden="true" /> IELTS Speaking Studio (11-14 Phút)
              </span>
              <h1 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>
                IELTS Speaking 3-Part Exam Simulator
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['part1', 'part2', 'part3'].map((p, idx) => (
              <button
                key={p}
                className={`btn btn-sm ${activePart === p ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActivePart(p);
                  setRecordedAudioUrl(null);
                  if (isRecording) stopRecording();
                }}
              >
                Part {idx + 1} ({idx === 0 ? '4-5\'' : idx === 1 ? '3-4\'' : '4-5\''})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Topic Selector ─── */}
      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <label htmlFor="topic-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
            Chủ đề Speaking:
          </label>
          <select
            id="topic-select"
            className="input-select"
            value={selectedTopicKey}
            onChange={(e) => {
              setSelectedTopicKey(e.target.value);
              setRecordedAudioUrl(null);
            }}
            style={{ flex: 1, minWidth: 260, fontSize: 13.5 }}
          >
            {SPEAKING_TOPICS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Part 1: Personal Q&A ─── */}
      {activePart === 'part1' && (
        <div className="card-desk" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <span className="section-kicker" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
              PART 1: FAMILIAR EVERYDAY QUESTIONS (4-5 MINUTES)
            </span>
            <h3 style={{ fontSize: 16, margin: '6px 0 0', fontWeight: 600 }}>
              Giám khảo sẽ hỏi bạn các câu hỏi ngắn quen thuộc về bản thân và đời sống hàng ngày:
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentTopic.part1.map((q, idx) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--color-paper-2)',
                  border: '1px solid var(--color-rule)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: 'var(--color-ink)'
                }}
              >
                Question {idx + 1}: "{q}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Part 2: Cue Card & 1-Minute Prep ─── */}
      {activePart === 'part2' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Cue Card Frame */}
          <div className="card" style={{ padding: 'var(--space-xl)', border: '2px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="section-kicker" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                IELTS SPEAKING PART 2 CUE CARD
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="font-mono text-xs font-bold" style={{ color: prepSeconds === 0 ? 'var(--color-moss)' : 'var(--color-brick)' }}>
                  Chuẩn bị: {prepSeconds}s
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsPrepRunning(!isPrepRunning)}
                >
                  {isPrepRunning ? 'Tạm dừng' : 'Bắt đầu 1 phút'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setPrepSeconds(60);
                    setIsPrepRunning(false);
                  }}
                >
                  Đặt lại
                </button>
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 14px', color: 'var(--color-ink)' }}>
              {currentTopic.part2.topic}
            </h2>

            <div style={{ background: 'var(--color-paper-2)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-rule)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 6 }}>
                You should say:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: 'var(--color-ink)' }}>
                {currentTopic.part2.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Scratchpad Notes */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <label htmlFor="prep-scratchpad" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 6 }}>
              Ghi chú nhanh trong 1 phút chuẩn bị (Quick Keyword Notes):
            </label>
            <textarea
              id="prep-scratchpad"
              className="input-text"
              rows={3}
              placeholder="Ghi nhanh từ khóa, liên từ, ý chính..."
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              style={{ width: '100%', fontSize: 13.5 }}
            />
          </div>
        </div>
      )}

      {/* ─── Part 3: Abstract Discussion ─── */}
      {activePart === 'part3' && (
        <div className="card-desk" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <span className="section-kicker" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
              PART 3: TWO-WAY ABSTRACT DISCUSSION (4-5 MINUTES)
            </span>
            <h3 style={{ fontSize: 16, margin: '6px 0 0', fontWeight: 600 }}>
              Các câu hỏi thảo luận học thuật, mở rộng chuyên sâu từ chủ đề Part 2:
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentTopic.part3.map((q, idx) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--color-paper-2)',
                  border: '1px solid var(--color-rule)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: 'var(--color-ink)'
                }}
              >
                Discussion Question {idx + 1}: "{q}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Audio Recording Console ─── */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
              onClick={isRecording ? stopRecording : startRecording}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isRecording ? <Square size={14} /> : <Mic size={14} />}
              <span>{isRecording ? 'Dừng thu âm' : 'Bắt đầu thu âm câu trả lời'}</span>
            </button>

            {isRecording && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="font-mono text-xs font-bold text-red-600">
                  Đang ghi âm: {formatTimer(recordSeconds)} (Tối đa 2 phút)
                </span>
              </div>
            )}
          </div>

          {recordedAudioUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Nghe lại:</span>
              <audio src={recordedAudioUrl} controls style={{ height: 36 }} />
            </div>
          )}
        </div>
      </div>

      {/* ─── 4 Speaking Band Descriptors Guide ─── */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-ink)' }}>
          4 Tiêu chí chấm điểm IELTS Speaking (Band Descriptors Rubric):
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          <div style={{ padding: 10, background: 'var(--color-paper-2)', borderRadius: 6, border: '1px solid var(--color-rule)' }}>
            <strong style={{ fontSize: 13, color: 'var(--color-accent)' }}>1. Fluency & Coherence</strong>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-ink-muted)' }}>
              Nói lưu loát, độ ngập ngừng tự nhiên, liên kết ý logic bằng discourse markers.
            </p>
          </div>
          <div style={{ padding: 10, background: 'var(--color-paper-2)', borderRadius: 6, border: '1px solid var(--color-rule)' }}>
            <strong style={{ fontSize: 13, color: 'var(--color-accent)' }}>2. Lexical Resource</strong>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-ink-muted)' }}>
              Từ vựng phong phú, collocations tự nhiên, sử dụng chính xác thành ngữ và paraphrase.
            </p>
          </div>
          <div style={{ padding: 10, background: 'var(--color-paper-2)', borderRadius: 6, border: '1px solid var(--color-rule)' }}>
            <strong style={{ fontSize: 13, color: 'var(--color-accent)' }}>3. Grammatical Range</strong>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-ink-muted)' }}>
              Linh hoạt cấu trúc câu phức, câu điều kiện, thời thì và kiểm soát lỗi ngữ pháp.
            </p>
          </div>
          <div style={{ padding: 10, background: 'var(--color-paper-2)', borderRadius: 6, border: '1px solid var(--color-rule)' }}>
            <strong style={{ fontSize: 13, color: 'var(--color-accent)' }}>4. Pronunciation</strong>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-ink-muted)' }}>
              Phát âm rõ ràng từng âm IPA, trọng âm từ, nối âm (linking) và ngữ điệu (intonation).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
