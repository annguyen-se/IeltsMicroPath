import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  Boxes,
  ShieldAlert,
  Settings,
  Flame,
  Target,
  ArrowLeft,
  Sun,
  Moon,
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

  // ─── Dedicated Admin Portal Header ───
  if (path.startsWith('/admin')) {
    return (
      <header className='app-header' style={{ borderBottom: '2px solid var(--color-cobalt)' }}>
        <div className='header-inner'>
          <div className='brand' onClick={() => navigate('/admin')}>
            <div className='brand-mark' style={{ background: 'var(--color-cobalt)' }}>
              <Settings size={18} />
            </div>
            <span>IELTS Admin Portal</span>
            <span
              style={{
                fontSize: 11,
                background: 'var(--color-cobalt-soft)',
                color: 'var(--color-cobalt)',
                padding: '2px 8px',
                borderRadius: 999,
                fontWeight: 700,
              }}>
                Quản trị viên
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className='btn btn-ghost'
              style={{
                padding: '7px 9px',
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              aria-label='Toggle theme'>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className='btn btn-secondary'
              style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('/')}>
              <ArrowLeft size={14} />
              <span>Back to Student View</span>
            </button>
            <button className='btn btn-ghost' style={{ fontSize: 13 }} onClick={onLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ─── Student Learning Portal Header ───
  return (
    <header className='app-header'>
      <div className='header-inner'>
        <div className='brand' onClick={() => navigate('/')}>
          <div className='brand-mark'>
            <Sparkles size={18} />
          </div>
          <span>IELTS MicroPath</span>
        </div>

        <nav className='nav-tabs' aria-label='Application Sections'>
          <button
            className={`nav-tab ${isCurrent('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/lessons') ? 'active' : ''}`}
            onClick={() => navigate('/lessons')}>
            <BookOpen size={16} />
            <span>Lessons</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/srs') ? 'active' : ''}`}
            onClick={() => navigate('/srs')}>
            <Boxes size={16} />
            <span>Vocabulary</span>
          </button>
          <button
            className={`nav-tab ${isCurrent('/mistakes') ? 'active' : ''}`}
            onClick={() => navigate('/mistakes')}>
            <ShieldAlert size={16} />
            <span>Mistakes</span>
          </button>
          {isAdmin && (
            <button
              className={`nav-tab ${isCurrent('/admin') ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
              title='Admin CMS'>
              <Settings size={16} />
              <span>Admin CMS</span>
            </button>
          )}
        </nav>

        <div className='user-badge'>
          {isAuthenticated && (
            <>
              <span className='streak-chip' title='Current Learning Streak'>
                <Flame size={16} />
                <span>{dashboardData?.user?.streak ?? 0} days</span>
              </span>
              {dashboardData?.user?.targetBand && (
                <span className='target-chip'>
                  <Target size={15} />
                  <span>Target: Band {dashboardData.user.targetBand}</span>
                </span>
              )}
            </>
          )}

          <button
            className='btn btn-ghost'
            style={{
              padding: '7px 9px',
              borderRadius: 'var(--radius-pill)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label='Toggle theme'>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated ? (
            <button className='btn btn-ghost' style={{ fontSize: 13 }} onClick={onLogout}>
              Đăng xuất
            </button>
          ) : (
            <button className='btn btn-primary' style={{ padding: '6px 14px', fontSize: 13 }} onClick={onOpenAuth}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
