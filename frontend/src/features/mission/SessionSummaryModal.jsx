import React from 'react';
import { Sparkles, Flame, CheckCircle2, Award } from 'lucide-react';

export default function SessionSummaryModal({ isOpen, summaryData, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Sparkles size={48} style={{ color: 'var(--color-amber)' }} />
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Hoàn thành phiên học xuất sắc!</h2>
        <p style={{ color: 'var(--fg-muted)', fontSize: 15, marginBottom: 24 }}>
          Bạn đã hoàn thành đủ 3 giai đoạn của ngày hôm nay. Trí não của bạn đã củng cố thêm kiến thức mới!
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          <div className="card" style={{ padding: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              +{summaryData?.streak ?? 1}
              <Flame size={18} />
            </span>
            <span style={{ fontSize: 12, display: 'block', color: 'var(--fg-muted)' }}>Ngày Streak</span>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              +{summaryData?.reviewedCount ?? 1}
              <CheckCircle2 size={18} />
            </span>
            <span style={{ fontSize: 12, display: 'block', color: 'var(--fg-muted)' }}>Từ đã ôn</span>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {summaryData?.scorePercent ?? 100}%
              <Award size={18} />
            </span>
            <span style={{ fontSize: 12, display: 'block', color: 'var(--fg-muted)' }}>Điểm bài mới</span>
          </div>
        </div>
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          Trở về Dashboard
        </button>
      </div>
    </div>
  );
}
