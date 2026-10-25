import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/apiClient';
import { playWordAudio } from '../../utils/audio';
import {
  BookOpen,
  Search,
  Volume2,
  ArrowLeft,
  Sparkles,
  Layers,
  Keyboard,
  Plus,
  Check,
  CheckCircle2,
  Filter
} from 'lucide-react';

const TIERS = [
  { key: 'all', label: 'All Pairs', desc: 'Complete catalogue of academic paraphrase pairs' },
  { key: '1', label: 'Tier 1 (90% Freq)', desc: '90% frequency occurrence in IELTS academic passages' },
  { key: '2', label: 'Tier 2 (60% Freq)', desc: '60% frequency occurrence in academic passages' },
  { key: '3', label: 'Tier 3 (Past Tests)', desc: 'Verified synonym traps extracted from past test papers' },
];

export default function ParaphraseExplorer({ isAuthenticated = false, onOpenAuth }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialWord = searchParams.get('word') || '';
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchTerm, setSearchTerm] = useState(initialWord);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledSet, setEnrolledSet] = useState(new Set());
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchParaphrases();
  }, [selectedTier]);

  const fetchParaphrases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTier !== 'all') params.append('tier', selectedTier);
      params.append('limit', '500');

      const res = await api.get(`/vocabulary/paraphrases?${params.toString()}`);
      setItems(res?.items || []);
    } catch (err) {
      console.warn('[Fetch Paraphrases Error]:', err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollSingle = async (vocabId) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      await api.post('/reviews/enroll', { vocabIds: [vocabId] });
      setEnrolledSet((prev) => new Set([...prev, vocabId]));
      setNotice('Đã thêm từ vào Hộp 1 SRS!');
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      setNotice(`Lỗi: ${err.message}`);
    }
  };

  const filteredItems = items.filter((item) => {
    const itemTier = item.readingTier ?? item.tier;
    if (selectedTier !== 'all' && String(itemTier) !== String(selectedTier)) return false;

    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase().trim();
    const matchWord = (item.word || '').toLowerCase().includes(s);
    const matchMeaning = (item.meaningVi || '').toLowerCase().includes(s);
    const matchPara = Array.isArray(item.paraphrases) && item.paraphrases.some((p) => p.toLowerCase().includes(s));
    return matchWord || matchMeaning || matchPara;
  });

  return (
    <div className="container" style={{ maxWidth: 1040, paddingTop: 16, paddingBottom: 40 }}>
      {/* ─── Top Control Bar ─── */}
      <div className="row-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Workspace</span>
          </button>
          <div>
            <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={20} style={{ color: 'var(--color-accent)' }} />
              <span>Reading Paraphrase & Lexical Traps {paraphrases.length > 0 ? `(${paraphrases.length} Pairs)` : ''}</span>
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: 13, margin: '2px 0 0' }}>
              Master high-frequency paraphrase pairs and synonym traps across IELTS academic passages.
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/typing')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Keyboard size={14} />
          <span>Typing Drill</span>
        </button>
      </div>

      {notice && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 16px',
            borderRadius: 'var(--radius)',
            background: 'var(--color-emerald-surface)',
            color: 'var(--color-emerald)',
            border: '1px solid var(--color-emerald-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* ─── Filters & Search Header ─── */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Tier Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIERS.map((t) => (
              <button
                key={t.key}
                className={`btn ${selectedTier === t.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 13, padding: '6px 14px' }}
                onClick={() => setSelectedTier(t.key)}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--fg-muted)'
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Tìm từ khóa, nghĩa, từ đồng nghĩa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 32, fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* ─── Words Table / Grid ─── */}
      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Đang tải danh mục từ khóa đồng nghĩa...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Không tìm thấy từ khóa nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', width: 60 }}>#</th>
                  <th style={{ padding: '12px 16px', width: 50 }}>Audio</th>
                  <th style={{ padding: '12px 16px', width: 180 }}>Keyword</th>
                  <th style={{ padding: '12px 16px', width: 80 }}>POS</th>
                  <th style={{ padding: '12px 16px', width: 220 }}>Vietnamese Meaning</th>
                  <th style={{ padding: '12px 16px' }}>Paraphrases & Synonym Traps</th>
                  <th style={{ padding: '12px 16px', width: 100, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const isEnrolled = enrolledSet.has(item._id);
                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: index % 2 === 0 ? 'var(--surface)' : 'var(--surface-subtle)'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--fg-muted)', fontSize: 13 }}>
                        {index + 1}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => playWordAudio(item.media?.url, item.word)}
                          title="Nghe phát âm"
                          style={{ padding: 6, borderRadius: '50%' }}
                        >
                          <Volume2 size={18} style={{ color: 'var(--color-cobalt)' }} />
                        </button>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        <span style={{ fontSize: 16 }}>{item.word}</span>
                        {item.ipa && (
                          <div className="ipa" style={{ fontSize: 12, color: 'var(--color-cobalt)', fontWeight: 400 }}>
                            {item.ipa}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', fontStyle: 'italic', color: 'var(--fg-muted)' }}>
                        {item.pos}
                      </td>

                      <td style={{ padding: '12px 16px', color: 'var(--fg)', fontWeight: 500 }}>
                        {item.meaningVi}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {Array.isArray(item.paraphrases) && item.paraphrases.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {item.paraphrases.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                style={{
                                  background: 'var(--color-emerald-soft)',
                                  color: 'var(--color-emerald)',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: 12,
                                  fontWeight: 600
                                }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--fg-muted)', fontSize: 13 }}>-</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          className={`btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
                          onClick={() => handleEnrollSingle(item._id)}
                          disabled={isEnrolled}
                          title={isEnrolled ? 'Enrolled in Box 1' : 'Enroll into Leitner Box 1'}
                        >
                          {isEnrolled ? '✓ Enrolled' : '+ Box 1'}
                        </button>
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
