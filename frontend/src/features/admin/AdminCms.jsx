import React, { useState } from 'react';
import api from '../../api/apiClient';
import { Shield, Plus, BookOpen, Layers, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AdminCms({ onBackToStudent }) {
  const [activeTab, setActiveTab] = useState('vocab'); // 'vocab' | 'lesson'
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });

  // Vocab form state
  const [newVocab, setNewVocab] = useState({
    word: '',
    ipa: '',
    pos: 'verb',
    meaningVi: '',
    exampleSentence: '',
    topic: 'environment',
    tier: 3,
    audioUrl: ''
  });

  // Lesson form state
  const [newLesson, setNewLesson] = useState({
    title: '',
    skill: 'phonetics',
    level: 0,
    topic: 'vowels',
    orderIndex: 1,
    contentMarkdown: ''
  });

  const handleVocabSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: 'Đang lưu từ vựng...', isError: false });
    try {
      await api.post('/admin/vocabularies', {
        ...newVocab,
        media: newVocab.audioUrl ? {
          type: 'audio',
          provider: 'cloudinary',
          url: newVocab.audioUrl
        } : undefined
      });
      setStatusMsg({ text: `Đã thêm thành công từ vựng: ${newVocab.word}`, isError: false });
      setNewVocab({
        word: '',
        ipa: '',
        pos: 'verb',
        meaningVi: '',
        exampleSentence: '',
        topic: 'environment',
        tier: 3,
        audioUrl: ''
      });
    } catch (err) {
      setStatusMsg({ text: `Lỗi: ${err.message}`, isError: true });
    }
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: 'Đang tạo bài học...', isError: false });
    try {
      await api.post('/admin/lessons', newLesson);
      setStatusMsg({ text: `Đã tạo bài học thành công: ${newLesson.title}`, isError: false });
      setNewLesson({
        title: '',
        skill: 'phonetics',
        level: 0,
        topic: 'vowels',
        orderIndex: 1,
        contentMarkdown: ''
      });
    } catch (err) {
      setStatusMsg({ text: `Lỗi: ${err.message}`, isError: true });
    }
  };

  return (
    <div className="stack" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* ─── Admin Control Card ─── */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-cobalt)' }}>
        <div className="row-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--color-cobalt)',
                color: 'white',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, margin: 0 }}>Trung tâm Quản trị Nội dung (Admin CMS)</h2>
              <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 13 }}>
                Khu vực độc lập dành cho quản lý học liệu và cây tri thức.
              </p>
            </div>
          </div>
          {onBackToStudent && (
            <button
              className="btn btn-secondary"
              onClick={onBackToStudent}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <ArrowLeft size={14} />
              <span>Về màn hình học</span>
            </button>
          )}
        </div>

        {/* ─── Admin Sub-Navigation ─── */}
        <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeTab === 'vocab' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => { setActiveTab('vocab'); setStatusMsg({ text: '', isError: false }); }}
          >
            <Layers size={14} />
            <span>Thêm từ vựng mới</span>
          </button>
          <button
            className={`btn ${activeTab === 'lesson' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => { setActiveTab('lesson'); setStatusMsg({ text: '', isError: false }); }}
          >
            <BookOpen size={14} />
            <span>Thêm bài học vi mô</span>
          </button>
        </div>
      </div>

      {/* ─── Status Notice ─── */}
      {statusMsg.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: statusMsg.isError ? 'var(--color-rose-surface)' : 'var(--color-emerald-surface)',
            color: statusMsg.isError ? 'var(--color-rose)' : 'var(--color-emerald)',
            border: `1px solid ${statusMsg.isError ? 'var(--color-rose-border)' : 'var(--color-emerald-border)'}`
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* ─── Tab 1: Vocab Form ─── */}
      {activeTab === 'vocab' && (
        <div className="card">
          <div className="card-title">
            <Plus size={16} />
            <span>Thêm từ vựng vào ngân hàng SRS</span>
          </div>
          <p className="card-subtitle">
            Từ vựng thêm mới sẽ được cấp phát cho học viên qua các bài học hoặc hàng đợi Leitner Box 1.
          </p>

          <form
            style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            onSubmit={handleVocabSubmit}
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Từ loại (POS)</label>
              <select
                className="input-text"
                value={newVocab.pos}
                onChange={(e) => setNewVocab({ ...newVocab, pos: e.target.value })}
              >
                <option value="verb">Verb (Động từ)</option>
                <option value="noun">Noun (Danh từ)</option>
                <option value="adj">Adjective (Tính từ)</option>
                <option value="adv">Adverb (Phó từ)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Chủ đề (Topic)</label>
              <input
                type="text"
                className="input-text"
                placeholder="environment, technology..."
                value={newVocab.topic}
                onChange={(e) => setNewVocab({ ...newVocab, topic: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Link Audio CDN</label>
              <input
                type="url"
                className="input-text"
                placeholder="https://..."
                value={newVocab.audioUrl}
                onChange={(e) => setNewVocab({ ...newVocab, audioUrl: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Câu ví dụ (có từ hoặc chỗ trống ______)</label>
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
                <span>Lưu từ vựng</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Tab 2: Lesson Form ─── */}
      {activeTab === 'lesson' && (
        <div className="card">
          <div className="card-title">
            <BookOpen size={16} />
            <span>Thêm bài học vi mô vào Cây tiến trình (DAG Node)</span>
          </div>
          <p className="card-subtitle">
            Bài học mới sẽ tự động gắn kết vào cây kỹ năng theo cấp độ Level.
          </p>

          <form
            style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            onSubmit={handleLessonSubmit}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tiêu đề bài học</label>
              <input
                type="text"
                className="input-text"
                placeholder="ví dụ: Minimal Pairs: /æ/ vs /e/"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Kỹ năng (Skill)</label>
              <select
                className="input-text"
                value={newLesson.skill}
                onChange={(e) => setNewLesson({ ...newLesson, skill: e.target.value })}
              >
                <option value="phonetics">Phonetics (Ngữ âm)</option>
                <option value="syntax">Syntax (Ngữ pháp / Cú pháp)</option>
                <option value="lexicon">Lexicon (Từ vựng)</option>
                <option value="discourse">Discourse (Đoạn văn)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Cấp độ (Level 0 - 4)</label>
              <select
                className="input-text"
                value={newLesson.level}
                onChange={(e) => setNewLesson({ ...newLesson, level: Number(e.target.value) })}
              >
                <option value={0}>Level 0 (Mất gốc / Genesis)</option>
                <option value={1}>Level 1 (Foundation 4.0 - 5.0)</option>
                <option value={2}>Level 2 (Developing 5.0 - 6.0)</option>
                <option value={3}>Level 3 (Competent 6.0 - 7.0)</option>
                <option value={4}>Level 4 (Advanced 7.5+)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Thứ tự hiển thị (Order Index)</label>
              <input
                type="number"
                className="input-text"
                value={newLesson.orderIndex}
                onChange={(e) => setNewLesson({ ...newLesson, orderIndex: Number(e.target.value) })}
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Nội dung bài học (Markdown)</label>
              <textarea
                className="input-text"
                rows={5}
                placeholder="Nhập lý thuyết ngắn gọn và ví dụ minh họa..."
                value={newLesson.contentMarkdown}
                onChange={(e) => setNewLesson({ ...newLesson, contentMarkdown: e.target.value })}
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} />
                <span>Tạo bài học mới</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
