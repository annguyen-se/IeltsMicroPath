import React from 'react';
import { Archive, Award } from 'lucide-react';

export default function LeitnerBoxGrid({ srsStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }) {
  return (
    <div className="card">
      <div className="card-title">
        <Archive size={17} />
        <span>Hàng đợi 5 Hộp Leitner (Spaced Repetition)</span>
      </div>
      <p className="card-subtitle">Tiến trình trí nhớ dài hạn từ lúc mới học (Box 1) đến khi thuộc vĩnh viễn (Box 5).</p>
      <div className="leitner-grid">
        <div className="leitner-box-col box-1">
          <span className="leitner-box-label">HỘP 1</span>
          <span className="leitner-box-count">{srsStats[1] ?? 0}</span>
          <span className="leitner-box-time">Mỗi ngày</span>
        </div>
        <div className="leitner-box-col box-2">
          <span className="leitner-box-label">HỘP 2</span>
          <span className="leitner-box-count">{srsStats[2] ?? 0}</span>
          <span className="leitner-box-time">3 ngày</span>
        </div>
        <div className="leitner-box-col box-3">
          <span className="leitner-box-label">HỘP 3</span>
          <span className="leitner-box-count">{srsStats[3] ?? 0}</span>
          <span className="leitner-box-time">7 ngày</span>
        </div>
        <div className="leitner-box-col box-4">
          <span className="leitner-box-label">HỘP 4</span>
          <span className="leitner-box-count">{srsStats[4] ?? 0}</span>
          <span className="leitner-box-time">14 ngày</span>
        </div>
        <div className="leitner-box-col box-5">
          <span className="leitner-box-label">HỘP 5</span>
          <span className="leitner-box-count">{srsStats[5] ?? 0}</span>
          <span className="leitner-box-time" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>30 ngày</span>
            <Award size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
