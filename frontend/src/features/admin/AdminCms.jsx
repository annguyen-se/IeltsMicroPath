import React, { useState } from 'react';
import api from '../../api/apiClient';
import { Settings, Plus } from 'lucide-react';

export default function AdminCms() {
  const [newVocab, setNewVocab] = useState({
    word: '',
    ipa: '',
    pos: 'verb',
    meaningVi: '',
    exampleSentence: '',
    topic: 'environment',
    tier: 3,
    audioUrl: 'https://res.cloudinary.com/ieltstrain/audio/sample.mp3'
  });
  const [saveStatus, setSaveStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('Đang lưu...');
    try {
      await api.post('/admin/vocabularies', {
        ...newVocab,
        media: {
          type: 'audio',
          provider: 'cloudinary',
          url: newVocab.audioUrl
        }
      });
      setSaveStatus(`Đã lưu thành công từ: ${newVocab.word}`);
      setNewVocab({
        word: '',
        ipa: '',
        pos: 'verb',
        meaningVi: '',
        exampleSentence: '',
        topic: 'environment',
        tier: 3,
        audioUrl: 'https://res.cloudinary.com/ieltstrain/audio/sample.mp3'
      });
    } catch (err) {
      setSaveStatus(`Lỗi lưu: ${err.message}`);
    }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">
          <Settings size={17} />
          <span>Quản trị nội dung học thuật (Content CMS)</span>
        </div>
        <p className="card-subtitle">Thêm từ vựng và bài học vi mô có đính kèm link audio/video ngoài.</p>

        {saveStatus && (
          <div style={{ marginTop: 14, padding: 10, background: 'var(--surface-subtle)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {saveStatus}
          </div>
        )}

        <form
          style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          onSubmit={handleSubmit}
        >
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Từ vựng</label>
            <input
              type="text"
              className="input-text"
              placeholder="ví dụ: ubiquitous"
              value={newVocab.word}
              onChange={(e) => setNewVocab({ ...newVocab, word: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Phiên âm IPA</label>
            <input
              type="text"
              className="input-text"
              placeholder="/juːˈbɪk.wə.təs/"
              value={newVocab.ipa}
              onChange={(e) => setNewVocab({ ...newVocab, ipa: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Nghĩa tiếng Việt</label>
            <input
              type="text"
              className="input-text"
              placeholder="phổ biến, có mặt ở khắp nơi"
              value={newVocab.meaningVi}
              onChange={(e) => setNewVocab({ ...newVocab, meaningVi: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Link Audio ngoài (CDN URL)</label>
            <input
              type="url"
              className="input-text"
              placeholder="https://res.cloudinary.com/..."
              value={newVocab.audioUrl}
              onChange={(e) => setNewVocab({ ...newVocab, audioUrl: e.target.value })}
              required
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Câu ví dụ (chứa ______)</label>
            <input
              type="text"
              className="input-text"
              placeholder="Smartphones have become ______ in modern life."
              value={newVocab.exampleSentence}
              onChange={(e) => setNewVocab({ ...newVocab, exampleSentence: e.target.value })}
              required
            />
          </div>
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} />
              <span>Lưu vào kho bài học</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
