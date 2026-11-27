import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [highlightInputs, setHighlightInputs] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e, customEmail, customPassword) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyPersona = (personaEmail, personaPassword) => {
    setEmail(personaEmail);
    setPassword(personaPassword);
    setHighlightInputs(true);
    setTimeout(() => {
      setHighlightInputs(false);
    }, 700);
  };

  return (
    <div className="login-custom-container">
      <style>{css}</style>

      {/* Main Content */}
      <main className="lc-main">
        <div className="lc-main-inner">
          {/* Subtle Ambient Decorative Glow Spheres */}
          <div className="lc-glow lc-glow-1"></div>
          <div className="lc-glow lc-glow-2"></div>
          <div className="lc-glow lc-glow-3"></div>

          {/* Top Prompt Context Bar */}
          <div className="lc-top-bar">
            <Link to="/" className="lc-brand-clean">
              <div className="lc-brand-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>hub</span>
              </div>
              <span className="lc-brand-title">KOLABORIN</span>
            </Link>
            <div className="lc-register-prompt">
              Belum punya akun?{' '}
              <Link to="/register" className="lc-register-link">
                Buat Akun Gratis
              </Link>
            </div>
          </div>

          {/* Main Unified Authentication Card */}
          <div className="lc-card">
            {/* Header Hero Strip */}
            <div className="lc-card-hero">
              <div className="lc-hero-top">
                <div className="lc-hero-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>hub</span>
                </div>
              </div>
              <h1 className="lc-card-title">Selamat Datang di KOLABORIN</h1>
              <p className="lc-card-desc">
                Masuk ke platform kolaborasi akademik dan jaringan mahasiswa ITB.
              </p>
            </div>

            <div className="lc-card-body">
              {error && (
                <div className="lc-error-banner">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Standard Credentials Form */}
              <form onSubmit={handleLoginSubmit} className="lc-form">
                {/* Field 1: Identifier */}
                <div className="lc-form-field">
                  <label className="lc-label" htmlFor="campus-identity">
                    <span>Email Kampus</span>
                    <span className="lc-label-hint">Gunakan email yang terdaftar</span>
                  </label>
                  <div className="lc-input-wrapper">
                    <span className="material-symbols-outlined lc-input-icon">badge</span>
                    <input
                      id="campus-identity"
                      className={`lc-input ${highlightInputs ? 'lc-input-highlight' : ''}`}
                      type="text"
                      required
                      placeholder="nama@kampus.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="lc-form-field">
                  <div className="lc-label-row">
                    <label className="lc-label" htmlFor="campus-password">Kata Sandi</label>
                    <span className="lc-forgot-link">Lupa Kata Sandi?</span>
                  </div>
                  <div className="lc-input-wrapper">
                    <span className="material-symbols-outlined lc-input-icon">lock</span>
                    <input
                      id="campus-password"
                      className={`lc-input ${highlightInputs ? 'lc-input-highlight' : ''}`}
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Tampilkan atau sembunyikan sandi"
                      className="lc-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`lc-submit-btn ${submitting ? 'lc-submit-submitting' : ''}`}
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined lc-spin" style={{ fontSize: '20px' }}>sync</span>
                      <span>Mengotentikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Workspace Kolaborin</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Prototype Demo Switcher Card */}
              <div className="lc-demo-box">
                <div className="lc-demo-header">
                  <div className="lc-demo-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#885500' }}>developer_mode</span>
                    <span>Demo Prototype Persona Quick Access</span>
                  </div>
                  <span className="lc-demo-badge">1-Click Fill</span>
                </div>
                <p className="lc-demo-desc">
                  Pilih profil simulasi di bawah untuk menguji alur multi-role tanpa mengisi form manual:
                </p>

                <div className="lc-persona-list">
                  {/* Persona 1: Student */}
                  <button
                    type="button"
                    className="lc-persona-item"
                    onClick={() => applyPersona('mikail@kolaborin.test', 'Password123!')}
                  >
                    <div className="lc-persona-left">
                      <div className="lc-persona-avatar bg-indigo-light">MK</div>
                      <div className="lc-persona-info">
                        <span className="lc-persona-name">Mikail (Mahasiswa)</span>
                        <span className="lc-persona-role">Mahasiswa STEI '22 • mikail@kolaborin.test</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined lc-persona-arrow">login</span>
                  </button>

                  {/* Persona 2: Organization */}
                  <button
                    type="button"
                    className="lc-persona-item"
                    onClick={() => applyPersona('hima@kolaborin.test', 'Password123!')}
                  >
                    <div className="lc-persona-left">
                      <div className="lc-persona-avatar bg-emerald-light">HM</div>
                      <div className="lc-persona-info">
                        <span className="lc-persona-name">HMIF ITB (Organisasi)</span>
                        <span className="lc-persona-role">Pemilik Organisasi Terverifikasi • hima@kolaborin.test</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined lc-persona-arrow">login</span>
                  </button>

                  {/* Persona 3: Admin */}
                  <button
                    type="button"
                    className="lc-persona-item"
                    onClick={() => applyPersona('admin@kolaborin.test', 'Password123!')}
                  >
                    <div className="lc-persona-left">
                      <div className="lc-persona-avatar bg-amber-light">AD</div>
                      <div className="lc-persona-info">
                        <span className="lc-persona-name">Admin KOLABORIN</span>
                        <span className="lc-persona-role">Administrator Kampus • admin@kolaborin.test</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined lc-persona-arrow">login</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const css = `
.login-custom-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #faf8ff;
  color: #131b2e;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 22px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.login-custom-container * {
  box-sizing: border-box;
}

