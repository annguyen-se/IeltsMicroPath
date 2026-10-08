import React, { useState } from 'react';
import api from '../../api/apiClient';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({
    email: 'learner@ielts.local',
    password: 'Password123!',
    targetBand: 6.5
  });
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const result = await api.post(endpoint, authForm);
      if (result?.token) {
        api.setToken(result.token);
        onAuthSuccess();
        onClose();
      }
    } catch (err) {
      setAuthError(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          {authMode === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký thành viên mới'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--fg-muted)', marginBottom: 20 }}>
          Hệ thống tự học IELTS thích ứng theo năng lực từ số 0
        </p>

        {authError && (
          <div style={{ background: 'var(--color-rose-surface)', color: 'var(--color-rose)', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 14, textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Email</label>
            <input
              type="email"
              className="input-text"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Mật khẩu</label>
            <input
              type="password"
              className="input-text"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
            />
          </div>
          {authMode === 'register' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700 }}>Mục tiêu IELTS Band (4.0 - 9.0)</label>
              <input
                type="number"
                step="0.5"
                min="4.0"
                max="9.0"
                className="input-text"
                value={authForm.targetBand}
                onChange={(e) => setAuthForm({ ...authForm, targetBand: parseFloat(e.target.value) })}
                required
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 13 }}>
          {authMode === 'login' ? (
            <span>Chưa có tài khoản? <a href="#register" style={{ color: 'var(--color-cobalt)', fontWeight: 700 }} onClick={(e) => { e.preventDefault(); setAuthMode('register'); }}>Đăng ký ngay</a></span>
          ) : (
            <span>Đã có tài khoản? <a href="#login" style={{ color: 'var(--color-cobalt)', fontWeight: 700 }} onClick={(e) => { e.preventDefault(); setAuthMode('login'); }}>Đăng nhập</a></span>
          )}
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
