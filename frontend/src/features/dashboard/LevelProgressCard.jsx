import React from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

export default function LevelProgressCard({ levelProgressPercent = 0, masteredCount = 0, totalCount = 0 }) {
  return (
    <div className="card">
      <div className="card-title">
        <TrendingUp size={17} />
        <span>Tiến độ Level 0 (Zero)</span>
      </div>
      <p className="card-subtitle">English Genesis · 44 Âm IPA & 500 Từ cốt lõi</p>
      <div style={{ margin: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 700 }}>
          <span>Độ thành thạo</span>
          <span>{levelProgressPercent}%</span>
        </div>
        <div style={{ height: 10, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${levelProgressPercent}%`, background: 'var(--color-emerald)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-muted)' }}>
        <CheckCircle2 size={14} style={{ color: 'var(--color-emerald)' }} />
        <span>Đã vượt qua {masteredCount} / {totalCount || 25} điều kiện tiên quyết (Prerequisite nodes).</span>
      </div>
    </div>
  );
}
