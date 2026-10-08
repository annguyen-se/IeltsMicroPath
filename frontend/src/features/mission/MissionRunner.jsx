import React, { useState } from 'react';
import api from '../../api/apiClient';
import { X, Volume2, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function MissionRunner({ missionPayload, onFinish, onExit }) {
  const [missionPhase, setMissionPhase] = useState(1); // 1: SRS, 2: Mistake, 3: Lesson
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [feedbackState, setFeedbackState] = useState(null); // { isCorrect, correctAnswer, explanation }

  const playAudio = (url) => {
    const audio = new Audio(url || 'https://res.cloudinary.com/ieltstrain/audio/mitigate.mp3');
    audio.play().catch(() => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (_) {}
    });
  };

  const checkAnswer = () => {
    let isCorrect = false;
    let correctAnswer = '';
    let explanation = '';

    if (missionPhase === 1) {
      correctAnswer = 'mitigate';
      isCorrect = userAnswer.trim().toLowerCase() === correctAnswer;
      explanation = "'mitigate' kết hợp tự nhiên với danh từ damage / risk / climate change (Collocation).";
    } else if (missionPhase === 2) {
      correctAnswer = 'harbor';
      isCorrect = userAnswer.trim().toLowerCase() === correctAnswer;
      explanation = "'harbor' nghĩa là cảng biển, bến đỗ an toàn của tàu thuyền.";
    } else {
      correctAnswer = 'Sheep';
      isCorrect = selectedOption === correctAnswer;
      explanation = "'Sheep' phát âm /ʃiːp/ là nguyên âm dài; 'Ship' là /ʃɪp/ với nguyên âm ngắn.";
    }

    setFeedbackState({ isCorrect, correctAnswer, explanation });
  };

  const nextQuestion = async () => {
    setFeedbackState(null);
    setUserAnswer('');
    setSelectedOption('');

    if (missionPhase === 1) {
      setMissionPhase(2);
    } else if (missionPhase === 2) {
      setMissionPhase(3);
    } else {
      // Finish Mission and Submit to Backend
      try {
        await api.post('/learning/submit-session', {
          sessionId: missionPayload?.sessionId || 'sess_demo',
          srsResults: [{ srsId: 'srs_1', isCorrect: true }],
          mistakeResults: [{ mistakeId: 'm_1', isCorrect: true }],
          lessonResults: {
            lessonId: '6705f5a33b4c1e0012345690',
            answers: [{ questionId: 'q_1', userAnswer: 'Sheep', isCorrect: true }]
          }
        });
      } catch (err) {
        console.warn('[Submit Session Offline/Fallback]', err.message);
      }

      onFinish({
        streak: 6,
        reviewedCount: 1,
        scorePercent: 100
      });
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
          <div className="runner-progress-fill" style={{ width: `${(missionPhase / 3) * 100}%` }}></div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
          Giai đoạn {missionPhase} / 3
        </span>
      </div>

      <div className="runner-body">
        {/* Phase 1: SRS Cloze */}
        {missionPhase === 1 && (
          <div>
            <span className="runner-phase-title">PHASE 1: GỢI NHỚ TỪ VỰNG ÔN TẬP (SPACED RETRIEVAL)</span>
            <div className="runner-card">
              <div className="row-between">
                <div>
                  <h2 style={{ fontSize: 26, margin: 0 }}>mitigate</h2>
                  <span className="ipa">/ˈmɪt.ɪ.ɡeɪt/ · verb</span>
                </div>
                <button className="btn btn-secondary" onClick={() => playAudio()}>
                  <Volume2 size={16} />
                  <span>Nghe phát âm</span>
                </button>
              </div>
              <p style={{ marginTop: 12, color: 'var(--fg-muted)', fontSize: 14 }}>
                Nghĩa tiếng Việt: làm giảm bớt, làm dịu bớt mức độ nghiêm trọng
              </p>
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
                  Điền từ vào chỗ trống: "Governments must act swiftly to ________ environmental damage."
                </p>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Nhập từ cần điền..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Mistake Remediation */}
        {missionPhase === 2 && (
          <div>
            <span className="runner-phase-title" style={{ color: 'var(--color-rose)' }}>PHASE 2: KHẮC PHỤC LỖI SAI TRONG QUÁ KHỨ (MISTAKE VAULT)</span>
            <div className="runner-card">
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="phase-badge phase-2" style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} />
                  <span>[ERR_LEX] Lỗi từ vựng</span>
                </span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 600 }}>
                Điền từ còn thiếu: The ship captain steered carefully into the h____. (bến cảng)
              </p>
              <input
                type="text"
                className="input-text"
                placeholder="Gõ từ đã từng làm sai..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Phase 3: Micro-Lesson Question */}
        {missionPhase === 3 && (
          <div>
            <span className="runner-phase-title" style={{ color: 'var(--color-violet)' }}>PHASE 3: BÀI HỌC VI MÔ MỚI (MINIMAL PAIRS: /iː/ vs /ɪ/)</span>
            <div className="runner-card">
              <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
                Từ nào sau đây chứa nguyên âm dài /iː/?
              </p>
              <div className="option-grid">
                {['Ship', 'Sheep', 'Fit', 'Sit'].map((opt) => (
                  <button
                    key={opt}
                    className={`option-btn ${selectedOption === opt ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(opt)}
                  >
                    <span>{opt}</span>
                    <span className="ipa">{opt === 'Sheep' ? '/ʃiːp/' : '/ʃɪp/'}</span>
                  </button>
                ))}
              </div>
            </div>
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
            {!feedbackState.isCorrect && (
              <p style={{ fontWeight: 700, margin: '4px 0' }}>Đáp án đúng: {feedbackState.correctAnswer}</p>
            )}
            <p className="feedback-reason">{feedbackState.explanation}</p>
            <button className="btn btn-primary" onClick={nextQuestion}>
              <span>Tiếp tục (Enter)</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {!feedbackState && (
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