.lc-brand-clean {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}
.lc-brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #3525cd;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(53, 37, 205, 0.25);
}
.lc-brand-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #3525cd;
}

/* Main */
.lc-main {
  flex: 1;
  width: 100%;
  background: linear-gradient(180deg, #faf8ff 0%, rgba(242, 243, 255, 0.5) 50%, rgba(218, 226, 253, 0.25) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.lc-main-inner {
  position: relative;
  width: 100%;
  max-width: 100%;
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Glow */
.lc-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 9999px;
  z-index: 0;
}
.lc-glow-1 {
  top: -80px; left: -80px;
  width: 380px; height: 380px;
  background-color: rgba(226, 223, 255, 0.45);
  filter: blur(60px);
}
.lc-glow-2 {
  bottom: -90px; right: -80px;
  width: 440px; height: 440px;
  background-color: rgba(226, 231, 255, 0.65);
  filter: blur(70px);
}
.lc-glow-3 {
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(195, 192, 255, 0.2) 0%, transparent 70%);
  filter: blur(80px);
}

/* Top context bar */
.lc-top-bar {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 576px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.lc-register-prompt {
  font-size: 13px;
  color: #464555;
}
.lc-register-link {
  font-weight: 700;
  color: #3525cd;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.15s;
}
.lc-register-link:hover {
  color: #4f46e5;
}

/* Card */
.lc-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 576px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 50px -12px rgba(79, 70, 229, 0.1), 0 1px 3px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  border: 1px solid rgba(226, 231, 255, 0.8);
}
.lc-card-hero {
  padding: 1.75rem 1.75rem 1rem;
  background: linear-gradient(180deg, rgba(242, 243, 255, 0.8) 0%, #ffffff 100%);
}
.lc-hero-top {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.lc-hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #3525cd;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(53, 37, 205, 0.28);
}
.lc-card-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #131b2e;
}
.lc-card-desc {
  margin: 0;
  font-size: 14px;
  color: #464555;
}

.lc-card-body {
  padding: 0.5rem 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.lc-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background-color: #ffdad6;
  color: #93000a;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

/* Form */
.lc-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.lc-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lc-label {
  font-size: 12px;
  font-weight: 700;
  color: #131b2e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lc-label-hint {
  font-size: 11px;
  color: #777587;
  font-weight: 400;
}
.lc-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lc-forgot-link {
  font-size: 11px;
  font-weight: 600;
  color: #3525cd;
  cursor: pointer;
}
.lc-forgot-link:hover {
  text-decoration: underline;
}
.lc-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.lc-input-icon {
  position: absolute;
  left: 12px;
  color: #777587;
  font-size: 20px;
  pointer-events: none;
}
.lc-input {
  width: 100%;
  height: 44px;
  padding: 0 12px 0 42px;
  border-radius: 8px;
  background-color: #f2f3ff;
  border: 1px solid transparent;
  color: #131b2e;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}
.lc-input:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}
.lc-input-highlight {
  background-color: rgba(226, 223, 255, 0.6) !important;
}
.lc-eye-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #777587;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.lc-eye-btn:hover {
  color: #131b2e;
}

/* Submit */
.lc-submit-btn {
  width: 100%;
  margin-top: 6px;
  height: 48px;
  border-radius: 8px;
  background-color: #4f46e5;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  cursor: pointer;
  transition: all 0.15s;
}
.lc-submit-btn:hover {
  background-color: #3525cd;
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
}
.lc-submit-btn:active {
  transform: scale(0.99);
}
.lc-submit-submitting {
  opacity: 0.85;
}
.lc-spin {
  animation: lc-spin-anim 1s linear infinite;
}
@keyframes lc-spin-anim {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Demo box */
.lc-demo-box {
  margin-top: 4px;
  background-color: rgba(242, 243, 255, 0.8);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(226, 231, 255, 0.9);
}
.lc-demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lc-demo-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #131b2e;
}
.lc-demo-badge {
  font-size: 11px;
  color: #885500;
  background-color: #ffddb8;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}
.lc-demo-desc {
  margin: 0;
  font-size: 12px;
  color: #464555;
  line-height: 1.5;
}
.lc-persona-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  margin-top: 4px;
}
.lc-persona-item {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.lc-persona-item:hover {
  background-color: rgba(226, 223, 255, 0.4);
  border-color: #3525cd;
}
.lc-persona-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.lc-persona-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.bg-indigo-light { background-color: #e2dfff; color: #3525cd; }
.bg-emerald-light { background-color: #6ffbbe; color: #005236; }
.bg-amber-light { background-color: #ffddb8; color: #684000; }

.lc-persona-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lc-persona-name {
  font-size: 12px;
  font-weight: 700;
  color: #131b2e;
}
.lc-persona-role {
  font-size: 11px;
  color: #464555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lc-persona-arrow {
  font-size: 18px;
  color: #777587;
  transition: color 0.15s;
}
.lc-persona-item:hover .lc-persona-arrow {
  color: #3525cd;
}
`;
