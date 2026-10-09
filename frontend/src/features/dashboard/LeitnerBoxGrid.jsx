import React from 'react';
import { Award } from 'lucide-react';

export default function LeitnerBoxGrid({ srsStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, showWrapper = false }) {
  const content = (
    <div className="leitner-grid">
      <div className="leitner-box-col box-1">
        <span className="leitner-box-label">BOX 1</span>
        <div className="leitner-box-count">{srsStats[1] ?? 0}</div>
        <span className="leitner-box-time">Daily</span>
      </div>
      <div className="leitner-box-col box-2">
        <span className="leitner-box-label">BOX 2</span>
        <div className="leitner-box-count">{srsStats[2] ?? 0}</div>
        <span className="leitner-box-time">3 days</span>
      </div>
      <div className="leitner-box-col box-3">
        <span className="leitner-box-label">BOX 3</span>
        <div className="leitner-box-count">{srsStats[3] ?? 0}</div>
        <span className="leitner-box-time">7 days</span>
      </div>
      <div className="leitner-box-col box-4">
        <span className="leitner-box-label">BOX 4</span>
        <div className="leitner-box-count">{srsStats[4] ?? 0}</div>
        <span className="leitner-box-time">14 days</span>
      </div>
      <div className="leitner-box-col box-5">
        <span className="leitner-box-label">BOX 5</span>
        <div className="leitner-box-count">{srsStats[5] ?? 0}</div>
        <span className="leitner-box-time" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>30 days</span>
          <Award size={13} />
        </span>
      </div>
    </div>
  );

  if (!showWrapper) return content;

  return (
    <div className="card">
      <div className="card-title">
        <span>5 Leitner Boxes Queue (Spaced Repetition)</span>
      </div>
      <p className="card-subtitle">
        Long-term memory progression from initial learning (Box 1) to permanent retention (Box 5).
      </p>
      {content}
    </div>
  );
}
