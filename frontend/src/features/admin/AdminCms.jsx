import React, { useState } from 'react';
import api from '../../api/apiClient';
import {
  Shield,
  Plus,
  BookOpen,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Code,
  Upload,
  Trash2,
  AlertCircle
} from 'lucide-react';

const SAMPLE_BATCH_JSON = [
  {
    "word": "mitigate",
    "ipa": "/ˈmɪt.ɪ.ɡeɪt/",
    "pos": "verb",
    "meaningVi": "làm giảm bớt, làm dịu bớt (tác hại/rủi ro)",
    "definitionEn": "to make something less harmful, unpleasant, or bad",
    "vocabType": "topic_specific",
    "topic": "environment",
    "tier": 3,
    "awlSublist": null,
    "collocations": [
      "mitigate climate change",
      "mitigate the risk of",
      "mitigate environmental damage"
    ],
    "exampleSentence": "Governments must implement strict policies to ______ environmental damage.",
    "topicIdeaVi": "Dùng cho Writing Task 2: Đề xuất giải pháp giảm thiểu tác động tiêu cực của biến đổi khí hậu.",
    "wordFamily": {
      "noun": "mitigation",
      "adj": "unmitigated"
    },
    "paraphrases": ["alleviate", "reduce", "lessen"],
    "media": {
      "type": "audio",
      "url": "https://assets.domain.com/audio/mitigate.mp3"
    }
  },
  {
    "word": "aisle seat",
    "ipa": "/aɪl siːt/",
    "pos": "noun",
    "meaningVi": "ghế ngồi cạnh lối đi (trên máy bay, tàu hỏa)",
    "definitionEn": "a seat on a plane, train, etc. next to the passage where people walk",
    "vocabType": "topic_specific",
    "topic": "travel",
    "tier": 3,
    "awlSublist": null,
    "collocations": [
      "book an aisle seat",
      "prefer an aisle seat",
      "window or aisle seat"
    ],
    "exampleSentence": "Do you want a window seat or an ______?",
    "topicIdeaVi": "Dùng trong giao tiếp hàng không, đặt vé máy bay.",
    "wordFamily": {
      "noun": "aisle",
      "adj": null
    },
    "paraphrases": ["passage seat"],
    "media": {
      "type": "audio",
      "url": "https://assets.domain.com/audio/aisle-seat.mp3"
    }
  }
];

