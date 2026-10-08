import React, { useState, useEffect } from 'react';
import api from './api/apiClient';
import AppHeader from './components/layout/AppHeader';
import DailyMissionCard from './features/dashboard/DailyMissionCard';
import LeitnerBoxGrid from './features/dashboard/LeitnerBoxGrid';
import LevelProgressCard from './features/dashboard/LevelProgressCard';
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

  const [dashboardData, setDashboardData] = useState({
    user: { email: 'learner@ielts.local', currentLevel: 0, targetBand: 6.5, streak: 5 },
    metrics: { srsDueCount: 12, unresolvedMistakesCount: 3, masteredNodesCount: 14, totalLevelNodesCount: 25, levelProgressPercent: 56 },
    dailyMissionStatus: { isCompletedToday: false, estimatedMinutes: 25 }
  });

  const [srsStats, setSrsStats] = useState({ 1: 3, 2: 4, 3: 5, 4: 2, 5: 8 });
  const [missionPayload, setMissionPayload] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, [isAuthenticated]);

  const fetchDashboard = async () => {
    try {
      const data = await api.get('/dashboard');
      if (data) setDashboardData(data);

      const stats = await api.get('/reviews/stats');
      if (stats?.boxDistribution) setSrsStats(stats.boxDistribution);
    } catch (err) {
      console.warn('[Offline / Local State Fallback]:', err.message);
    }
  };

  const handleStartMission = async () => {
    try {
      const data = await api.get('/learning/today');
      if (data) setMissionPayload(data);
    } catch (err) {
      console.warn('[Using Local Mission Fallback]:', err.message);
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
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={() => {
          api.setToken(null);
          setIsAuthenticated(false);
        }}
      />

      {/* ─── Main Content Views ─── */}
      <main className="app-main">
        {currentView === 'dashboard' && (
          <div className="stack">
            <DailyMissionCard
              metrics={dashboardData.metrics}
              onStartMission={handleStartMission}
            />
            <div className="grid-dashboard">
              <LeitnerBoxGrid srsStats={srsStats} />
              <LevelProgressCard
                levelProgressPercent={dashboardData.metrics.levelProgressPercent}
                masteredCount={dashboardData.metrics.masteredNodesCount}
                totalCount={dashboardData.metrics.totalLevelNodesCount}
              />
            </div>
          </div>
        )}

        {currentView === 'mission' && (
          <MissionRunner
            missionPayload={missionPayload}
            onFinish={handleFinishMission}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'srs' && <SrsReviewRoom />}

        {currentView === 'mistakes' && <MistakeVault />}

        {currentView === 'admin' && <AdminCms />}
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
