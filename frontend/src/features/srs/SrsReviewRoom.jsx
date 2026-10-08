import React from 'react';
import { Layers, Volume2 } from 'lucide-react';

export default function SrsReviewRoom() {
  const playAudio = () => {
    const audio = new Audio('https://res.cloudinary.com/ieltstrain/audio/mitigate.mp3');
    audio.play().catch(() => {});
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">
          <Layers size={17} />
          <span>Phòng Ôn tập ngắt quãng (Leitner SRS)</span>
        </div>
        <p className="card-subtitle">Quản lý toàn bộ vốn từ vựng được tự động xếp lịch ôn theo Ebbinghaus Forgetting Curve.</p>

        <div style={{ marginTop: 24 }} className="stack">
          <div className="card" style={{ background: 'var(--surface-subtle)' }}>
            <div className="row-between">
              <div>
                <h3 style={{ fontSize: 20 }}>mitigate</h3>
                <span className="ipa">/ˈmɪt.ɪ.ɡeɪt/ · verb · Tier 3 (Academic)</span>
                <p style={{ marginTop: 6, fontSize: 14 }}>Nghĩa: làm giảm bớt mức độ nghiêm trọng</p>
                <p style={{ marginTop: 4, fontSize: 13, color: 'var(--fg-muted)' }}>Ví dụ: "Governments must act swiftly to mitigate environmental damage."</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="phase-badge phase-1" style={{ display: 'inline-block', padding: '4px 10px', fontSize: 12 }}>
                  Hộp 2 (Ôn sau 3 ngày)
                </span>
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-secondary" onClick={playAudio} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Volume2 size={15} />
                    <span>Nghe</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
