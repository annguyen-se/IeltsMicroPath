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
  Headphones,
  Mic,
  Route,
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
      <header className="sticky top-0 z-50 bg-[#fbfaf8]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 h-16 flex items-center">
        <div className="w-full max-w-[1160px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => navigate('/admin')}
            role="button"
            tabIndex={0}
          >
            <div className="w-8 h-8 rounded-md bg-stone-800 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center border border-stone-300 dark:border-stone-700">
              <Settings size={17} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-sans font-semibold text-[15px] text-stone-800 dark:text-stone-100 tracking-tight">IELTS Writing Hub</span>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-stone-500">System Administration</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={13} />
              <span>Back to Student View</span>
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-md transition-colors"
              onClick={onLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ─── Student Learning Portal Header ───
  return (
    <header className="sticky top-0 z-50 bg-[#fbfaf8]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 h-16 flex items-center">
      <div className="w-full max-w-[1160px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        >
          <div className="w-8 h-8 rounded-md bg-stone-800 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center border border-stone-300 dark:border-stone-700">
            <PenLine size={16} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-sans font-semibold text-[15.5px] text-stone-800 dark:text-stone-100 tracking-tight">
              IELTS Master Studio
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
              4-Skill Adaptive Pathway
            </span>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-lg border border-stone-200 dark:border-stone-700/60 overflow-x-auto" aria-label="Primary Navigation">
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/') && !location.search.includes('reading') && !location.search.includes('listening')
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/')}
          >
            <LayoutDashboard size={14} />
            <span>Workspace</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/lessons') && !location.search.includes('reading') && !location.search.includes('listening')
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/lessons')}
          >
            <Route size={14} />
            <span>Lộ trình học</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/writing')
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/writing')}
          >
            <PenLine size={14} />
            <span>Writing Studio</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/reading') || (isCurrent('/lessons') && location.search.includes('reading'))
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/lessons?skill=reading')}
          >
            <BookOpen size={14} />
            <span>Reading</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/listening') || (isCurrent('/lessons') && location.search.includes('listening'))
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/lessons?skill=listening')}
          >
            <Headphones size={14} />
            <span>Listening</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/speaking')
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/speaking')}
          >
            <Mic size={14} />
            <span>Speaking</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/vocabulary') || isCurrent('/srs')
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/vocabulary')}
          >
            <Boxes size={14} />
            <span>Lexical Bank</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/typing')
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/typing')}
          >
            <Keyboard size={14} />
            <span>Typing</span>
          </button>
          <button
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isCurrent('/mistakes')
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
            }`}
            onClick={() => navigate('/mistakes')}
          >
            <ShieldAlert size={14} />
            <span>Mistakes</span>
          </button>
          {isAdmin && (
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isCurrent('/admin')
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
              }`}
              onClick={() => navigate('/admin')}
            >
              <Settings size={14} />
              <span>CMS</span>
            </button>
          )}
        </nav>

        {/* User Badges & Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAuthenticated && (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                <span><strong className="font-mono text-stone-800 dark:text-stone-100">{dashboardData?.user?.streak ?? 0}</strong>d streak</span>
              </span>
              {dashboardData?.user?.targetBand && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 whitespace-nowrap">
                  <Target size={13} className="text-orange-600" />
                  <span>Band <strong className="font-mono text-stone-800 dark:text-stone-100">{dashboardData.user.targetBand}</strong></span>
                </span>
              )}
            </>
          )}

          <button
            className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {isAuthenticated ? (
            <button
              className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-md transition-colors"
              onClick={onLogout}
            >
              Sign Out
            </button>
          ) : (
            <button
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-orange-700 hover:bg-orange-800 text-white shadow-sm transition-colors"
              onClick={onOpenAuth}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
