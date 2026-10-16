/* Hallmark · macrostructure: Workbench · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PenLine,
  LayoutDashboard,
  GraduationCap,
  Boxes,
  ShieldAlert,
  Settings,
  Target,
  ArrowLeft,
  Sun,
  Moon,
  Keyboard,
  BookOpen,
} from 'lucide-react';

export default function AppHeader({
  dashboardData,
  isAuthenticated,
  onOpenAuth,
  onLogout,
  theme,
  onToggleTheme,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = isAuthenticated && dashboardData?.user?.role === 'admin';
  const path = location.pathname;

  const isCurrent = (p) => {
    if (p === '/' || p === '/dashboard') return path === '/' || path === '/dashboard';
    return path.startsWith(p);
  };

  // ─── Dedicated Admin Header ───
  if (path.startsWith('/admin')) {
    return (
      <header className='app-header'>
        <div className='header-inner'>
          <div className='brand' onClick={() => navigate('/admin')}>
            <div className='brand-mark'>
              <Settings size={17} />
            </div>
            <div className='brand-title'>
              <span className='brand-name'>IELTS Writing Hub</span>
              <span className='brand-sub'>System Administration</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className='btn btn-ghost'
              style={{ padding: '6px 10px' }}
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
              aria-label='Toggle theme'>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              className='btn btn-secondary btn-sm'
              onClick={() => navigate('/')}>
              <ArrowLeft size={13} />
              <span>Back to Student View</span>
            </button>
            <button className='btn btn-ghost btn-sm' onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ─── Student Learning Portal Header (English Primary Language) ───
  return (
    <header className='app-header'>
      <div className='header-inner'>
        <div
          className='brand'
          onClick={() => navigate('/')}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>
          <div className='brand-mark' aria-hidden='true'>
            <PenLine size={16} />
          </div>
          <div className='brand-title'>
            <span className='brand-name'>IELTS Writing Hub</span>
            <span className='brand-sub'>Studio & Guided Practice</span>
          </div>
        </div>

        <nav className='nav-tabs' aria-label='Primary Navigation'>
          <button
            className={`nav-tab ${isCurrent('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}>
            <LayoutDashboard size={14} />
            <span>Workspace</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/lessons') && !location.search.includes('reading') ? 'active' : ''}`}
            onClick={() => navigate('/lessons')}>
            <GraduationCap size={14} />
            <span>Curriculum</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/writing') ? 'active' : ''}`}
            onClick={() => navigate('/writing')}>
            <PenLine size={14} />
            <span>Writing Studio</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/reading') || (isCurrent('/lessons') && location.search.includes('reading')) ? 'active' : ''}`}
            onClick={() => navigate('/lessons?skill=reading')}>
            <BookOpen size={14} />
            <span>Reading & Paraphrase</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/vocabulary') || isCurrent('/srs') ? 'active' : ''}`}
            onClick={() => navigate('/vocabulary')}>
            <Boxes size={14} />
            <span>Lexical Bank</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/typing') ? 'active' : ''}`}
            onClick={() => navigate('/typing')}>
            <Keyboard size={14} />
            <span>Typing Drill</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/mistakes') ? 'active' : ''}`}
            onClick={() => navigate('/mistakes')}>
            <ShieldAlert size={14} />
            <span>Mistake Vault</span>
          </button>
          {isAdmin && (
            <button
              className={`nav-tab ${isCurrent('/admin') ? 'active' : ''}`}
              onClick={() => navigate('/admin')}>
              <Settings size={14} />
              <span>CMS</span>
            </button>
          )}
        </nav>

        <div className='user-badge'>
          {isAuthenticated && (
            <>
              <span className='streak-chip' title='Consecutive Learning Streak'>
                <span className='dot-active' aria-hidden='true'></span>
                <span><strong>{dashboardData?.user?.streak ?? 0}</strong> Day Streak</span>
              </span>
              {dashboardData?.user?.targetBand && (
                <span className='target-chip' title='Target Band Score'>
                  <Target size={13} aria-hidden='true' />
                  <span>Target: <strong>Band {dashboardData.user.targetBand}</strong></span>
                </span>
              )}
            </>
          )}

          <button
            className='btn btn-ghost'
            style={{ padding: '6px 8px' }}
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label='Toggle color theme'>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {isAuthenticated ? (
            <button className='btn btn-ghost btn-sm' onClick={onLogout}>
              Sign Out
            </button>
          ) : (
            <button className='btn btn-primary btn-sm' onClick={onOpenAuth}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
