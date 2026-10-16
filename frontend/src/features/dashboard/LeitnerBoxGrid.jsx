/* Hallmark · macrostructure: Workbench · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { Award, Layers } from 'lucide-react';

const BOX_METADATA = [
  {
    box: 1,
    numLabel: 'BOX 1',
    interval: 'Daily',
    stage: 'Intake',
    accentVar: 'var(--color-brick)',
    accentSoft: 'var(--color-brick-soft)',
    desc: 'Daily review for newly acquired lexis'
  },
  {
    box: 2,
    numLabel: 'BOX 2',
    interval: '3 days',
    stage: 'Active',
    accentVar: 'var(--color-amber)',
    accentSoft: 'var(--color-amber-soft)',
    desc: 'Active recall after 3 days'
  },
  {
    box: 3,
    numLabel: 'BOX 3',
    interval: '7 days',
    stage: 'Review',
    accentVar: 'oklch(62% 0.14 85)',
    accentSoft: 'oklch(95% 0.035 85)',
    desc: 'Consolidate after 1 week'
  },
  {
    box: 4,
    numLabel: 'BOX 4',
    interval: '14 days',
    stage: 'Retention',
    accentVar: 'var(--color-cobalt)',
    accentSoft: 'var(--color-cobalt-soft)',
    desc: 'Intermediate retention after 2 weeks'
  },
  {
    box: 5,
    numLabel: 'BOX 5',
    interval: '30 days',
    stage: 'Mastery',
    accentVar: 'var(--color-moss)',
    accentSoft: 'var(--color-moss-soft)',
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
    <div className="leitner-deck-wrap">
      {/* 5 Physical Filing Drawers */}
      <div className="leitner-desk-row" role="list" aria-label="5 Leitner Memory Boxes">
        {BOX_METADATA.map((meta) => {
          const count = Number(srsStats[meta.box] || 0);
          const isSelected = selectedBox === String(meta.box) || selectedBox === meta.box;
          const pctOfTotal = totalCount > 0 ? Math.min(100, Math.round((count / totalCount) * 100)) : 0;
          const isClickable = typeof onSelectBox === 'function';

          return (
            <div
              key={meta.box}
              className={`leitner-drawer ${isSelected ? 'is-selected' : ''}`}
              role={isClickable ? 'button' : 'listitem'}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => isClickable && onSelectBox(meta.box)}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectBox(meta.box);
                }
              }}
              style={{
                '--box-accent': meta.accentVar,
                '--box-accent-soft': meta.accentSoft
              }}
              title={`${meta.numLabel}: ${count} words · ${meta.interval} interval (${meta.stage})`}
            >
              <div className="leitner-drawer-num">
                <span>{meta.numLabel}</span>
                <span className="leitner-drawer-stage">{meta.stage}</span>
              </div>

              <div className="leitner-drawer-count">
                {count}
              </div>

              <div className="leitner-drawer-interval">
                <span>{meta.interval}</span>
                {meta.box === 5 && (
                  <Award size={11} style={{ color: meta.accentVar }} aria-hidden="true" />
                )}
              </div>

              {/* Proportional visual level */}
              <div className="leitner-drawer-bar" aria-hidden="true">
                <div
                  className="leitner-drawer-fill"
                  style={{ width: `${pctOfTotal}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Memory Retention Health Strip */}
      {showRetentionBar && totalCount > 0 && (
        <div className="leitner-retention-container" aria-label="Long-Term Retention Distribution">
          <div className="leitner-retention-bar">
            {earlyPct > 0 && (
              <div
                className="leitner-retention-seg"
                style={{ width: `${earlyPct}%`, background: 'var(--color-brick)' }}
                title={`Intake Phase: ${earlyCount} words (${earlyPct}%)`}
              />
            )}
            {midPct > 0 && (
              <div
                className="leitner-retention-seg"
                style={{ width: `${midPct}%`, background: 'var(--color-cobalt)' }}
                title={`Consolidating: ${midCount} words (${midPct}%)`}
              />
            )}
            {masteredPct > 0 && (
              <div
                className="leitner-retention-seg"
                style={{ width: `${masteredPct}%`, background: 'var(--color-moss)' }}
                title={`Mastered: ${masteredCount} words (${masteredPct}%)`}
              />
            )}
          </div>

          <div className="leitner-retention-labels">
            <span className="leitner-legend-item">
              <span className="leitner-legend-dot" style={{ background: 'var(--color-brick)' }} />
              <span>Intake: <strong>{earlyCount}</strong> ({earlyPct}%)</span>
            </span>

            <span className="leitner-legend-item">
              <span className="leitner-legend-dot" style={{ background: 'var(--color-cobalt)' }} />
              <span>Consolidating: <strong>{midCount}</strong> ({midPct}%)</span>
            </span>

            <span className="leitner-legend-item">
              <span className="leitner-legend-dot" style={{ background: 'var(--color-moss)' }} />
              <span>Mastered: <strong>{masteredCount}</strong> ({masteredPct}%)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (!showWrapper) return content;

  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 'var(--space-sm)' }}>
        <span className="section-kicker">
          <Layers size={13} aria-hidden="true" /> Long-Term Memory
        </span>
        <h2 className="section-title" style={{ fontSize: 'var(--text-lg)' }}>
          5-Box Leitner Queue
        </h2>
        <p className="section-desc">
          Automated spaced repetition progression based on the Ebbinghaus forgetting curve.
        </p>
      </div>
      {content}
    </div>
  );
}
