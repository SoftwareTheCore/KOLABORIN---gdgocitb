import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

const FACULTY_PROGRAMS = {
  STEI: {
    label: 'STEI (Sekolah Teknik Elektro dan Informatika)',
    programs: [
      { value: 'IF', label: 'Informatika (IF)' },
      { value: 'STI', label: 'Sistem dan Teknologi Informasi (STI)' },
      { value: 'EL', label: 'Teknik Elektro (EL)' },
      { value: 'EP', label: 'Teknik Tenaga Listrik (EP)' },
      { value: 'ET', label: 'Teknik Telekomunikasi (ET)' },
      { value: 'EB', label: 'Teknik Biomedis (EB)' },
    ],
  },
  FTI: {
    label: 'FTI (Fakultas Teknologi Industri)',
    programs: [
      { value: 'TK', label: 'Teknik Kimia (TK)' },
      { value: 'TF', label: 'Teknik Fisika (TF)' },
      { value: 'TI', label: 'Teknik Industri (TI)' },
      { value: 'MR', label: 'Manajemen Rekayasa (MR)' },
      { value: 'TBK', label: 'Teknik Bioenergi dan Kemurgi (TBK)' },
    ],
  },
  SBM: {
    label: 'SBM (Sekolah Bisnis dan Manajemen)',
    programs: [
      { value: 'MB', label: 'Manajemen (MB)' },
      { value: 'MK', label: 'Kewirausahaan (MK)' },
    ],
  },
  FSRD: {
    label: 'FSRD (Fakultas Seni Rupa dan Desain)',
    programs: [
      { value: 'SR', label: 'Seni Rupa (SR)' },
      { value: 'KR', label: 'Kriya (KR)' },
      { value: 'DI', label: 'Desain Interior (DI)' },
      { value: 'DKV', label: 'Desain Komunikasi Visual (DKV)' },
      { value: 'DP', label: 'Desain Produk (DP)' },
    ],
  },
  FITB: {
    label: 'FITB (Fakultas Ilmu dan Teknologi Kebumian)',
    programs: [
      { value: 'MG', label: 'Meteorologi (MG)' },
      { value: 'OS', label: 'Oseanografi (OS)' },
      { value: 'GL', label: 'Teknik Geologi (GL)' },
      { value: 'GD', label: 'Teknik Geodesi dan Geomatika (GD)' },
    ],
  },
  FMIPA: {
    label: 'FMIPA (Fakultas Matematika dan Ilmu Pengetahuan Alam)',
    programs: [
      { value: 'MA', label: 'Matematika (MA)' },
      { value: 'FI', label: 'Fisika (FI)' },
      { value: 'KI', label: 'Kimia (KI)' },
      { value: 'AS', label: 'Astronomi (AS)' },
    ],
  },
  FTMD: {
    label: 'FTMD (Fakultas Teknik Mesin dan Dirgantara)',
    programs: [
      { value: 'MS', label: 'Teknik Mesin (MS)' },
      { value: 'AE', label: 'Teknik Dirgantara (AE)' },
      { value: 'MT', label: 'Teknik Material (MT)' },
    ],
  },
  FTSL: {
    label: 'FTSL (Fakultas Teknik Sipil dan Lingkungan)',
    programs: [
      { value: 'SI', label: 'Teknik Sipil (SI)' },
      { value: 'TL', label: 'Teknik Lingkungan (TL)' },
      { value: 'KL', label: 'Teknik Kelautan (KL)' },
      { value: 'RIL', label: 'Rekayasa Infrastruktur Lingkungan (RIL)' },
      { value: 'TPSDA', label: 'Teknik dan Pengelolaan Sumber Daya Air (TPSDA)' },
    ],
  },
  SAPPK: {
    label: 'SAPPK (Sekolah Arsitektur, Perencanaan, dan Pengembangan Kebijakan)',
    programs: [
      { value: 'AR', label: 'Arsitektur (AR)' },
      { value: 'PWK', label: 'Perencanaan Wilayah dan Kota (PWK)' },
    ],
  },
  SITH: {
    label: 'SITH (Sekolah Ilmu dan Teknologi Hayati)',
    programs: [
      { value: 'BI', label: 'Biologi (BI)' },
      { value: 'MI', label: 'Mikrobiologi (MI)' },
      { value: 'RB', label: 'Rekayasa Hayati (RB)' },
      { value: 'RP', label: 'Rekayasa Pertanian (RP)' },
      { value: 'RH', label: 'Rekayasa Kehutanan (RH)' },
    ],
  },
  SF: {
    label: 'SF (Sekolah Farmasi)',
    programs: [
      { value: 'STF', label: 'Sains dan Teknologi Farmasi (STF)' },
      { value: 'FKK', label: 'Farmasi Klinik dan Komunitas (FKK)' },
    ],
  },
  FTTM: {
    label: 'FTTM (Fakultas Teknik Pertambangan dan Perminyakan)',
    programs: [
      { value: 'TA', label: 'Teknik Pertambangan (TA)' },
      { value: 'TM', label: 'Teknik Perminyakan (TM)' },
      { value: 'TG', label: 'Teknik Geofisika (TG)' },
      { value: 'MG', label: 'Teknik Metalurgi (MG)' },
      { value: 'GT', label: 'Teknik Geotermal (GT)' },
    ],
  },
  OTHER: {
    label: 'Kampus / fakultas lain (isi manual)',
    programs: [],
  },
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [faculty, setFaculty] = useState('STEI');
  const [major, setMajor] = useState(FACULTY_PROGRAMS.STEI.programs[0].value);
  const [otherFaculty, setOtherFaculty] = useState('');
  const [otherMajor, setOtherMajor] = useState('');
  const [role, setRole] = useState('student');
  const [organizationName, setOrganizationName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const isOtherFaculty = faculty === 'OTHER';
  const facultyPrograms = FACULTY_PROGRAMS[faculty].programs;

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Kata sandi harus minimal 8 karakter.');
      return;
    }

    if (!agreeTerms) {
      setError('Anda harus menyetujui ketentuan komunitas akademik.');
      return;
    }

    setSubmitting(true);
    try {
      if (role === 'organization' && !organizationName.trim()) {
        setError('Nama organisasi wajib diisi.');
        setSubmitting(false);
        return;
      }
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        faculty: isOtherFaculty ? otherFaculty.trim() : faculty,
        major: isOtherFaculty ? otherMajor.trim() : major,
        role,
        organizationName,
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-custom-container">
      <style>{css}</style>

      <main className="rc-main">
        <div className="rc-main-inner">
          {/* Subtle Ambient Decorative Glow Spheres */}
          <div className="rc-glow rc-glow-1"></div>
          <div className="rc-glow rc-glow-2"></div>
          <div className="rc-glow rc-glow-3"></div>

          {/* Top Bar with Brand & Login Prompt */}
          <div className="rc-top-bar">
            <Link to="/" className="rc-brand-clean">
              <div className="rc-brand-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>hub</span>
              </div>
              <span className="rc-brand-title">KOLABORIN</span>
            </Link>
            <div className="rc-login-prompt">
              Sudah punya akun?{' '}
              <Link to="/login" className="rc-login-link">
                Masuk di Sini
              </Link>
            </div>
          </div>

          {/* Main Card */}
          <div className="rc-card">
            <div className="rc-card-hero">
              <div className="rc-hero-top">
                <div className="rc-hero-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>school</span>
                </div>
              </div>
              <h1 className="rc-card-title">Pendaftaran Akun Mahasiswa</h1>
              <p className="rc-card-desc">
                Buat profil kolaborasi akademik Anda dan temukan teman belajar satu kampus.
              </p>
            </div>

            <div className="rc-card-body">
              {error && (
                <div className="rc-error-banner">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="rc-form">
                {/* Full Name */}
                <div className="rc-form-field">
                  <label className="rc-label" htmlFor="name">Nama Lengkap</label>
                  <div className="rc-input-wrapper">
                    <span className="material-symbols-outlined rc-input-icon">person</span>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. Farrel Arkan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rc-input"
                    />
                  </div>
                </div>

                {/* Email Kampus */}
                <div className="rc-form-field">
                  <label className="rc-label" htmlFor="email">
                    <span>Email Kampus Resmi</span>
                    <span className="rc-label-hint">Gunakan email dari kampus Anda</span>
                  </label>
                  <div className="rc-input-wrapper">
                    <span className="material-symbols-outlined rc-input-icon">badge</span>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="nama@kampus.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rc-input"
                    />
                  </div>
                </div>

                {/* Fakultas & Program Studi */}
                <div className="rc-form-grid-2">
                  <div className="rc-form-field">
                    <label className="rc-label" htmlFor="faculty">Fakultas / Sekolah</label>
                    <div className="rc-select-wrapper">
                      <select
                        id="faculty"
                        value={faculty}
                        onChange={(e) => {
                          const nextFaculty = e.target.value;
                          setFaculty(nextFaculty);
                          setMajor(FACULTY_PROGRAMS[nextFaculty].programs[0]?.value || '');
                        }}
                        className="rc-select"
                      >
                        {Object.entries(FACULTY_PROGRAMS).map(([code, details]) => (
                          <option key={code} value={code}>{details.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined rc-select-arrow">expand_more</span>
                    </div>
                  </div>

                  <div className="rc-form-field">
                    <label className="rc-label" htmlFor="major">Program Studi</label>
                    {isOtherFaculty ? (
                      <input
                        id="major"
                        type="text"
                        required
                        placeholder="Nama program studi"
                        value={otherMajor}
                        onChange={(e) => setOtherMajor(e.target.value)}
                        className="rc-input rc-input-plain"
                      />
                    ) : (
                      <div className="rc-select-wrapper">
                        <select
                          id="major"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          className="rc-select"
                        >
                          {facultyPrograms.map((program) => (
                            <option key={program.value} value={program.value}>{program.label}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined rc-select-arrow">expand_more</span>
                      </div>
                    )}
                  </div>
                </div>

                {isOtherFaculty && (
                  <div className="rc-form-field">
                    <label className="rc-label" htmlFor="otherFaculty">Kampus / Fakultas</label>
                    <input
                      id="otherFaculty"
                      type="text"
                      required
                      placeholder="Nama kampus dan fakultas"
                      value={otherFaculty}
                      onChange={(e) => setOtherFaculty(e.target.value)}
                      className="rc-input rc-input-plain"
                    />
                  </div>
                )}

                {/* Account Type */}
                <div className="rc-form-field">
                  <label className="rc-label" htmlFor="role">Tipe Akun</label>
                  <div className="rc-select-wrapper">
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="rc-select"
                    >
                      <option value="student">Mahasiswa</option>
                      <option value="organization">Organisasi / Lembaga Kampus</option>
                    </select>
                    <span className="material-symbols-outlined rc-select-arrow">expand_more</span>
                  </div>
                </div>

                {role === 'organization' && (
                  <div className="rc-form-field">
                    <label className="rc-label" htmlFor="organizationName">Nama Organisasi</label>
                    <div className="rc-input-wrapper">
                      <span className="material-symbols-outlined rc-input-icon">groups</span>
                      <input
                        id="organizationName"
                        type="text"
                        required
                        placeholder="e.g. HMIF ITB"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="rc-input"
                      />
                    </div>
                  </div>
                )}

                {/* Password with Eye & Strength Meter */}
                <div className="rc-form-field">
                  <div className="rc-label-row">
                    <label className="rc-label" htmlFor="password">Kata Sandi Baru</label>
                    <span className="rc-label-hint">Minimal 8 karakter</span>
                  </div>
                  <div className="rc-input-wrapper">
                    <span className="material-symbols-outlined rc-input-icon">lock</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="Kombinasi huruf, angka, &amp; simbol"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rc-input"
                    />
                    <button
                      type="button"
                      aria-label="Tampilkan atau sembunyikan sandi"
                      className="rc-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  <div className="rc-strength-wrap">
                    <div className="rc-strength-bars">
                      <div className={`rc-strength-bar ${strength >= 1 ? 'bar-active' : ''}`}></div>
                      <div className={`rc-strength-bar ${strength >= 2 ? 'bar-active' : ''}`}></div>
                      <div className={`rc-strength-bar ${strength >= 3 ? 'bar-active' : ''}`}></div>
                      <div className={`rc-strength-bar ${strength >= 4 ? 'bar-active' : ''}`}></div>
                    </div>
                    <div className="rc-strength-text">
                      <span>Kekuatan: {strength >= 3 ? 'Kuat & Aman' : strength >= 2 ? 'Sedang' : 'Lemah'}</span>
                      <span>Kombinasi huruf besar, angka, &amp; simbol</span>
                    </div>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="rc-terms-row">
                  <input
                    type="checkbox"
                    id="termsCheck"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rc-checkbox"
                  />
                  <label htmlFor="termsCheck" className="rc-terms-label">
                    Saya menyetujui Ketentuan Komunitas Akademik dan Kode Etik Kolaborasi Mahasiswa, serta bersedia menjaga integritas akademik dalam setiap proyek bersama.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rc-submit-btn ${submitting ? 'rc-submit-submitting' : ''}`}
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined rc-spin" style={{ fontSize: '20px' }}>sync</span>
                      <span>Membuat Akun Profil...</span>
                    </>
                  ) : (
                    <>
                      <span>Buat Akun Kolaborin Saya</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const css = `
.register-custom-container {
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
.register-custom-container * {
  box-sizing: border-box;
}

.rc-brand-clean {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}
.rc-brand-icon {
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
.rc-brand-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #3525cd;
}

/* Main */
.rc-main {
  flex: 1;
  width: 100%;
  background: linear-gradient(180deg, #faf8ff 0%, rgba(242, 243, 255, 0.5) 50%, rgba(218, 226, 253, 0.25) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.rc-main-inner {
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
.rc-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 9999px;
  z-index: 0;
}
.rc-glow-1 {
  top: -80px; left: -80px;
  width: 380px; height: 380px;
  background-color: rgba(226, 223, 255, 0.45);
  filter: blur(60px);
}
.rc-glow-2 {
  bottom: -90px; right: -80px;
  width: 440px; height: 440px;
  background-color: rgba(226, 231, 255, 0.65);
  filter: blur(70px);
}
.rc-glow-3 {
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(195, 192, 255, 0.2) 0%, transparent 70%);
  filter: blur(80px);
}

/* Top bar */
.rc-top-bar {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 620px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.rc-login-prompt {
  font-size: 13px;
  color: #464555;
}
.rc-login-link {
  font-weight: 700;
  color: #3525cd;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.15s;
}
.rc-login-link:hover {
  color: #4f46e5;
}

/* Card */
.rc-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 620px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 50px -12px rgba(79, 70, 229, 0.1), 0 1px 3px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  border: 1px solid rgba(226, 231, 255, 0.8);
}
.rc-card-hero {
  padding: 1.75rem 1.75rem 1rem;
  background: linear-gradient(180deg, rgba(242, 243, 255, 0.8) 0%, #ffffff 100%);
}
.rc-hero-top {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}
.rc-hero-icon {
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
.rc-card-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #131b2e;
}
.rc-card-desc {
  margin: 0;
  font-size: 14px;
  color: #464555;
}

.rc-card-body {
  padding: 0.5rem 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rc-error-banner {
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
.rc-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}
.rc-form-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 600px) {
  .rc-form-grid-2 { grid-template-columns: 1fr 1fr; }
}

.rc-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rc-label {
  font-size: 12px;
  font-weight: 700;
  color: #131b2e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rc-label-hint {
  font-size: 11px;
  color: #777587;
  font-weight: 400;
}
.rc-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rc-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.rc-input-icon {
  position: absolute;
  left: 12px;
  color: #777587;
  font-size: 20px;
  pointer-events: none;
}
.rc-input {
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
.rc-input-plain {
  padding-left: 12px;
}
.rc-input:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}

.rc-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.rc-select {
  width: 100%;
  height: 44px;
  padding: 0 32px 0 12px;
  border-radius: 8px;
  background-color: #f2f3ff;
  border: 1px solid transparent;
  color: #131b2e;
  font-size: 14px;
  font-family: inherit;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
}
.rc-select:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #3525cd;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}
.rc-select-arrow {
  position: absolute;
  right: 10px;
  color: #777587;
  pointer-events: none;
}

.rc-eye-btn {
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
.rc-eye-btn:hover {
  color: #131b2e;
}

/* Strength Meter */
.rc-strength-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.rc-strength-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  height: 6px;
}
.rc-strength-bar {
  background-color: #dae2fd;
  border-radius: 9999px;
  transition: background-color 0.2s;
}
.bar-active {
  background-color: #006c49;
}
.rc-strength-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #464555;
}

/* Terms */
.rc-terms-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
}
.rc-checkbox {
  width: 16px;
  height: 16px;
  margin-top: 3px;
  accent-color: #3525cd;
  cursor: pointer;
  flex-shrink: 0;
}
.rc-terms-label {
  font-size: 12px;
  color: #464555;
  line-height: 1.5;
  cursor: pointer;
}

/* Submit */
.rc-submit-btn {
  width: 100%;
  margin-top: 8px;
  height: 48px;
  border-radius: 10px;
  background-color: #3525cd;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(53, 37, 205, 0.35);
  cursor: pointer;
  transition: all 0.15s;
}
.rc-submit-btn:hover {
  background-color: #4f46e5;
  box-shadow: 0 6px 20px rgba(53, 37, 205, 0.45);
}
.rc-submit-btn:active {
  transform: scale(0.99);
}
.rc-submit-submitting {
  opacity: 0.85;
}
.rc-spin {
  animation: rc-spin-anim 1s linear infinite;
}
@keyframes rc-spin-anim {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
