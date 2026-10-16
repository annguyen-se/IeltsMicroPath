import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SrsReviewRoom from '../srs/SrsReviewRoom';
import TopicVocabList from './TopicVocabList';
import { Boxes, BookOpen } from 'lucide-react';

export default function VocabularyHub({ isAuthenticated = false, onOpenAuth }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab: 'srs' | 'topics'
  const currentTab = searchParams.get('tab') === 'topics' ? 'topics' : 'srs';

  const handleSwitchTab = (tabKey) => {
    setSearchParams(tabKey === 'srs' ? {} : { tab: tabKey });
  };

  return (
    <div className="container" style={{ maxWidth: 1040, paddingTop: 16, paddingBottom: 40 }}>
      {/* ─── Top Main Navigation Hub (Leitner SRS vs Topic Vocab) ─── */}
      <div
        className="card"
        style={{
          padding: '8px 12px',
          marginBottom: 20,
          background: 'var(--surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${currentTab === 'srs' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: 13.5,
              padding: '8px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 'var(--radius)'
            }}
            onClick={() => handleSwitchTab('srs')}
          >
            <Boxes size={17} />
            <span>1. Leitner Review (5-Box SRS)</span>
          </button>

          <button
            className={`btn ${currentTab === 'topics' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: 13.5,
              padding: '8px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 'var(--radius)'
            }}
            onClick={() => handleSwitchTab('topics')}
          >
            <BookOpen size={17} />
            <span>2. Lexis by Topic (IELTS Themes)</span>
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', paddingRight: 8 }}>
          {currentTab === 'srs'
            ? 'Spaced repetition queue across 5 Ebbinghaus boxes'
            : 'Explore academic vocabulary organized by test domain'}
        </div>
      </div>

      {/* ─── Active Tab Content ─── */}
      {currentTab === 'srs' ? (
        <SrsReviewRoom
          isAuthenticated={isAuthenticated}
          onOpenAuth={onOpenAuth}
          onBack={() => navigate('/')}
        />
      ) : (
        <TopicVocabList
          isAuthenticated={isAuthenticated}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
}
