import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function MistakeVault() {
  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">
          <AlertCircle size={17} />
          <span>Sổ tay bẫy lỗi sai (Mistake Vault)</span>
        </div>
        <p className="card-subtitle">Mọi câu làm sai được tự động lưu vào đây để bạn luyện lại cho đến khi làm đúng.</p>

        <div style={{ marginTop: 20 }}>
          <div className="mistake-card">
            <div className="row-between">
              <span className="phase-badge phase-2" style={{ padding: '4px 10px', fontSize: 12 }}>
                Mã lỗi: [ERR_PHO] Nhầm lẫn âm thanh
              </span>
              <button className="btn btn-secondary" onClick={() => alert('Thử thách lại câu hỏi!')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={14} />
                <span>Làm lại ngay</span>
              </button>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>
              Câu hỏi: Từ nào sau đây chứa nguyên âm dài /iː/?
            </p>
            <p style={{ color: 'var(--color-rose)', fontSize: 14 }}>
              Bạn đã trả lời sai: <strong>"Ship"</strong> (/ʃɪp/)
            </p>
            <p style={{ color: 'var(--color-emerald)', fontSize: 14 }}>
              Đáp án đúng: <strong>"Sheep"</strong> (/ʃiːp/)
            </p>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 8 }}>
              Giải thích: 'Sheep' phát âm kéo dài môi cười nhẹ; 'Ship' phát âm dứt khoát.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
