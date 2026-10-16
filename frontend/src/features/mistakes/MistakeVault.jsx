import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { ArrowLeft, RotateCw, AlertCircle, Clock, CheckCircle2, Lock } from 'lucide-react';

export default function MistakeVault({ onBack, isAuthenticated = false, onOpenAuth }) {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeRetestId, setActiveRetestId] = useState(null);
  const [retestAnswer, setRetestAnswer] = useState('');
  const [retestResult, setRetestResult] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMistakes();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMistakes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mistakes');
      setMistakes(res?.mistakes || []);
    } catch (err) {
      console.warn('[Fetch Mistakes Error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetestSubmit = async (mistakeId) => {
    try {
      const res = await api.post(`/mistakes/resolve/${mistakeId}`, {
        userAnswer: retestAnswer
      });
      if (res?.isCorrect) {
        setRetestResult({ mistakeId, isCorrect: true, message: 'Correct! Trap resolved and removed from vault.' });
        setTimeout(() => {
          setMistakes((prev) => prev.filter((m) => m._id !== mistakeId));
          setActiveRetestId(null);
          setRetestAnswer('');
          setRetestResult(null);
        }, 1200);
      } else {
        setRetestResult({ mistakeId, isCorrect: false, message: 'Not quite. Check the explanation and try again.' });
      }
    } catch (err) {
      setRetestResult({ mistakeId, isCorrect: false, message: err.message });
    }
  };

  const counts = {
    all: mistakes.length,
    ERR_LEX: mistakes.filter((m) => (m.errorCode || m.questionId?.errorTaxonomy) === 'ERR_LEX').length,
    ERR_SYN: mistakes.filter((m) => (m.errorCode || m.questionId?.errorTaxonomy) === 'ERR_SYN').length,
    ERR_PHO: mistakes.filter((m) => (m.errorCode || m.questionId?.errorTaxonomy) === 'ERR_PHO').length,
    ERR_DIS: mistakes.filter((m) => (m.errorCode || m.questionId?.errorTaxonomy) === 'ERR_DIS').length
  };

  const filteredMistakes = mistakes.filter((m) => {
    if (activeFilter === 'all') return true;
    return (m.errorCode || m.questionId?.errorTaxonomy) === activeFilter;
  });

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── Top Header ─── */}
      <div className="row-between">
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Mistake Vault</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 15 }}>
            Repository of all past question errors categorized by pedagogical error taxonomy.
          </p>
        </div>
        {onBack && (
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div className="empty-icon" style={{ width: 56, height: 56, margin: '0 auto 16px', background: 'var(--color-brick-soft)', color: 'var(--color-brick)', borderColor: 'var(--color-border)' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Mistake Vault Requires Authentication</h2>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14.5, maxWidth: 460, margin: '0 auto 24px' }}>
            Each student has a dedicated repository logging question errors and diagnostic root-cause taxonomies.
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={onOpenAuth}>
              <span>Sign In Now</span>
            </button>
            {onBack && (
              <button className="btn btn-secondary" onClick={onBack}>
                <span>Back to Workspace</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ─── Filter Tabs by Error Taxonomy ─── */}
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button
              className={`pill ${activeFilter === 'all' ? 'pill-cobalt' : 'pill-muted'}`}
              style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
              onClick={() => setActiveFilter('all')}
            >
              All ({counts.all})
            </button>
            <button
              className={`pill ${activeFilter === 'ERR_LEX' ? 'pill-err' : 'pill-muted'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveFilter('ERR_LEX')}
            >
              ERR_LEX: Lexical ({counts.ERR_LEX})
            </button>
            <button
              className={`pill ${activeFilter === 'ERR_SYN' ? 'pill-violet' : 'pill-muted'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveFilter('ERR_SYN')}
            >
              ERR_SYN: Syntax ({counts.ERR_SYN})
            </button>
            <button
              className={`pill ${activeFilter === 'ERR_PHO' ? 'pill-cobalt' : 'pill-muted'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveFilter('ERR_PHO')}
            >
              ERR_PHO: Phonetics ({counts.ERR_PHO})
            </button>
            <button
              className={`pill ${activeFilter === 'ERR_DIS' ? 'pill-success' : 'pill-muted'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveFilter('ERR_DIS')}
            >
              ERR_DIS: Discourse ({counts.ERR_DIS})
            </button>
          </div>

          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: 'var(--fg-muted)' }}>Loading mistakes repository...</p>
            </div>
          )}

          {!loading && filteredMistakes.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div className="empty-icon" style={{ width: 56, height: 56, margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: 22, marginBottom: 6 }}>No traps here!</h2>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14.5 }}>
                {activeFilter === 'all'
                  ? 'Your mistake vault is currently clean. Excellent work!'
                  : `No unresolved mistakes logged under ${activeFilter}.`}
              </p>
            </div>
          )}

          {/* ─── Mistake Cards List ─── */}
          <div className="stack" style={{ gap: 16 }}>
            {!loading &&
              filteredMistakes.map((m) => {
                const q = m.questionId || {};
                const code = m.errorCode || q.errorTaxonomy || 'ERR_LEX';
                const isRetesting = activeRetestId === m._id;

                return (
                  <div key={m._id} className="card">
                    <div className="row-between" style={{ marginBottom: 12 }}>
                      <span className={`pill ${code === 'ERR_SYN' ? 'pill-violet' : 'pill-err'}`}>
                        <AlertCircle size={12} />
                        <span>CODE: {code}</span>
                      </span>
                      <span className="pill pill-muted">
                        <Clock size={12} />
                        <span>Logged error</span>
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17.5, marginBottom: 8 }}>{q.prompt}</h3>

                    {m.userWrongAnswer && (
                      <p style={{ fontSize: 14, color: 'var(--color-rose)', marginBottom: 12 }}>
                        Your previous answer: <strong>"{m.userWrongAnswer}"</strong>
                      </p>
                    )}

                    {q.explanation && (
                      <div
                        style={{
                          background: 'var(--color-rose-surface)',
                          borderLeft: '4px solid var(--color-rose)',
                          padding: '12px 16px',
                          fontSize: 14,
                          marginBottom: 16,
                          borderRadius: 4
                        }}
                      >
                        <strong>Root Cause Analysis:</strong> {q.explanation}
                      </div>
                    )}

                    {!isRetesting ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setActiveRetestId(m._id);
                          setRetestAnswer('');
                          setRetestResult(null);
                        }}
                      >
                        <RotateCw size={15} />
                        <span>Retest this question</span>
                      </button>
                    ) : (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                        <div className="row" style={{ gap: 8 }}>
                          <input
                            type="text"
                            className="input-text"
                            placeholder="Type the correct answer..."
                            value={retestAnswer}
                            onChange={(e) => setRetestAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRetestSubmit(m._id)}
                            autoFocus
                          />
                          <button className="btn btn-primary" onClick={() => handleRetestSubmit(m._id)}>
                            Submit
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => {
                              setActiveRetestId(null);
                              setRetestResult(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>

                        {retestResult && retestResult.mistakeId === m._id && (
                          <p
                            style={{
                              marginTop: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              color: retestResult.isCorrect ? 'var(--color-emerald)' : 'var(--color-rose)'
                            }}
                          >
                            {retestResult.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
