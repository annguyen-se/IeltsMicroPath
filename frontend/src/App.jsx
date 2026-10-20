import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api/apiClient';
import AppHeader from './components/layout/AppHeader';
import StudentDashboard from './features/dashboard/StudentDashboard';
import MissionRunner from './features/mission/MissionRunner';
import SessionSummaryModal from './features/mission/SessionSummaryModal';
import VocabularyHub from './features/vocabulary/VocabularyHub';
import MistakeVault from './features/mistakes/MistakeVault';
import AdminCms from './features/admin/AdminCms';
import SkillCatalog from './features/lessons/SkillCatalog';
import TypingDrill from './features/typing/TypingDrill';
import ParaphraseExplorer from './features/reading/ParaphraseExplorer';
import ReadingPracticeRoom from './features/reading/ReadingPracticeRoom';
import WritingDrill from './features/writing/WritingDrill';
import AuthModal from './features/auth/AuthModal';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('ieltstrain_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('ieltstrain_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ieltstrain_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [dashboardData, setDashboardData] = useState({
    user: { email: '', currentLevel: 0, targetBand: null, streak: 0 },
    metrics: {
      srsDueCount: 0,
      unresolvedMistakesCount: 0,
      masteredNodesCount: 0,
      totalLevelNodesCount: 0,
      levelProgressPercent: 0,
    },
    dailyMissionStatus: { isCompletedToday: false, estimatedMinutes: null },
  });

  const [srsStats, setSrsStats] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [missionPayload, setMissionPayload] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    } else {
      setDashboardData({
        user: { email: '', currentLevel: 0, targetBand: null, streak: 0 },
        metrics: {
          srsDueCount: 0,
          unresolvedMistakesCount: 0,
          masteredNodesCount: 0,
          totalLevelNodesCount: 0,
          levelProgressPercent: 0,
        },
        dailyMissionStatus: { isCompletedToday: false, estimatedMinutes: null },
      });
      setSrsStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      if (location.pathname.startsWith('/admin')) {
        navigate('/');
      }
    }
  }, [isAuthenticated]);

  const fetchDashboard = async () => {
    try {
      const data = await api.get('/dashboard');
      if (data) setDashboardData(data);

      const stats = await api.get('/reviews/stats');
      if (stats?.boxDistribution) setSrsStats(stats.boxDistribution);
    } catch (err) {
      console.warn('[Fetch Dashboard Warning]:', err.message);
    }
  };

  const handleStartMission = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      const data = await api.get('/learning/today');
      setMissionPayload(data || null);
    } catch (err) {
      console.warn('[Fetch Mission Warning]:', err.message);
      setMissionPayload(null);
    }
    navigate('/mission');
  };

  const handleFinishMission = (summary) => {
    setSummaryData(summary);
    setShowSummaryModal(true);
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    navigate('/');
    fetchDashboard();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* ─── Modular App Header ─── */}
      <AppHeader
        dashboardData={dashboardData}
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={() => {
          api.setToken(null);
          setIsAuthenticated(false);
          navigate('/');
        }}
      />

      {/* ─── Main Content Views (Routed via react-router-dom) ─── */}
      <main className='app-main'>
        <Routes>
          <Route
            path='/'
            element={
              <StudentDashboard
                dashboardData={dashboardData}
                srsStats={srsStats}
                isAuthenticated={isAuthenticated}
                onStartMission={handleStartMission}
                onSwitchView={(view) => {
                  if (view.startsWith('lessons')) {
                    navigate(`/${view}`);
                  } else {
                    navigate(view === 'dashboard' ? '/' : `/${view}`);
                  }
                }}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />
          <Route path='/dashboard' element={<Navigate to='/' replace />} />

          <Route
            path='/lessons'
            element={
              <SkillCatalog
                isAuthenticated={isAuthenticated}
                onBack={() => navigate('/')}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path='/mission'
            element={
              <MissionRunner
                missionPayload={missionPayload}
                onFinish={handleFinishMission}
                onExit={() => navigate('/')}
              />
            }
          />

          <Route
            path='/vocabulary'
            element={
              <VocabularyHub
                isAuthenticated={isAuthenticated}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />
          <Route
            path='/srs'
            element={
              <VocabularyHub
                isAuthenticated={isAuthenticated}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path='/typing'
            element={
              <TypingDrill
                isAuthenticated={isAuthenticated}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path='/paraphrases'
            element={
              <ParaphraseExplorer
                isAuthenticated={isAuthenticated}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path='/reading/:lessonId'
            element={
              <ReadingPracticeRoom
                isAuthenticated={isAuthenticated}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path='/writing'
            element={
              <WritingDrill
                isAuthenticated={isAuthenticated}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path='/mistakes'
            element={
              <MistakeVault
                isAuthenticated={isAuthenticated}
                onBack={() => navigate('/')}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route path='/admin' element={<AdminCms onBackToStudent={() => navigate('/')} />} />

          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </main>

      {/* ─── Modals ─── */}
      <SessionSummaryModal isOpen={showSummaryModal} summaryData={summaryData} onClose={handleCloseSummary} />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          fetchDashboard();
        }}
      />
    </div>
  );
}
