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
  CheckCircle2,
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
    <div className="flex flex-col gap-10">
      {/* ─── 1. Academic Orientation & Workspace Welcome ─── */}
      <section className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-1">
          <Compass size={13} aria-hidden="true" /> Guided Writing Workspace
        </span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100">
              {isAuthenticated && user.email
                ? `Welcome back. Let's refine your academic writing today.`
                : `Your dedicated IELTS writing coach workspace.`}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl mt-1.5 leading-relaxed">
              Each session is structured as a focused 1-on-1 tutorial: activate core vocabulary, repair recent grammar
              traps, and complete a targeted writing drill with instant diagnostic feedback.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isAuthenticated ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-3.5 py-2 flex items-center gap-2.5 shadow-sm text-xs text-stone-600 dark:text-stone-300">
                <Target size={15} className="text-orange-700 dark:text-orange-500" aria-hidden="true" />
                <span>
                  Target: <strong className="font-mono text-stone-800 dark:text-stone-100">Band {user.targetBand || '7.0+'}</strong> · Level <strong className="font-mono text-stone-800 dark:text-stone-100">{user.currentLevel ?? 1}</strong> (<span className="font-mono">{progressPercent}%</span>)
                </span>
              </div>
            ) : (
              <button
                className="px-3.5 py-2 text-xs font-semibold rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 shadow-sm"
                onClick={onOpenAuth}
              >
                <Lock size={13} aria-hidden="true" />
                <span>Sign in to sync progress</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. Primary Guided Desk: Today's 3-Stage Mission ─── */}
      <section className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-2">
          <BookmarkCheck size={14} aria-hidden="true" /> Today's Guided Tutorial · 3-Stage Practice
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight mb-2">
          {nextLesson ? nextLesson.title : 'Argument Development & Cohesive Devices (Task 2)'}
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mb-6">
          {nextLesson
            ? `Next milestone on your Level ${nextLesson.level} curriculum DAG. Complete this session to unlock subsequent modules.`
            : 'A focused 20–25 minute writing tutorial: activate vocabulary recall, dissect syntax traps, and draft a key sentence translation.'}
        </p>

        {/* 3 Sequential Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#fbfaf8] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg p-4 flex flex-col justify-between gap-3">
            <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <span className="font-mono font-semibold text-orange-700 dark:text-orange-500">01</span>
              <span>· Lexical Recall</span>
            </div>
            <div className="font-semibold text-sm text-stone-800 dark:text-stone-100">Spaced Repetition (SRS)</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {isAuthenticated
                ? `${srsDue} lexical items scheduled in Leitner boxes`
                : 'Consolidate academic collocations'}
            </div>
          </div>

          <div className="bg-[#fbfaf8] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg p-4 flex flex-col justify-between gap-3">
            <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <span className="font-mono font-semibold text-orange-700 dark:text-orange-500">02</span>
              <span>· Error Remediation</span>
            </div>
            <div className="font-semibold text-sm text-stone-800 dark:text-stone-100">Target Recent Mistakes</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {isAuthenticated
                ? `${mistakesDue} syntax traps requiring attention`
                : 'Review common grammatical pitfalls'}
            </div>
          </div>

          <div className="bg-[#fbfaf8] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg p-4 flex flex-col justify-between gap-3">
            <div className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <span className="font-mono font-semibold text-orange-700 dark:text-orange-500">03</span>
              <span>· Core Writing Drill</span>
            </div>
            <div className="font-semibold text-sm text-stone-800 dark:text-stone-100">
              {nextLesson ? `${nextLesson.skill.toUpperCase()} Level ${nextLesson.level}` : 'Writing Micro-Practice'}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Sentence construction with instant feedback
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold bg-orange-700 hover:bg-orange-800 text-white shadow-sm transition-all active:translate-y-px"
            onClick={() => handleAction(onStartMission)}
          >
            {isAuthenticated ? (
              <>
                <span>Start Guided Session Now</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            ) : (
              <>
                <Lock size={15} aria-hidden="true" />
                <span>Sign in to Start Learning</span>
              </>
            )}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all shadow-sm"
            onClick={() => onSwitchView('lessons')}
          >
            <BookMarked size={15} aria-hidden="true" />
            <span>Browse Curriculum</span>
          </button>

          {dailyStatus.estimatedMinutes && (
            <span className="text-xs text-stone-500 font-mono inline-flex items-center gap-1 ml-1">
              <Clock size={13} aria-hidden="true" /> Est. {dailyStatus.estimatedMinutes} minutes
            </span>
          )}
        </div>
      </section>

      {/* ─── 3. Practice Workstations (Dedicated Micro-Drills) ─── */}
      <section>
        <div className="flex flex-col gap-1 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-1">
            <PenLine size={13} aria-hidden="true" /> Specialized Practice Benches
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-100">
                Select Your Focus Area
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                Dedicated micro-drills to strengthen sentence precision, discourse flow, and lexical recall.
              </p>
            </div>
            <button
              className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-md transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
              onClick={() => onSwitchView('lessons')}
            >
              <span>All Curriculum</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Station 1: Writing Drill */}
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between gap-4 cursor-pointer text-left transition-all hover:border-stone-400 dark:hover:border-stone-600 hover:-translate-y-0.5 shadow-sm"
            role="button"
            tabIndex={0}
            onClick={() => onSwitchView('writing')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('writing')}
          >
            <div>
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700" aria-hidden="true">
                <PenLine size={18} />
              </div>
              <div className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 mt-3 mb-1 tracking-tight">
                Sentence Translation Drill (100 Sentences)
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Practice English translation across 12 core academic grammar patterns: participle clauses, conditionals, and inversion.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-orange-700 dark:text-orange-500 pt-3 border-t border-stone-100 dark:border-stone-800">
              <span>Open Translation Room</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </div>
          </div>

          {/* Station 2: Reading & Paraphrase Studio */}
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between gap-4 cursor-pointer text-left transition-all hover:border-stone-400 dark:hover:border-stone-600 hover:-translate-y-0.5 shadow-sm"
            role="button"
            tabIndex={0}
            onClick={() => onSwitchView('lessons?skill=reading')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('lessons?skill=reading')}
          >
            <div>
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700" aria-hidden="true">
                <BookOpen size={18} />
              </div>
              <div className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 mt-3 mb-1 tracking-tight">
                Reading & Paraphrase Studio
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Examine Band 8.0+ model passages, identify lexical substitution traps, and build academic reading stamina.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-orange-700 dark:text-orange-500 pt-3 border-t border-stone-100 dark:border-stone-800">
              <span>Explore Paraphrases</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </div>
          </div>

          {/* Station 3: Vocabulary Hub & SRS */}
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between gap-4 cursor-pointer text-left transition-all hover:border-stone-400 dark:hover:border-stone-600 hover:-translate-y-0.5 shadow-sm"
            role="button"
            tabIndex={0}
            onClick={() => onSwitchView('vocabulary')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('vocabulary')}
          >
            <div>
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700" aria-hidden="true">
                <Boxes size={18} />
              </div>
              <div className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 mt-3 mb-1 tracking-tight">
                Lexical Bank & Leitner Boxes
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Intelligent spaced repetition. Consolidate academic collocations for environmental, technological, and educational topics into long-term memory.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-orange-700 dark:text-orange-500 pt-3 border-t border-stone-100 dark:border-stone-800">
              <span>Open Lexical Bank</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </div>
          </div>

          {/* Station 4: Typing Drill */}
          <div
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between gap-4 cursor-pointer text-left transition-all hover:border-stone-400 dark:hover:border-stone-600 hover:-translate-y-0.5 shadow-sm"
            role="button"
            tabIndex={0}
            onClick={() => onSwitchView('typing')}
            onKeyDown={(e) => e.key === 'Enter' && onSwitchView('typing')}
          >
            <div>
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700" aria-hidden="true">
                <Keyboard size={18} />
              </div>
              <div className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 mt-3 mb-1 tracking-tight">
                Academic Typing Drill
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Build keyboard muscle memory for spelling accuracy, reducing cognitive load during computer-delivered tests.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-orange-700 dark:text-orange-500 pt-3 border-t border-stone-100 dark:border-stone-800">
              <span>Launch Typing Drill</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Progress Vault & Tutor Marginalia ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
        {/* Left Column: Memory Vault */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col gap-1 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-1">
              <Layers size={13} aria-hidden="true" /> Long-Term Retention
            </span>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-stone-800 dark:text-stone-100">
                5-Box Leitner Memory Vault
              </h2>
              <button
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1"
                onClick={() => handleAction(() => onSwitchView('srs'))}
              >
                <span>Open Review</span>
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Spaced repetition schedule: words achieve durable mastery only after cycling successfully through all five boxes.
            </p>
          </div>

          {/* Tactile 5-Box Filing Deck */}
          <LeitnerBoxGrid
            srsStats={srsStats}
            onSelectBox={(boxNum) => handleAction(() => onSwitchView(`vocabulary?tab=srs&box=${boxNum}`))}
          />

          {isAuthenticated ? (
            totalSrsCount > 0 ? (
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                {srsDue > 0 ? (
                  <span className="text-red-700 dark:text-red-400 font-medium inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    <span>{srsDue} words scheduled for review today</span>
                  </span>
                ) : (
                  <span className="text-green-700 dark:text-green-400 font-medium inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>All cards reviewed for today ({totalSrsCount} active)</span>
                  </span>
                )}
                <button
                  className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium transition-colors"
                  onClick={() => onSwitchView('srs')}
                >
                  Full Review Deck →
                </button>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700/60 flex items-center justify-between flex-wrap gap-2 text-xs text-stone-600 dark:text-stone-400">
                <span>5 filing drawers ready to receive new vocabulary. Complete a lesson to enroll.</span>
                <button
                  className="font-semibold text-orange-700 dark:text-orange-500 hover:underline"
                  onClick={() => onSwitchView('vocabulary?tab=topics')}
                >
                  Explore Vocabulary
                </button>
              </div>
            )
          ) : (
            <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700/60 flex items-center justify-between flex-wrap gap-2 text-xs text-stone-600 dark:text-stone-400">
              <span>Sign in to track word migration across the 5 memory compartments.</span>
              <button
                className="font-semibold text-orange-700 dark:text-orange-500 hover:underline"
                onClick={onOpenAuth}
              >
                Sign in now
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Tutor Marginalia Note */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#f5f3ef] dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl p-5 relative">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-2">
              <BookOpen size={13} aria-hidden="true" /> Writing Coach Marginalia · L1 Contrast Note
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              "In academic IELTS Writing, cohesion is not achieved by chaining discourse markers like 'Moreover' or
              'Furthermore' at the start of every sentence. Vietnamese learners often tend to translate connectives such
              as 'Hơn nữa' or 'Ngoài ra' literally and place them at the beginning of sentences, resulting in a
              mechanical, list-like style. Instead, try using participle clauses (e.g., 'Having analyzed the economic
              trends...') or embedding adverbs within the predicate for a more natural, Band 7.5+ discourse flow."
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-0.5">
                <ShieldAlert size={13} aria-hidden="true" /> Error Remediation
              </span>
              <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">Personal Mistake Vault</div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {isAuthenticated
                  ? `${mistakesDue} syntax traps logged for remediation`
                  : 'Turn incorrect submissions into memorable lessons'}
              </p>
            </div>
            <button
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1 shrink-0"
              onClick={() => handleAction(() => onSwitchView('mistakes'))}
            >
              <span>Open Vault</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 5. Academic Colophon Footer ─── */}
      <footer className="mt-12 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-stone-500">
        <div className="flex items-center gap-3">
          <span>IELTS Writing Hub · Writing Studio & Clinic</span>
          <span>·</span>
          <span>Guided Academic Learning Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#/lessons" className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors">Curriculum</a>
          <a href="#/writing" className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors">100 Sentences</a>
          <a href="#/vocabulary" className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors">Lexical Bank</a>
          <a href="#/mistakes" className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors">Mistake Vault</a>
        </div>
      </footer>
    </div>
  );
}
