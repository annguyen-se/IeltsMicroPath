/* Hallmark · macrostructure: Workbench · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import {
  PenLine,
  Target,
  ArrowRight,
  BookOpen,
  Clock,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  Boxes,
  Keyboard,
  Compass,
  Lock,
  BookmarkCheck,
  BookMarked,
} from 'lucide-react';
import LeitnerBoxGrid from './LeitnerBoxGrid';

export default function StudentDashboard({
  dashboardData = {},
  srsStats = {},
  isAuthenticated = false,
  onStartMission,
  onSwitchView,
  onOpenAuth,
}) {
  const user = dashboardData.user || {};
  const metrics = dashboardData.metrics || {};
  const dailyStatus = dashboardData.dailyMissionStatus || {};
  const nextLesson = dashboardData.nextLesson;

  const totalSrsCount = Object.values(srsStats).reduce((a, b) => a + Number(b || 0), 0);
  const srsDue = metrics.srsDueCount ?? 0;
  const mistakesDue = metrics.unresolvedMistakesCount ?? 0;
  const progressPercent = metrics.levelProgressPercent ?? 0;

  const handleAction = (actionFn) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
    } else {
      actionFn();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {/* ─── 1. Academic Orientation & Workspace Welcome ─── */}
      <section className='section-head'>
        <span className='section-kicker'>
          <Compass size={13} aria-hidden='true' /> Guided Writing Workspace
        </span>
        <div className='section-head-row'>
          <div>
            <h1 className='section-title'>
              {isAuthenticated && user.email
                ? `Welcome back. Let's refine your academic writing today.`
                : `Your dedicated IELTS writing coach workspace.`}
            </h1>
            <p className='section-desc' style={{ marginTop: 'var(--space-2xs)' }}>
              Each session is structured as a focused 1-on-1 tutorial: activate core vocabulary, repair recent grammar
              traps, and complete a targeted writing drill with instant diagnostic feedback.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <div className='card' style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Target size={15} style={{ color: 'var(--color-accent)' }} aria-hidden='true' />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                  Target: <strong>Band {user.targetBand || '7.0+'}</strong> · Level {user.currentLevel ?? 1} (
                  {progressPercent}%)
                </span>
              </div>
            ) : (
              <button className='btn btn-secondary btn-sm' onClick={onOpenAuth}>
                <Lock size={13} aria-hidden='true' />
                <span>Sign in to sync progress</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. Primary Guided Desk: Today's 3-Stage Mission ─── */}
      <section className='tutor-session-desk'>
        <div className='tutor-desk-badge'>
          <BookmarkCheck size={13} aria-hidden='true' /> Today's Guided Tutorial · 3-Stage Practice
        </div>
        <h2 className='tutor-headline'>
          {nextLesson ? nextLesson.title : 'Argument Development & Cohesive Devices (Task 2)'}
        </h2>
        <p className='tutor-lede'>
          {nextLesson
            ? `Next milestone on your Level ${nextLesson.level} curriculum DAG. Complete this session to unlock subsequent modules.`
            : 'A focused 20–25 minute writing tutorial: activate vocabulary recall, dissect syntax traps, and draft a key sentence translation.'}
        </p>

        {/* 3 Sequential Milestones */}
        <div className='routine-steps'>
          <div className='routine-step-card'>
            <div className='routine-step-num'>
              <span>01</span>
              <span>· Lexical Recall</span>
            </div>
            <div className='routine-step-title'>Spaced Repetition (SRS)</div>
            <div className='routine-step-meta'>
              {isAuthenticated
                ? `${srsDue} lexical items scheduled in Leitner boxes`
                : 'Consolidate academic collocations'}
            </div>
          </div>

          <div className='routine-step-card'>
            <div className='routine-step-num'>
              <span>02</span>
              <span>· Error Remediation</span>
            </div>
            <div className='routine-step-title'>Target Recent Mistakes</div>
            <div className='routine-step-meta'>
              {isAuthenticated
                ? `${mistakesDue} syntax traps requiring attention`
                : 'Review common grammatical pitfalls'}
            </div>
          </div>

          <div className='routine-step-card'>
            <div className='routine-step-num'>
              <span>03</span>
              <span>· Core Writing Drill</span>
            </div>
            <div className='routine-step-title'>
              {nextLesson ? `${nextLesson.skill.toUpperCase()} Level ${nextLesson.level}` : 'Writing Micro-Practice'}
            </div>
            <div className='routine-step-meta'>Sentence construction with instant feedback</div>
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button className='btn btn-primary btn-lg' onClick={() => handleAction(onStartMission)}>
            {isAuthenticated ? (
              <>
                <span>Start Guided Session Now</span>
                <ArrowRight size={16} aria-hidden='true' />
              </>
            ) : (
              <>
                <Lock size={15} aria-hidden='true' />
                <span>Sign in to Start Learning</span>
              </>
            )}
          </button>
          <button className='btn btn-secondary' onClick={() => onSwitchView('lessons')}>
            <BookMarked size={15} aria-hidden='true' />
            <span>Browse Curriculum</span>
          </button>
          {dailyStatus.estimatedMinutes && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--color-ink-muted)',
                fontFamily: 'var(--font-mono)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
              <Clock size={13} aria-hidden='true' /> Est. {dailyStatus.estimatedMinutes} minutes
            </span>
          )}
        </div>
      </section>

      {/* ─── 3. Practice Workstations (Dedicated Micro-Drills) ─── */}
      <section>
        <div className='section-head'>
          <span className='section-kicker'>
            <PenLine size={13} aria-hidden='true' /> Specialized Practice Benches
          </span>
          <div className='section-head-row'>
            <div>
              <h2 className='section-title'>Select Your Focus Area</h2>
              <p className='section-desc'>
                Dedicated micro-drills to strengthen sentence precision, discourse flow, and lexical recall.
              </p>
            </div>
            <button className='btn btn-ghost btn-sm' onClick={() => onSwitchView('lessons')}>
              <span>All Curriculum</span>
              <ArrowRight size={13} aria-hidden='true' />
            </button>
          </div>
        </div>

        <div className='workstation-grid'>
          {/* Station 1: Writing Drill */}
          <div
            className='workstation-card'
            role='button'
            tabIndex={0}
            onClick={() => onSwitchView('writing')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('writing')}>
            <div>
              <div className='workstation-icon-wrap' aria-hidden='true'>
                <PenLine size={18} />
              </div>
              <div className='workstation-title' style={{ marginTop: 'var(--space-sm)' }}>
                Sentence Translation Drill (100 Sentences)
              </div>
              <p className='workstation-desc'>
                Practice English translation across 12 core academic grammar patterns: participle clauses, conditionals,
                and inversion.
              </p>
            </div>
            <div className='workstation-footer'>
              <span>Open Translation Room</span>
              <ArrowUpRight size={14} aria-hidden='true' />
            </div>
          </div>

          {/* Station 2: Reading & Paraphrase Studio */}
          <div
            className='workstation-card'
            role='button'
            tabIndex={0}
            onClick={() => onSwitchView('lessons?skill=reading')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('lessons?skill=reading')}>
            <div>
              <div className='workstation-icon-wrap' aria-hidden='true'>
                <BookOpen size={18} />
              </div>
              <div className='workstation-title' style={{ marginTop: 'var(--space-sm)' }}>
                Reading & Paraphrase Studio
              </div>
              <p className='workstation-desc'>
                Examine Band 8.0+ model passages, identify lexical substitution traps, and build academic reading
                stamina.
              </p>
            </div>
            <div className='workstation-footer'>
              <span>Explore Paraphrases</span>
              <ArrowUpRight size={14} aria-hidden='true' />
            </div>
          </div>

          {/* Station 3: Vocabulary Hub & SRS */}
          <div
            className='workstation-card'
            role='button'
            tabIndex={0}
            onClick={() => onSwitchView('vocabulary')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('vocabulary')}>
            <div>
              <div className='workstation-icon-wrap' aria-hidden='true'>
                <Boxes size={18} />
              </div>
              <div className='workstation-title' style={{ marginTop: 'var(--space-sm)' }}>
                Lexical Bank & Leitner Boxes
              </div>
              <p className='workstation-desc'>
                Intelligent spaced repetition. Consolidate academic collocations for environmental, technological, and
                educational topics into long-term memory.
              </p>
            </div>
            <div className='workstation-footer'>
              <span>Open Lexical Bank</span>
              <ArrowUpRight size={14} aria-hidden='true' />
            </div>
          </div>

          {/* Station 4: Typing Drill */}
          <div
            className='workstation-card'
            role='button'
            tabIndex={0}
            onClick={() => onSwitchView('typing')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('typing')}>
            <div>
              <div className='workstation-icon-wrap' aria-hidden='true'>
                <Keyboard size={18} />
              </div>
              <div className='workstation-title' style={{ marginTop: 'var(--space-sm)' }}>
                Academic Typing Drill
              </div>
              <p className='workstation-desc'>
                Build keyboard muscle memory for spelling accuracy, reducing cognitive load during computer-delivered
                tests.
              </p>
            </div>
            <div className='workstation-footer'>
              <span>Launch Typing Drill</span>
              <ArrowUpRight size={14} aria-hidden='true' />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Progress Vault & Tutor Marginalia ─── */}
      <section className='workbench-grid'>
        {/* Left Column: Memory Vault */}
        <div className='card'>
          <div className='section-head' style={{ marginBottom: 'var(--space-sm)' }}>
            <span className='section-kicker'>
              <Layers size={13} aria-hidden='true' /> Long-Term Retention
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <h2 className='section-title' style={{ fontSize: 'var(--text-lg)' }}>
                5-Box Leitner Memory Vault
              </h2>
              <button className='btn btn-secondary btn-sm' onClick={() => handleAction(() => onSwitchView('srs'))}>
                <span>Open Review</span>
                <ArrowRight size={12} aria-hidden='true' />
              </button>
            </div>
            <p className='section-desc'>
              Spaced repetition schedule: words achieve durable mastery only after cycling successfully through all five
              boxes.
            </p>
          </div>

          {isAuthenticated && totalSrsCount > 0 ? (
            <div>
              <LeitnerBoxGrid srsStats={srsStats} />
              {srsDue === 0 && (
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: 'var(--color-ink-muted)',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                  }}>
                  ✓ All scheduled cards reviewed for today ({totalSrsCount} total words active in your boxes).
                </p>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: 'var(--color-paper-2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--color-rule)',
              }}>
              <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                {isAuthenticated
                  ? 'No cards currently in your Leitner boxes. Open a curriculum lesson to enroll new academic collocations.'
                  : 'Sign in to monitor vocabulary progression across the five memory compartments.'}
              </p>
              {!isAuthenticated && (
                <button className='btn btn-secondary btn-sm' style={{ marginTop: 10 }} onClick={onOpenAuth}>
                  Sign in Now
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Tutor Marginalia Note (With Pedagogical Vietnamese contrastive guidance) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className='tutor-note-card'>
            <div className='tutor-note-header'>
              <BookOpen size={13} aria-hidden='true' /> Writing Coach Marginalia · L1 Contrast Note
            </div>
            <p className='tutor-note-body'>
              "In academic IELTS Writing, cohesion is not achieved by chaining discourse markers like 'Moreover' or
              'Furthermore' at the start of every sentence. Vietnamese learners often tend to translate connectives such
              as 'Hơn nữa' or 'Ngoài ra' literally and place them at the beginning of sentences, resulting in a
              mechanical, list-like style. Instead, try using participle clauses (e.g., 'Having analyzed the economic
              trends...') or embedding adverbs within the predicate for a more natural, Band 7.5+ discourse flow."
            </p>
          </div>

          <div
            className='card'
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
            <div>
              <span className='section-kicker' style={{ color: 'var(--color-brick)', marginBottom: 2 }}>
                <ShieldAlert size={13} aria-hidden='true' /> Error Remediation
              </span>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)' }}>Personal Mistake Vault</div>
              <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 2 }}>
                {isAuthenticated
                  ? `${mistakesDue} syntax traps logged for remediation`
                  : 'Turn incorrect submissions into memorable lessons'}
              </p>
            </div>
            <button className='btn btn-secondary btn-sm' onClick={() => handleAction(() => onSwitchView('mistakes'))}>
              <span>Open Vault</span>
              <ArrowRight size={13} aria-hidden='true' />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 5. Academic Colophon Footer ─── */}
      <footer className='app-footer'>
        <div className='app-footer-left'>
          <span>IELTS Writing Hub · Writing Studio & Clinic</span>
          <span>·</span>
          <span>Guided Academic Learning Platform</span>
        </div>
        <div className='app-footer-links'>
          <a href='#/lessons'>Curriculum</a>
          <a href='#/writing'>100 Sentences</a>
          <a href='#/vocabulary'>Lexical Bank</a>
          <a href='#/mistakes'>Mistake Vault</a>
        </div>
      </footer>
    </div>
  );
}
