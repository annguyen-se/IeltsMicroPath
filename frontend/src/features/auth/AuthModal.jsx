import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { X, Lock, Mail, Target, ArrowRight, AlertCircle, Compass } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    targetBand: '7.0'
  });
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = {
        email: authForm.email.trim(),
        password: authForm.password,
        ...(authMode === 'register' ? { targetBand: parseFloat(authForm.targetBand) || 7.0 } : {})
      };
      const result = await api.post(endpoint, payload);
      if (result?.token) {
        api.setToken(result.token);
        onAuthSuccess();
        onClose();
      }
    } catch (err) {
      setAuthError(err.message || (authMode === 'login' ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.' : 'Đăng ký thất bại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const TARGET_BANDS = ['6.0', '6.5', '7.0', '7.5', '8.0'];

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-left">
        {/* Top Header Row with Close Button */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-500 mb-1">
              <Compass size={13} aria-hidden="true" /> IELTS MicroPath Account
            </span>
            <h2 id="auth-modal-title" className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight">
              {authMode === 'login' ? 'Đăng nhập không gian học' : 'Tạo tài khoản học viên mới'}
            </h2>
          </div>
          <button
            type="button"
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-5">
          {authMode === 'login'
            ? 'Đồng bộ tiến độ học tập, lưu lại 5 Hộp ghi nhớ Leitner và kho lỗi sai cá nhân.'
            : 'Thiết lập lộ trình tự học cá nhân hóa với hệ thống bài tập và gia sư hướng dẫn.'}
        </p>

        {/* Mode Segmented Switcher */}
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700 mb-4">
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authMode === 'login'
                ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authMode === 'register'
                ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            onClick={() => {
              setAuthMode('register');
              setAuthError('');
            }}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Error Alert */}
        {authError && (
          <div
            className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60 p-3 rounded-lg mb-4 text-xs"
            role="alert"
          >
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            <span>{authError}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Địa chỉ Email
            </label>
            <input
              type="email"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 text-sm transition-all"
              placeholder="tenhocvien@example.com"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 text-sm transition-all"
              placeholder="Tối thiểu 8 ký tự"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
              minLength={8}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Mục tiêu IELTS Band mong muốn
              </label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {TARGET_BANDS.map((band) => (
                  <button
                    key={band}
                    type="button"
                    className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                      authForm.targetBand === band
                        ? 'bg-orange-700 text-white border-orange-700 font-semibold'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                    onClick={() => setAuthForm({ ...authForm, targetBand: band })}
                  >
                    Band {band}
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.5"
                min="4.0"
                max="9.0"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 text-sm transition-all font-mono"
                placeholder="Hoặc nhập band tùy chọn (4.0 - 9.0)"
                value={authForm.targetBand}
                onChange={(e) => setAuthForm({ ...authForm, targetBand: e.target.value })}
                required
              />
            </div>
          )}

          <div className="mt-1.5">
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-orange-700 hover:bg-orange-800 active:translate-y-px rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng nhập vào bài học' : 'Tạo tài khoản và bắt đầu')}</span>
              {!isSubmitting && <ArrowRight size={15} aria-hidden="true" />}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-center text-xs text-stone-500">
          {authMode === 'login' ? (
            <span>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                className="text-orange-700 dark:text-orange-500 font-semibold hover:underline"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
              >
                Đăng ký thành viên
              </button>
            </span>
          ) : (
            <span>
              Đã có tài khoản?{' '}
              <button
                type="button"
                className="text-orange-700 dark:text-orange-500 font-semibold hover:underline"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
              >
                Đăng nhập ngay
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
