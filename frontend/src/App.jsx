import React, { useState, useEffect } from 'react';
import api from './api/apiClient';
import AppHeader from './components/layout/AppHeader';
import StudentDashboard from './features/dashboard/StudentDashboard';
import MissionRunner from './features/mission/MissionRunner';
import SessionSummaryModal from './features/mission/SessionSummaryModal';
import SrsReviewRoom from './features/srs/SrsReviewRoom';
import MistakeVault from './features/mistakes/MistakeVault';
import AdminCms from './features/admin/AdminCms';
import AuthModal from './features/auth/AuthModal';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'mission' | 'srs' | 'mistakes' | 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('ieltstrain_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('ieltstrain_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ieltstrain_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [dashboardData, setDashboardData] = useState({
    user: { email: '', currentLevel: 0, targetBand: null, streak: 0 },
    metrics: { srsDueCount: 0, unresolvedMistakesCount: 0, masteredNodesCount: 0, totalLevelNodesCount: 0, levelProgressPercent: 0 },
    dailyMissionStatus: { isCompletedToday: false, estimatedMinutes: null }
  });

  const [srsStats, setSrsStats] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [missionPayload, setMissionPayload] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    } else {
      setDashboardData({
        user: { email: '', currentLevel: 0, targetBand: null, streak: 0 },
        metrics: { srsDueCount: 0, unresolvedMistakesCount: 0, masteredNodesCount: 0, totalLevelNodesCount: 0, levelProgressPercent: 0 },
        dailyMissionStatus: { isCompletedToday: false, estimatedMinutes: null }
      });
      setSrsStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      if (currentView === 'admin') {
        setCurrentView('dashboard');
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
    setCurrentView('mission');
  };

  const handleFinishMission = (summary) => {
    setSummaryData(summary);
    setShowSummaryModal(true);
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    setCurrentView('dashboard');
    fetchDashboard();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* ─── Modular App Header ─── */}
      <AppHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        dashboardData={dashboardData}
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={() => {
          api.setToken(null);
          setIsAuthenticated(false);
          setCurrentView('dashboard');
        }}
      />

      {/* ─── Main Content Views ─── */}
      <main className="app-main">
        {currentView === 'dashboard' && (
          <StudentDashboard
            dashboardData={dashboardData}
            srsStats={srsStats}
            isAuthenticated={isAuthenticated}
            onStartMission={handleStartMission}
            onSwitchView={(view) => setCurrentView(view)}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentView === 'mission' && (
          <MissionRunner
            missionPayload={missionPayload}
            onFinish={handleFinishMission}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'srs' && (
          <SrsReviewRoom
            isAuthenticated={isAuthenticated}
            onBack={() => setCurrentView('dashboard')}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentView === 'mistakes' && (
          <MistakeVault
            isAuthenticated={isAuthenticated}
            onBack={() => setCurrentView('dashboard')}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentView === 'admin' && <AdminCms onBackToStudent={() => setCurrentView('dashboard')} />}
      </main>

      {/* ─── Modals ─── */}
      <SessionSummaryModal
        isOpen={showSummaryModal}
        summaryData={summaryData}
        onClose={handleCloseSummary}
      />

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
