import React from 'react';
import { Award, Layers } from 'lucide-react';

const BOX_METADATA = [
  {
    box: 1,
    numLabel: 'BOX 1',
    interval: 'Daily',
    stage: 'Intake',
    accentText: 'text-red-700 dark:text-red-400',
    accentBg: 'bg-red-700 dark:bg-red-600',
    accentBorder: 'border-red-600',
    desc: 'Daily review for newly acquired lexis'
  },
  {
    box: 2,
    numLabel: 'BOX 2',
    interval: '3 days',
    stage: 'Active',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-600 dark:bg-amber-500',
    accentBorder: 'border-amber-500',
    desc: 'Active recall after 3 days'
  },
  {
    box: 3,
    numLabel: 'BOX 3',
    interval: '7 days',
    stage: 'Review',
    accentText: 'text-yellow-600 dark:text-yellow-400',
    accentBg: 'bg-yellow-600 dark:bg-yellow-500',
    accentBorder: 'border-yellow-500',
    desc: 'Consolidate after 1 week'
  },
  {
    box: 4,
    numLabel: 'BOX 4',
    interval: '14 days',
    stage: 'Retention',
    accentText: 'text-blue-700 dark:text-blue-400',
    accentBg: 'bg-blue-700 dark:bg-blue-600',
    accentBorder: 'border-blue-500',
    desc: 'Intermediate retention after 2 weeks'
  },
  {
    box: 5,
    numLabel: 'BOX 5',
    interval: '30 days',
    stage: 'Mastery',
    accentText: 'text-green-700 dark:text-green-400',
    accentBg: 'bg-green-700 dark:bg-green-600',
    accentBorder: 'border-green-600',
    desc: 'Durable long-term memory mastery'
  }
];

export default function LeitnerBoxGrid({
  srsStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  selectedBox = null,
  onSelectBox,
  showRetentionBar = true,
  showWrapper = false
}) {
  const totalCount = [1, 2, 3, 4, 5].reduce((sum, b) => sum + Number(srsStats[b] || 0), 0);
  const earlyCount = (Number(srsStats[1]) || 0) + (Number(srsStats[2]) || 0);
  const midCount = (Number(srsStats[3]) || 0) + (Number(srsStats[4]) || 0);
  const masteredCount = Number(srsStats[5]) || 0;

  const earlyPct = totalCount > 0 ? Math.round((earlyCount / totalCount) * 100) : 0;
  const midPct = totalCount > 0 ? Math.round((midCount / totalCount) * 100) : 0;
  const masteredPct = totalCount > 0 ? Math.max(0, 100 - earlyPct - midPct) : 0;

  const content = (
    <div className="flex flex-col gap-3 mt-1">
      {/* 5 Physical Filing Drawers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5" role="list" aria-label="5 Leitner Memory Boxes">
        {BOX_METADATA.map((meta) => {
          const count = Number(srsStats[meta.box] || 0);
          const isSelected = selectedBox === String(meta.box) || selectedBox === meta.box;
          const pctOfTotal = totalCount > 0 ? Math.min(100, Math.round((count / totalCount) * 100)) : 0;
          const isClickable = typeof onSelectBox === 'function';

          return (
            <div
              key={meta.box}
              className={`relative overflow-hidden flex flex-col justify-between gap-1 p-3 text-center rounded-lg border bg-white dark:bg-stone-900 min-h-[96px] transition-all duration-150 ${
                isSelected
                  ? 'border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/20'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:-translate-y-0.5 hover:shadow-sm'
              } ${isClickable ? 'cursor-pointer select-none' : ''}`}
              role={isClickable ? 'button' : 'listitem'}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => isClickable && onSelectBox(meta.box)}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectBox(meta.box);
                }
              }}
              title={`${meta.numLabel}: ${count} words · ${meta.interval} interval (${meta.stage})`}
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${meta.accentBg}`} />

              <div className="flex items-center justify-between text-[11px] font-mono leading-none">
                <span className={`font-semibold ${meta.accentText}`}>{meta.numLabel}</span>
                <span className="text-[10px] text-stone-500 font-sans">{meta.stage}</span>
              </div>

              <div className="text-2xl font-bold font-sans text-stone-800 dark:text-stone-100 my-0.5 tabular-nums">
                {count}
              </div>

              <div className="text-[11px] font-mono text-stone-500 flex items-center justify-center gap-1">
                <span>{meta.interval}</span>
                {meta.box === 5 && (
                  <Award size={11} className="text-green-700 dark:text-green-400" aria-hidden="true" />
                )}
              </div>

              {/* Progress bar inside drawer */}
              <div className="w-full h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mt-1" aria-hidden="true">
                <div
                  className={`h-full ${meta.accentBg} transition-all duration-300`}
                  style={{ width: `${pctOfTotal}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Memory Retention Health Strip */}
      {showRetentionBar && totalCount > 0 && (
        <div className="bg-[#f5f3ef] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-lg p-3 flex flex-col gap-2" aria-label="Long-Term Retention Distribution">
          <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700">
            {earlyPct > 0 && (
              <div
                className="h-full bg-red-700 dark:bg-red-600 transition-all duration-300"
                style={{ width: `${earlyPct}%` }}
                title={`Intake Phase: ${earlyCount} words (${earlyPct}%)`}
              />
            )}
            {midPct > 0 && (
              <div
                className="h-full bg-blue-700 dark:bg-blue-600 transition-all duration-300"
                style={{ width: `${midPct}%` }}
                title={`Consolidating: ${midCount} words (${midPct}%)`}
              />
            )}
            {masteredPct > 0 && (
              <div
                className="h-full bg-green-700 dark:bg-green-600 transition-all duration-300"
                style={{ width: `${masteredPct}%` }}
                title={`Mastered: ${masteredCount} words (${masteredPct}%)`}
              />
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-700 dark:bg-red-600" />
              <span>Intake: <strong className="text-stone-700 dark:text-stone-300">{earlyCount}</strong> ({earlyPct}%)</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700 dark:bg-blue-600" />
              <span>Consolidating: <strong className="text-stone-700 dark:text-stone-300">{midCount}</strong> ({midPct}%)</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-700 dark:bg-green-600" />
              <span>Mastered: <strong className="text-stone-700 dark:text-stone-300">{masteredCount}</strong> ({masteredPct}%)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (!showWrapper) return content;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col gap-1 mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500">
          <Layers size={13} aria-hidden="true" /> Long-Term Retention
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-stone-800 dark:text-stone-100">
          5-Box Leitner Memory Vault
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Automatic spaced repetition cycle according to the Ebbinghaus Forgetting Curve.
        </p>
      </div>
      {content}
    </div>
  );
}
