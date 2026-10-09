import React from 'react';
import { Trophy, Flame, ArrowRight } from 'lucide-react';

export default function SessionSummaryModal({ isOpen, summaryData, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--color-amber-surface)',
            color: 'var(--color-amber)',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Trophy size={36} />
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>Session Completed!</h2>
        <p style={{ color: 'var(--fg-muted)', fontSize: 15, marginBottom: 24 }}>
          You successfully completed all phases of today's learning session.
        </p>

        <div
          style={{
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            marginBottom: 24,
            textAlign: 'left'
          }}
          className="stack"
        >
          <div className="row-between">
            <span style={{ fontSize: 14, fontWeigh: 500 }}>Continuous streak</span>
            <span
              className="pill"
              style={{
                background: 'var(--color-amber-surface)',
                color: 'var(--color-amber)',
                border: '1px solid var(--color-amber-border)'
              }}
            >
              <Flame size={14} />
              <span>+{summaryData?.streak ?? 0} days streak</span>
            </span>
          </div>

          <div className="row-between">
            <span style={{ fontSize: 14, fontWeight: 500 }}>Lesson accuracy score</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-emerald)', fontSize: 15 }}>
              {summaryData?.scorePercent ?? 0}%
            </span>
          </div>

          <div className="row-between">
            <span style={{ fontSize: 14, fontWeight: 500 }}>Reviewed count</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-cobalt)' }}>
              {summaryData?.reviewedCount ?? 0} items completed
            </span>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={onClose}>
          <span>Back to dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