export default function AdminCms({ onBackToStudent }) {
  const [activeTab, setActiveTab] = useState('batch_json'); // 'batch_json' | 'vocab' | 'lesson'
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });

  // Single Vocab form state
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

  // Batch JSON state
  const [jsonInput, setJsonInput] = useState('');
  const [parsedItems, setParsedItems] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Lesson form state
  const [newLesson, setNewLesson] = useState({
    title: '',
    skill: 'phonetics',
    level: 0,
    topic: 'vowels',
    orderIndex: 1,
    contentMarkdown: ''
  });

  // Handle JSON Textarea Changes with Realtime Validation
  const handleJsonChange = (text) => {
    setJsonInput(text);
    if (!text.trim()) {
      setParsedItems(null);
      setJsonError(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed)
        ? parsed
        : parsed?.vocabularies || parsed?.items || [parsed];

      if (!Array.isArray(items) || items.length === 0) {
        setParsedItems(null);
        setJsonError('Dữ liệu JSON phải là một mảng danh sách từ vựng [ { ... }, { ... } ]');
      } else {
        setParsedItems(items);
        setJsonError(null);
      }
    } catch (err) {
      setParsedItems(null);
      setJsonError(`Lỗi cú pháp JSON: ${err.message}`);
    }
  };

  // Handle JSON File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        handleJsonChange(content);
        setStatusMsg({ text: `Đã đọc thành công tệp: ${file.name}`, isError: false });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input to allow selecting same file again
  };

  // Submit Batch JSON to Backend
  const handleBatchSubmit = async () => {
    if (!parsedItems || parsedItems.length === 0) return;

    setIsSubmittingBatch(true);
    setStatusMsg({ text: 'Đang nạp dữ liệu từ vựng hàng loạt vào cơ sở dữ liệu...', isError: false });

    try {
      const res = await api.post('/admin/vocabularies/batch', parsedItems);
      const summary = `Nạp thành công ${res?.totalProcessed || parsedItems.length} từ vựng! (Mới thêm: ${res?.upsertedCount ?? 0}, Đã cập nhật: ${res?.modifiedCount ?? 0})`;
      setStatusMsg({ text: summary, isError: false });
    } catch (err) {
      setStatusMsg({ text: `Lỗi import hàng loạt: ${err.message}`, isError: true });
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Load Sample Template
  const loadSampleJson = () => {
    const formatted = JSON.stringify(SAMPLE_BATCH_JSON, null, 2);
    handleJsonChange(formatted);
    setStatusMsg({ text: 'Đã tải dữ liệu mẫu. Bạn có thể sửa hoặc bấm "Nạp vào Database".', isError: false });
  };

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
    <div className="stack" style={{ maxWidth: 960, margin: '0 auto', gap: 24 }}>
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
                Khu vực quản lý từ vựng, nạp hàng loạt bằng JSON và cây tri thức.
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
        <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'batch_json' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => { setActiveTab('batch_json'); setStatusMsg({ text: '', isError: false }); }}
          >
            <Code size={14} />
            <span>Dán JSON hàng loạt</span>
          </button>
          <button
            className={`btn ${activeTab === 'vocab' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => { setActiveTab('vocab'); setStatusMsg({ text: '', isError: false }); }}
          >
            <Layers size={14} />
            <span>Thêm từ vựng thủ công</span>
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

      {/* ─── Tab 1: Batch JSON Paste & Upload ─── */}
      {activeTab === 'batch_json' && (
        <div className="card">
          <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="card-title">
                <Code size={17} style={{ color: 'var(--color-cobalt)' }} />
                <span>Nạp từ vựng hàng loạt từ file JSON</span>
              </div>
              <p className="card-subtitle">
                Dán danh sách JSON hoặc tải file <code>.json</code> để tự động phân tích và lưu vào Database.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="row" style={{ gap: 8 }}>
              <label
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '7px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={13} />
                <span>Chọn file .json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '7px 12px' }}
                onClick={loadSampleJson}
              >
                Dán mẫu JSON
              </button>

              {jsonInput && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '7px 10px' }}
                  onClick={() => handleJsonChange('')}
                  title="Xóa nội dung"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Validation Status Indicator */}
          <div style={{ margin: '16px 0 10px' }}>
            {jsonError && (
              <span className="pill pill-err" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} />
                <span>{jsonError}</span>
              </span>
            )}
            {parsedItems && !jsonError && (
              <span className="pill pill-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} />
                <span>Hợp lệ: Đã nhận diện {parsedItems.length} từ vựng sẵn sàng nạp</span>
              </span>
            )}
          </div>

          {/* JSON Textarea */}
          <textarea
            className="input-text"
            rows={14}
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={'[\n  {\n    "word": "mitigate",\n    "ipa": "/ˈmɪt.ɪ.ɡeɪt/",\n    "pos": "verb",\n    "meaningVi": "làm giảm bớt, làm dịu bớt",\n    "exampleSentence": "Governments must act swiftly to ______ environmental damage.",\n    "topic": "environment",\n    "tier": 3\n  }\n]'}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre',
              tabSize: 2
            }}
          />

          {/* Preview of Parsed Items */}
          {parsedItems && parsedItems.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ fontSize: 13, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                Xem trước {Math.min(parsedItems.length, 3)} từ đầu tiên:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {parsedItems.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--surface-subtle)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      fontSize: 13
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{item.word || '(Thiếu từ)'}</span>
                      <span className="soft-pill" style={{ fontSize: 10 }}>{item.pos || 'n/a'}</span>
                    </div>
                    <div className="ipa" style={{ color: 'var(--color-cobalt)', fontSize: 12, margin: '2px 0 4px' }}>
                      {item.ipa || ''}
                    </div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.meaningVi || ''}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--fg-muted)' }}>
                      Chủ đề: <strong>{item.topic || 'general'}</strong> · Tier: <strong>{item.tier ?? 1}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleBatchSubmit}
              disabled={isSubmittingBatch || !parsedItems || parsedItems.length === 0 || !!jsonError}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} />
              <span>
                {isSubmittingBatch
                  ? 'Đang lưu vào Database...'
                  : `Nạp ngay vào hệ thống (${parsedItems ? parsedItems.length : 0} từ)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab 2: Single Vocab Form ─── */}
      {activeTab === 'vocab' && (
        <div className="card">
          <div className="card-title">
            <Plus size={16} />
            <span>Thêm từ vựng thủ công vào ngân hàng SRS</span>
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

      {/* ─── Tab 3: Lesson Form ─── */}
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
