import React from 'react';
import { Target, BarChart2, Layers, AlertCircle, Settings, Flame } from 'lucide-react';

export default function AppHeader({ currentView, setCurrentView, dashboardData, isAuthenticated, onOpenAuth, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand" onClick={() => setCurrentView('dashboard')}>
          <div className="brand-mark">
            <Target size={18} />
          </div>
          <span>IELTS MicroPath</span>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <BarChart2 size={15} />
            <span>Tổng quan</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'srs' ? 'active' : ''}`}
            onClick={() => setCurrentView('srs')}
          >
            <Layers size={15} />
            <span>Ôn tập SRS</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'mistakes' ? 'active' : ''}`}
            onClick={() => setCurrentView('mistakes')}
          >
            <AlertCircle size={15} />
            <span>Sổ lỗi sai</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentView('admin')}
          >
            <Settings size={15} />
            <span>Quản trị CMS</span>
          </button>
        </nav>

        <div className="user-badge">
          <div className="streak-chip">
            <Flame size={14} />
            <span>{dashboardData.user.streak} ngày</span>
          </div>
          <div className="target-chip">
            <Target size={14} />
            <span>Band {dashboardData.user.targetBand}</span>
          </div>
          {isAuthenticated ? (
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={onLogout}>
              Đăng xuất
            </button>
          ) : (
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={onOpenAuth}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
