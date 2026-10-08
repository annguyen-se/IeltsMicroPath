import React from 'react';
import { Zap, Play } from 'lucide-react';

export default function DailyMissionCard({ metrics, onStartMission }) {
  return (
    <div className="card mission-hero">
      <span className="eyebrow">
        <Zap size={13} />
        <span>Nhiệm vụ hôm nay · Daily Focus</span>
      </span>
      <h1>Nhiệm vụ vi kỹ năng ngày hôm nay</h1>
      <p className="card-subtitle" style={{ fontSize: 15, maxWidth: 640 }}>
        Hoàn thành 3 giai đoạn được cá nhân hóa tự động theo thuật toán thích ứng (SRS &rarr; Sửa lỗi &rarr; Bài học mới).
      </p>

      <div className="mission-pipeline">
        <div className="phase-badge phase-1">
          <span className="phase-step">GIAI ĐOẠN 1</span>
          <span className="phase-name">Ôn tập ngắt quãng</span>
          <span className="phase-count">{metrics.srsDueCount} từ vựng đến hạn</span>
        </div>
        <div className="phase-badge phase-2">
          <span className="phase-step">GIAI ĐOẠN 2</span>
          <span className="phase-name">Khắc phục lỗi cũ</span>
          <span className="phase-count">{metrics.unresolvedMistakesCount} bẫy cần sửa</span>
        </div>
        <div className="phase-badge phase-3">
          <span className="phase-step">GIAI ĐOẠN 3</span>
          <span className="phase-name">Bài học vi mô mới</span>
          <span className="phase-count">Ngữ âm / Cú pháp Level 0</span>
        </div>
      </div>

      <div className="row">
        <button className="btn btn-primary btn-lg" onClick={onStartMission}>
          <Play size={16} fill="currentColor" />
          <span>Bắt đầu phiên học ngay (25 phút)</span>
        </button>
      </div>
    </div>
  );
}
