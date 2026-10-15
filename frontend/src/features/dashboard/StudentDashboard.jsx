import React, { useState } from 'react';
import api from '../../api/apiClient';
import {
  Sparkles,
  Flame,
  Target,
  Zap,
  BookOpen,
  Clock,
  Signal,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  TrendingUp,
  Layers,
  ShieldAlert,
  GraduationCap,
  ArrowUpRight,
  Headphones,
  Mic,
  PenLine,
  AudioLines,
  ChevronRight,
  TextSearch,
  GitBranch,
  Route,
  Check,
  Lock,
  Lightbulb,
  FileText,
  Boxes,
  Keyboard
} from 'lucide-react';
import LeitnerBoxGrid from './LeitnerBoxGrid';

export default function StudentDashboard({
  dashboardData = {},
  srsStats = {},
  isAuthenticated = false,
  onStartMission,
  onSwitchView,
  onOpenAuth
}) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const user = dashboardData.user || {};
  const metrics = dashboardData.metrics || {};
  const dailyStatus = dashboardData.dailyMissionStatus || {};

  const totalSrsCount = Object.values(srsStats).reduce((a, b) => a + Number(b || 0), 0);
  const duration = dailyStatus.estimatedMinutes ? `About ${dailyStatus.estimatedMinutes} min` : '';

  const handleAction = (actionFn) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
    } else {
      actionFn();
    }
  };

  const handleQuickEnroll = async () => {
    try {
      setIsEnrolling(true);
      await api.post('/reviews/enroll-all', {});
      onSwitchView('srs');
    } catch (err) {
      console.warn('Quick enroll error:', err.message);
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 26 }}>
      {/* ─── 1. Welcome Header Section ─── */}
      <section className="home-welcome">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> YOUR IELTS LEARNING SPACE
          </p>
          <h1>Make today count.</h1>
          <p>
            Build your IELTS skills one focused session at a time. Review what matters, fix your weak spots, and keep moving toward your target band.
          </p>
        </div>
        <div className="home-overview">
          {isAuthenticated ? (
            <>
              <div className="home-stat">
                <span className="home-stat-icon" style={{ color: '#d97706', background: '#fff4d9' }}>
                  <Flame size={19} />
                </span>
                <span>
                  <strong>{user.streak ?? 0} days</strong>
                  <small>Learning streak</small>
                </span>
              </div>
              {user.targetBand && (
                <div className="home-stat">
                  <span className="home-stat-icon" style={{ color: '#16805d', background: '#e4f8ef' }}>
                    <Target size={19} />
                  </span>
                  <span>
                    <strong>Band {user.targetBand}</strong>
                    <small>Your target</small>
                  </span>
                </div>
              )}
            </>
          ) : (
            <button className="btn btn-primary" onClick={onOpenAuth} style={{ padding: '9px 16px', fontSize: 13, gap: 6 }}>
              <Lock size={14} />
              <span>Đăng nhập để lưu tiến độ</span>
            </button>
          )}
        </div>
      </section>

      {/* ─── 2. Hero: Daily Mission Card ─── */}
      <section className="card home-hero">
        <div>
          <p className="eyebrow">
            <Zap size={14} /> YOUR NEXT BEST STEP
          </p>
          <h2>{dashboardData.nextLesson ? dashboardData.nextLesson.title : 'One lesson closer to your goal.'}</h2>
          <p className="home-hero-copy">
            {dashboardData.nextLesson
              ? `Bài học tiếp theo trên lộ trình DAG Level ${dashboardData.nextLesson.level}: ${dashboardData.nextLesson.title}. Hoàn thành để mở khóa kiến thức tiếp theo.`
              : 'Pick up with a short, focused activity designed to strengthen your academic reading, vocabulary retention, and error remediation.'}
          </p>
          <div className="lesson-meta" style={{ margin: '16px 0 20px' }}>
            <span className="soft-pill">
              <BookOpen size={13} /> {dashboardData.nextLesson ? dashboardData.nextLesson.skill.toUpperCase() : 'Micro-Lesson'}
            </span>
            {duration && (
              <span className="soft-pill">
                <Clock size={13} /> {duration}
              </span>
            )}
            <span className="soft-pill">
              <Signal size={13} /> Level {dashboardData.nextLesson ? dashboardData.nextLesson.level : (user.currentLevel ?? 0)}
            </span>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => handleAction(onStartMission)}>
            {isAuthenticated ? (
              <>
                <span>Continue learning</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Đăng nhập để bắt đầu học</span>
              </>
            )}
          </button>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <div className="hero-orbit"></div>
          <div className="hero-book">
            <BookOpenCheck size={40} />
          </div>
          <div className="hero-floating one">
            <CheckCircle2 size={15} style={{ color: '#16805d' }} /> Learn by doing
          </div>
          <div className="hero-floating two">
            <TrendingUp size={15} style={{ color: 'var(--color-cobalt)' }} /> Small daily wins
          </div>
        </div>
      </section>

      {/* ─── 3. Today's Learning Plan ─── */}
      <section>
        <div className="home-section-head">
          <div>
            <h2>Today's learning plan</h2>
            <p>A balanced routine: remember, improve, then learn something new.</p>
          </div>
          {dailyStatus.estimatedMinutes && (
            <span className="soft-pill">
              <Clock size={13} /> {dailyStatus.estimatedMinutes} min
            </span>
          )}
        </div>
        <div className="card" style={{ padding: '8px 24px' }}>
          <div className="today-list">
            <div className="today-task">
              <span className="task-icon" style={{ background: '#e4f8ef', color: '#16805d' }}>
                <Layers size={20} />
              </span>
              <div className="task-copy">
                <strong>Review vocabulary</strong>
                <p>Revisit words scheduled for review to strengthen long-term memory.</p>
              </div>
              <span className="task-count">
                {isAuthenticated ? `${metrics.srsDueCount ?? 0} due` : <Lock size={13} style={{ color: 'var(--fg-muted)' }} />}
              </span>
              <button className="mini-link" onClick={() => handleAction(() => onSwitchView('srs'))}>
                Review <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="today-task">
              <span className="task-icon" style={{ background: '#fff0e9', color: '#c85a30' }}>
                <ShieldAlert size={20} />
              </span>
              <div className="task-copy">
                <strong>Repair a past mistake</strong>
                <p>Turn an incorrect answer into a lesson you can remember.</p>
              </div>
              <span className="task-count">
                {isAuthenticated ? `${metrics.unresolvedMistakesCount ?? 0} traps` : <Lock size={13} style={{ color: 'var(--fg-muted)' }} />}
              </span>
              <button className="mini-link" onClick={() => handleAction(() => onSwitchView('mistakes'))}>
                Fix <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="today-task">
              <span className="task-icon" style={{ background: '#e8edff', color: 'var(--color-cobalt)' }}>
                <GraduationCap size={20} />
              </span>
              <div className="task-copy">
                <strong>Learn one new skill</strong>
                <p>Continue to a lesson that matches your current learning level.</p>
              </div>
              <span className="task-count">Lesson</span>
              <button className="mini-link" onClick={() => handleAction(onStartMission)}>
                Start <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Two-Column Dashboard Grid ─── */}
      <div className="home-grid">
        <div className="home-column">
          {/* Skill Focus Section */}
          <section>
            <div className="home-section-head">
              <div>
                <h2>Choose your focus</h2>
                <p>Practice the skill you want to improve today.</p>
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => onSwitchView('lessons')}
              >
                <span>All lessons</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="skill-grid">
              <button className="skill-card" onClick={() => onSwitchView('typing')}>
                <span className="skill-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <Keyboard size={20} />
                </span>
                <strong>Typing Drill</strong>
                <p>Luyện gõ từ vựng tốc độ cao, phản xạ chính tả & muscle memory.</p>
                <span className="skill-link">
                  Vào phòng luyện gõ <ArrowUpRight size={13} />
                </span>
              </button>
              <button className="skill-card" onClick={() => onSwitchView('vocabulary')}>
                <span className="skill-icon" style={{ background: '#e4f8ef', color: '#16805d' }}>
                  <Boxes size={20} />
                </span>
                <strong>Vocabulary Hub</strong>
                <p>Ôn tập ngắt quãng 5 Hộp Leitner & Khám phá từ vựng theo chủ đề.</p>
                <span className="skill-link">
                  Mở phòng từ vựng <ArrowUpRight size={13} />
                </span>
              </button>
              <button className="skill-card" onClick={() => onSwitchView('lessons?skill=listening')}>
                <span className="skill-icon" style={{ background: '#e8edff', color: '#315bea' }}>
                  <Headphones size={20} />
                </span>
                <strong>Listening</strong>
                <p>Train your ear with audio and dictation practice.</p>
                <span className="skill-link">
                  Explore lessons <ArrowUpRight size={13} />
                </span>
              </button>
              <button className="skill-card" onClick={() => onSwitchView('lessons?skill=reading')}>
                <span className="skill-icon" style={{ background: '#e5f8f5', color: '#078575' }}>
                  <BookOpen size={20} />
                </span>
                <strong>Reading Micro-Practice</strong>
                <p>Luyện đọc bài ngắn, bẫy paraphrase và câu hỏi IELTS thực chiến.</p>
                <span className="skill-link">
                  Vào phòng luyện đọc <ArrowUpRight size={13} />
                </span>
              </button>
              <button className="skill-card" onClick={() => onSwitchView('lessons?skill=speaking')}>
                <span className="skill-icon" style={{ background: '#f3e8ff', color: '#8b42cb' }}>
                  <Mic size={20} />
                </span>
                <strong>Speaking</strong>
                <p>Strengthen pronunciation and spoken foundations.</p>
                <span className="skill-link">
                  Explore lessons <ArrowUpRight size={13} />
                </span>
              </button>
              <button className="skill-card" onClick={() => onSwitchView('writing')}>
                <span className="skill-icon" style={{ background: '#fff2d9', color: '#a36a00' }}>
                  <PenLine size={20} />
                </span>
                <strong>Writing (100 Sentences)</strong>
                <p>Luyện dịch 100 câu mẫu theo 12 cấu trúc ngữ pháp học thuật.</p>
                <span className="skill-link">
                  Vào phòng luyện dịch <ArrowUpRight size={13} />
                </span>
              </button>
              <button className="skill-card" onClick={() => onSwitchView('lessons?skill=grammar')}>
                <span className="skill-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                  <FileText size={20} />
                </span>
                <strong>Grammar</strong>
                <p>Make sentence patterns more accurate and flexible.</p>
                <span className="skill-link">
                  Explore lessons <ArrowUpRight size={13} />
                </span>
              </button>
              <button className="skill-card" onClick={() => onSwitchView('lessons?skill=phonetics')}>
                <span className="skill-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  <AudioLines size={20} />
                </span>
                <strong>Pronunciation</strong>
                <p>Learn IPA and sound distinctions for clearer speech.</p>
                <span className="skill-link">
                  Explore lessons <ArrowUpRight size={13} />
                </span>
              </button>
            </div>
          </section>

          {/* Vocabulary Memory (Leitner 5-box Preview) */}
          <section className="card">
            <div className="home-section-head">
              <div>
                <h2>
                  <Layers size={19} style={{ color: 'var(--color-cobalt)', verticalAlign: -3 }} /> Vocabulary memory
                </h2>
                <p>Spaced repetition helps you remember words for longer.</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleAction(() => onSwitchView('srs'))}
                style={{ padding: '7px 12px', fontSize: 12 }}
              >
                Open review <ChevronRight size={13} />
              </button>
            </div>
            {isAuthenticated && totalSrsCount > 0 ? (
              <div>
                <LeitnerBoxGrid srsStats={srsStats} />
                {metrics.srsDueCount === 0 && (
                  <p style={{ marginTop: 12, fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>
                    Hôm nay không còn từ nào đến hạn ôn (Bạn có tổng cộng {totalSrsCount} từ trong 5 hộp).
                  </p>
                )}
              </div>
            ) : isAuthenticated ? (
              <div>
                <LeitnerBoxGrid srsStats={{ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }} />
                <div className="lock-banner" style={{ marginTop: 14 }}>
                  <div>
                    <strong>Chưa có từ vựng nào trong 5 Hộp Leitner</strong>
                    <p>Hệ thống đã có sẵn từ vựng trong kho. Bấm để nạp vào Hộp 1 và học ngay!</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '7px 14px' }}
                    onClick={handleQuickEnroll}
                    disabled={isEnrolling}
                  >
                    {isEnrolling ? 'Đang nạp...' : 'Nạp vào Hộp 1 ngay'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <LeitnerBoxGrid srsStats={{ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }} />
                <div className="lock-banner" style={{ marginTop: 14 }}>
                  <div>
                    <strong>Đăng nhập để lưu từ vựng</strong>
                    <p>Các từ bạn học sẽ tự động được xếp vào 5 hộp Leitner để ôn tập ngắt quãng.</p>
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={onOpenAuth}>
                    Đăng nhập
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <aside className="home-column">
          {/* Mistakes to revisit */}
          <section className="card">
            <div className="home-section-head">
              <div>
                <h2>
                  <ShieldAlert size={19} style={{ color: 'var(--color-rose)', verticalAlign: -3 }} /> Mistakes to revisit
                </h2>
                <p>Learn from errors instead of repeating them.</p>
              </div>
            </div>

            {isAuthenticated && Array.isArray(dashboardData.recentMistakes) && dashboardData.recentMistakes.length > 0 ? (
              dashboardData.recentMistakes.map((m) => (
                <div key={m.id} className="focus-row">
                  <span className="task-icon" style={{ background: '#fff0e9', color: '#c85a30' }}>
                    <TextSearch size={19} />
                  </span>
                  <div className="focus-copy">
                    <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.prompt}
                    </strong>
                    {m.userWrongAnswer ? (
                      <p>Bạn đã chọn sai: "{m.userWrongAnswer}"</p>
                    ) : (
                      <p>Bẫy câu hỏi cần khắc phục</p>
                    )}
                  </div>
                  <span className={`pill ${m.errorCode === 'ERR_SYN' ? 'pill-violet' : 'pill-err'}`}>
                    {m.errorCode}
                  </span>
                </div>
              ))
            ) : isAuthenticated ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
                <CheckCircle2 size={24} style={{ color: 'var(--color-emerald)', margin: '0 auto 6px', display: 'block' }} />
                <span>Không có lỗi sai nào chưa khắc phục!</span>
              </div>
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
                Đăng nhập để xem danh sách lỗi sai cần khắc phục.
              </div>
            )}

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => handleAction(() => onSwitchView('mistakes'))}
            >
              Open mistake review <ArrowRight size={15} />
            </button>
          </section>

          {/* Your learning path (DAG Node) */}
          <section className="card">
            <div className="home-section-head">
              <div>
                <h2>
                  <Route size={19} style={{ color: 'var(--color-emerald)', verticalAlign: -3 }} /> Your learning path
                </h2>
                <p>Move forward as you master each foundation.</p>
              </div>
            </div>

            <div className="stack" style={{ gap: 10 }}>
              {Array.isArray(dashboardData.learningPath) && dashboardData.learningPath.length > 0 ? (
                dashboardData.learningPath.map((node) => (
                  <div key={node.id} className={`dag-node ${node.status}`}>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          color:
                            node.status === 'mastered'
                              ? 'var(--color-emerald)'
                              : node.status === 'current'
                              ? 'var(--color-cobalt)'
                              : 'var(--fg-muted)',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}
                      >
                        {node.skill || 'LESSON'} {node.topic ? `· ${node.topic}` : ''}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                        {node.title}
                      </div>
                    </div>
                    {node.status === 'mastered' && (
                      <span className="pill pill-success">
                        <Check size={12} /> Done
                      </span>
                    )}
                    {node.status === 'current' && (
                      <span className="pill pill-cobalt">
                        In progress
                      </span>
                    )}
                    {node.status === 'locked' && (
                      <span className="pill pill-muted">
                        <Lock size={12} /> Locked
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
                  Chưa có bài học nào được cấu hình cho Level {user.currentLevel ?? 0}.
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-muted)' }}>
              {isAuthenticated ? (
                `Mastered ${metrics.masteredNodesCount ?? 0} / ${metrics.totalLevelNodesCount ?? 0} prerequisite nodes (${metrics.levelProgressPercent ?? 0}%)`
              ) : (
                'Đăng nhập để theo dõi cây tiến trình học tập cá nhân.'
              )}
            </div>
          </section>

          {/* Small reminder card */}
          <section className="card home-note">
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--color-cobalt)',
                marginBottom: 7,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Lightbulb size={14} /> A small reminder
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>
              Consistency beats cramming. A focused 15-minute session is still progress — keep the habit realistic and repeatable.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
