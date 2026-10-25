import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio } from '../../utils/audio';
import {
  BookOpen,
  Search,
  Volume2,
  Keyboard,
  Boxes,
  Plus,
  CheckCircle2,
  FolderOpen,
  Filter
} from 'lucide-react';

const formatTopicName = (topic) => {
  if (!topic) return '';
  const known = {
    'numbers': 'Chữ số & Đại lượng đo lường',
    'daily-life': 'Đời sống & Sinh hoạt hàng ngày',
    'geography': 'Địa lý & Quốc gia',
    'environment': 'Môi trường & Sinh thái học',
    'education': 'Giáo dục & Học đường',
    'technology': 'Khoa học & Công nghệ',
    'society': 'Xã hội & Kinh tế'
  };
  return known[topic] || topic.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const BOX_COLORS = {
  1: { bg: 'var(--color-rose-surface)', color: 'var(--color-rose)', border: 'var(--color-rose-border)' },
  2: { bg: 'var(--color-amber-surface)', color: 'var(--color-amber)', border: 'var(--color-amber-border)' },
  3: { bg: 'var(--color-cyan-surface)', color: 'var(--color-cyan)', border: 'var(--color-cyan-border)' },
  4: { bg: 'var(--color-violet-surface)', color: 'var(--color-violet)', border: 'var(--color-violet-border)' },
  5: { bg: 'var(--color-emerald-surface)', color: 'var(--color-emerald)', border: 'var(--color-emerald-border)' }
};

export default function TopicVocabList({ isAuthenticated = false, onOpenAuth }) {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [words, setWords] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPos, setSelectedPos] = useState('all');

  // Map of vocabId -> box number
  const [srsMap, setSrsMap] = useState({});
  const [enrolling, setEnrolling] = useState(false);
  const [notice, setNotice] = useState('');

  // 1. Fetch distinct topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const res = await api.get('/vocabulary/topics');
        const list = res?.topics || [];
        setTopics(list);
        if (list.length > 0) {
          const savedTopic = localStorage.getItem('ieltstrain_topic_selected');
          const initial = list.some((t) => t.topic === savedTopic) ? savedTopic : list[0].topic;
          setSelectedTopic(initial);
        }
      } catch (err) {
        console.warn('[Fetch Topics Error]:', err.message);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  // 2. Fetch words and user SRS status when topic changes
  useEffect(() => {
    if (!selectedTopic) return;
    localStorage.setItem('ieltstrain_topic_selected', selectedTopic);

    const fetchWordsAndSrs = async () => {
      setLoadingWords(true);
      try {
        const [vocabRes, srsRes] = await Promise.all([
          api.get(`/vocabulary?topic=${encodeURIComponent(selectedTopic)}&limit=500`),
          isAuthenticated ? api.get('/reviews/due?mode=all&limit=1000') : Promise.resolve(null)
        ]);

        setWords(vocabRes?.items || []);

        if (srsRes?.items) {
          const map = {};
          for (const item of srsRes.items) {
            const vId = item.vocabId?._id || item.vocabId;
            if (vId) map[vId.toString()] = item.box || 1;
          }
          setSrsMap(map);
        }
      } catch (err) {
        console.warn('[Fetch Topic Vocab Error]:', err.message);
      } finally {
        setLoadingWords(false);
      }
    };

    fetchWordsAndSrs();
  }, [selectedTopic, isAuthenticated]);

  // Enroll single word into SRS Box 1
  const handleEnrollSingle = async (vocabId) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      await api.post('/reviews/enroll', { vocabId });
      setSrsMap((prev) => ({ ...prev, [vocabId]: 1 }));
      setNotice('Đã thêm từ vào Hộp 1 SRS!');
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      setNotice(`Lỗi: ${err.message}`);
    }
  };

  // Enroll all words in this topic into SRS Box 1
  const handleEnrollAllInTopic = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const unenrolledIds = words.filter((w) => !srsMap[w._id]).map((w) => w._id);
    if (unenrolledIds.length === 0) {
      setNotice('Tất cả từ trong chủ đề này đã có trong lộ trình SRS.');
      setTimeout(() => setNotice(''), 2500);
      return;
    }

    setEnrolling(true);
    try {
      await api.post('/reviews/enroll', { vocabIds: unenrolledIds });
      const newMap = { ...srsMap };
      for (const id of unenrolledIds) {
        newMap[id] = 1;
      }
      setSrsMap(newMap);
      setNotice(`Đã nạp thành công ${unenrolledIds.length} từ vào Hộp 1 SRS!`);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(`Lỗi: ${err.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  // Filter words by search term and POS
  const filteredWords = words.filter((w) => {
    if (selectedPos !== 'all' && w.pos !== selectedPos) return false;
    if (!searchTerm.trim()) return true;

    const s = searchTerm.toLowerCase().trim();
    const matchWord = (w.word || '').toLowerCase().includes(s);
    const matchMeaning = (w.meaningVi || '').toLowerCase().includes(s);
    const matchExample = (w.exampleSentence || '').toLowerCase().includes(s);
    const matchCollo = Array.isArray(w.collocations) && w.collocations.some((c) => c.toLowerCase().includes(s));
    const matchPara = Array.isArray(w.paraphrases) && w.paraphrases.some((p) => p.toLowerCase().includes(s));

    return matchWord || matchMeaning || matchExample || matchCollo || matchPara;
  });

  const enrolledCount = words.filter((w) => srsMap[w._id]).length;

  return (
    <div className="stack" style={{ gap: 20 }}>
      {notice && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius)',
            background: 'var(--color-emerald-surface)',
            color: 'var(--color-emerald)',
            border: '1px solid var(--color-emerald-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* ─── Topic Selector Cards / Grid ─── */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FolderOpen size={18} style={{ color: 'var(--color-cobalt)' }} />
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Chọn chủ điểm từ vựng (Topic)</h2>
        </div>

        {loadingTopics ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: 13 }}>Đang tải danh sách chủ đề...</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {topics.map((t) => {
              const isSelected = selectedTopic === t.topic;
              const displayTitle = formatTopicName(t.topic);

              return (
                <button
                  key={t.topic}
                  onClick={() => setSelectedTopic(t.topic)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    fontSize: 13,
                    padding: '8px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 'var(--radius-pill)'
                  }}
                >
                  <span>{displayTitle}</span>
                  <span
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--surface-subtle)',
                      padding: '1px 7px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Selected Topic Header & Action Banner ─── */}
      <div className="card" style={{ padding: 22, background: 'var(--surface-subtle)' }}>
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: 'var(--color-cobalt-surface)',
                  color: 'var(--color-cobalt)',
                  border: '1px solid var(--color-cobalt-border)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                CHỦ ĐIỂM ĐANG CHỌN
              </span>
              <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                {words.length} từ vựng cốt lõi
              </span>
            </div>
            <h2 style={{ fontSize: 22, margin: '6px 0 4px', fontWeight: 800 }}>
              {TOPIC_NAMES_VI[selectedTopic] || selectedTopic.toUpperCase()}
            </h2>
            <p style={{ color: 'var(--fg-muted)', fontSize: 13.5, margin: 0 }}>
              Tiến độ lưu trữ: <strong>{enrolledCount} / {words.length} từ</strong> đã được đưa vào lộ trình 5 Hộp Leitner.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/typing')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <Keyboard size={15} style={{ color: 'var(--color-cobalt)' }} />
              <span>Luyện gõ từ vựng (Typing)</span>
            </button>

            {isAuthenticated && (
              <button
                className="btn btn-primary"
                onClick={handleEnrollAllInTopic}
                disabled={enrolling || enrolledCount === words.length}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                <Boxes size={15} />
                <span>
                  {enrolling
                    ? 'Đang nạp...'
                    : enrolledCount === words.length
                    ? '✓ Đã trong SRS'
                    : `+ Nạp tất cả vào SRS (${words.length - enrolledCount})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Search & POS Filter ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--fg-muted)'
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Tìm từ khóa, nghĩa, collocation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 36, fontSize: 13.5 }}
          />
        </div>

        {/* POS Filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--fg-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600 }}>Từ loại:</span>
          {['all', 'noun', 'verb', 'adj', 'adv', 'phrase'].map((pos) => (
            <button
              key={pos}
              className={`pill ${selectedPos === pos ? 'pill-cobalt' : 'pill-muted'}`}
              style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
              onClick={() => setSelectedPos(pos)}
            >
              {pos === 'all' ? 'Tất cả' : pos}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Vocabulary Cards Table ─── */}
      {loadingWords ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Đang tải danh sách từ vựng...</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Không tìm thấy từ vựng nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', width: 50 }}>#</th>
                  <th style={{ padding: '12px 14px', width: 44 }}>Phát âm</th>
                  <th style={{ padding: '12px 16px', width: 170 }}>Từ vựng & IPA</th>
                  <th style={{ padding: '12px 14px', width: 70 }}>Từ loại</th>
                  <th style={{ padding: '12px 16px', width: 220 }}>Nghĩa tiếng Việt</th>
                  <th style={{ padding: '12px 16px' }}>Collocations & Ví dụ</th>
                  <th style={{ padding: '12px 16px', width: 120, textAlign: 'center' }}>Leitner SRS</th>
                </tr>
              </thead>
              <tbody>
                {filteredWords.map((item, idx) => {
                  const srsBox = srsMap[item._id];
                  const boxStyle = srsBox ? BOX_COLORS[srsBox] : null;

                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-subtle)'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--fg-muted)', fontSize: 12.5 }}>
                        {idx + 1}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => playWordAudio(item.media?.url, item.word)}
                          title="Nghe phát âm chuẩn"
                          style={{ padding: 6, borderRadius: '50%' }}
                        >
                          <Volume2 size={17} style={{ color: 'var(--color-cobalt)' }} />
                        </button>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        <div style={{ fontSize: 16 }}>{item.word}</div>
                        {item.ipa && (
                          <div className="ipa" style={{ fontSize: 12, color: 'var(--color-cobalt)', fontWeight: 400 }}>
                            {item.ipa}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', fontStyle: 'italic', color: 'var(--fg-muted)', fontSize: 13 }}>
                        {item.pos}
                      </td>

                      <td style={{ padding: '12px 16px', color: 'var(--fg)', fontWeight: 600 }}>
                        {item.meaningVi}
                        {item.paraphrases && item.paraphrases.length > 0 && (
                          <div style={{ fontSize: 12, color: 'var(--color-emerald)', marginTop: 4, fontWeight: 500 }}>
                            ≈ {item.paraphrases.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--fg-muted)' }}>
                        {item.collocations && item.collocations.length > 0 && (
                          <div style={{ marginBottom: 4, color: 'var(--color-cobalt)', fontWeight: 600 }}>
                            {item.collocations.join(' · ')}
                          </div>
                        )}
                        {item.exampleSentence && (
                          <div style={{ fontStyle: 'italic', lineHeight: 1.45 }}>
                            "{item.exampleSentence}"
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {srsBox ? (
                          <span
                            style={{
                              background: boxStyle.bg,
                              color: boxStyle.color,
                              border: `1px solid ${boxStyle.border}`,
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: 11,
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Hộp {srsBox}
                          </span>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap', gap: 4 }}
                            onClick={() => handleEnrollSingle(item._id)}
                          >
                            <Plus size={11} />
                            <span>Thêm</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
