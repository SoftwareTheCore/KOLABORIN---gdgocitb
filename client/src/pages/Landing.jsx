import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [filterSpot, setFilterSpot] = useState('Semua Spot');
  const [emailInput, setEmailInput] = useState('');
  const [activeSection, setActiveSection] = useState(
    () => window.location.hash.slice(1) || 'landing-home'
  );

  useEffect(() => {
    const updateActiveSection = () => {
      setActiveSection(window.location.hash.slice(1) || 'landing-home');
    };
    window.addEventListener('hashchange', updateActiveSection);
    return () => window.removeEventListener('hashchange', updateActiveSection);
  }, []);

  const navClass = (section) => (
    `st-nav-item${activeSection === section ? ' st-nav-active' : ''}`
  );

  const spots = [
    {
      id: 1,
      name: 'Perpustakaan Pusat',
      sub: 'Lantai 2 - Area Skripsi & Tesis',
      occupancy: '74% Penuh',
      occupancyColor: 'error',
      tag: 'Silent Reading',
      tagIcon: 'volume_off',
      students: 42,
      ports: '18 Colokan',
      condition: 'Tenang · ber-AC',
      wifi: '85 Mbps',
      category: 'Silent Area',
    },
    {
      id: 2,
      name: 'Labtek V Co-working',
      sub: 'STEI / FTI Lantai Dasar',
      occupancy: '28% Penuh',
      occupancyColor: 'secondary',
      tag: 'Lengang & Cepat',
      tagIcon: 'bolt',
      students: 16,
      ports: '34 Colokan',
      condition: 'Area kolaborasi',
      wifi: 'Super WiFi',
      category: 'Co-Working',
    },
    {
      id: 3,
      name: 'Kantin Selasar Barat',
      sub: 'Outdoor Discussion & Kuliner',
      occupancy: '88% Penuh',
      occupancyColor: 'error',
      tag: 'Ramai & Makan',
      tagIcon: 'restaurant',
      students: 64,
      ports: '6 Colokan',
      condition: 'Area ramai',
      wifi: 'Makanan Dekat',
      category: 'Outdoor Cafe',
    },
    {
      id: 4,
      name: 'Selasar TVST Co-working',
      sub: 'Outdoor Group Work Area',
      occupancy: '45% Penuh',
      occupancyColor: 'primary',
      tag: 'Diskusi Santai',
      tagIcon: 'groups',
      students: 24,
      ports: '14 Colokan',
      condition: 'Area terbuka',
      wifi: '60 Mbps',
      category: 'Co-Working',
    },
  ];

  const filteredSpots =
    filterSpot === 'Semua Spot'
      ? spots
      : spots.filter((s) => s.category === filterSpot);

  const handleStartEmail = (e) => {
    e.preventDefault();
    navigate(`/register?email=${encodeURIComponent(emailInput)}`);
  };

  return (
    <div className="stitch-landing-wrapper">
      <style>{css}</style>

      {/* Header */}
      <header className="st-header">
        <div className="st-header-inner">
          <div className="st-header-left">
            <Link to="/" className="st-brand">
              <div className="st-brand-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>hub</span>
              </div>
              <span className="st-brand-name">KOLABORIN</span>
            </Link>

            <nav className="st-nav" aria-label="Navigasi profil KOLABORIN">
              <a
                href="#landing-home"
                className={navClass('landing-home')}
                aria-current={activeSection === 'landing-home' ? 'location' : undefined}
              >
                Home
              </a>
              <a
                href="#campus-radar"
                className={navClass('campus-radar')}
                aria-current={activeSection === 'campus-radar' ? 'location' : undefined}
              >
                Live Map
              </a>
              <a
                href="#feature-open-party"
                className={navClass('feature-open-party')}
                aria-current={activeSection === 'feature-open-party' ? 'location' : undefined}
              >
                Open Party
              </a>
              <a
                href="#feature-chat-hub"
                className={navClass('feature-chat-hub')}
                aria-current={activeSection === 'feature-chat-hub' ? 'location' : undefined}
              >
                Chat Hub
              </a>
              <a
                href="#feature-events"
                className={navClass('feature-events')}
                aria-current={activeSection === 'feature-events' ? 'location' : undefined}
              >
                Events
              </a>
            </nav>
          </div>

          <div className="st-header-right">
            <div className="st-header-auth-buttons">
              <Link to="/login" className="st-btn-ghost">Log In</Link>
              <Link to="/register" className="st-btn-primary">Daftar Akun</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="st-main">
        {/* HERO SECTION */}
        <section className="st-hero-section" id="landing-home">
          {/* Ambient Glow */}
          <div className="st-glow st-glow-1"></div>
          <div className="st-glow st-glow-2"></div>

          <div className="st-container">
            <div className="st-hero-grid">
              {/* Left Column: Copy */}
              <div className="st-hero-copy">
                <div className="st-eyebrow-pill">
                  <span className="st-ping-dot-wrap">
                    <span className="st-ping-anim"></span>
                    <span className="st-ping-static"></span>
                  </span>
                  <span className="st-eyebrow-text">Platform Kolaborasi Kampus</span>
                </div>

                <h1 className="st-hero-title">
                  Lebih Banyak Koneksi. <br />
                  <span className="st-highlight">Lebih Banyak Berkolaborasi.</span>
                </h1>

                <p className="st-hero-subtitle">
                  Temukan teman belajar lintas fakultas, cek informasi tempat di Campus Radar, bergabung ke komunitas, dan ikuti event kampus dalam satu platform.
                </p>

                <div className="st-hero-actions">
                  <button onClick={() => navigate('/login')} className="st-cta-primary">
                    <span>Mulai Jelajah Kampus</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </button>
                  <button onClick={() => navigate('/login')} className="st-cta-secondary">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#777587' }}>domain_verification</span>
                    <span>Pelajari Fitur Organisasi</span>
                  </button>
                </div>

                <div className="st-campus-email-note">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px', color: '#006c49' }}>school</span>
                  <p className="st-campus-email-note-text">
                    Daftar dengan email kampus Anda, lalu pilih fakultas dan program studi atau isi informasi kampus secara manual.
                  </p>
                </div>
              </div>

              {/* Right Column: Preview Card */}
              <div className="st-hero-preview">
                <div className="st-preview-card">
                  <div className="st-preview-topbar">
                    <div className="st-preview-badge">
                      <span className="st-ping-dot-wrap">
                        <span className="st-ping-anim"></span>
                        <span className="st-ping-static"></span>
                      </span>
                      <span className="st-preview-tag">PRATINJAU CAMPUS RADAR</span>
                    </div>

                    <div className="st-active-students-pill">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px', color: '#3525cd' }}>groups</span>
                      <span>4 spot contoh</span>
                    </div>
                  </div>

                  {/* Mini Radar Map Canvas */}
                  <div className="st-map-preview-canvas">
                    <svg viewBox="0 0 500 240" preserveAspectRatio="none" className="st-map-svg">
                      <g stroke="#dae2fd" strokeLinecap="round" fill="none">
                        <path d="M-20 40 L520 230" strokeWidth="36" opacity=".6" />
                        <path d="M520 -10 L150 260" strokeWidth="30" opacity=".5" />
                        <path d="M60 160 L400 70" stroke="#c3c0ff" strokeWidth="5" />
                        <path d="M260 140 L500 240" stroke="#c3c0ff" strokeWidth="4" />
                      </g>
                    </svg>

                    {/* Hotspot 1 */}
                    <div className="st-floating-beacon beacon-1" onClick={() => navigate('/login')}>
                      <span className="st-beacon-dot st-bg-error"></span>
                      <div className="st-beacon-info">
                        <span className="st-beacon-title">Perpus Pusat Lt. 2</span>
                        <span className="st-beacon-sub text-error">74% Penuh (Silent)</span>
                      </div>
                    </div>

                    {/* Hotspot 2 */}
                    <div className="st-floating-beacon beacon-2" onClick={() => navigate('/login')}>
                      <span className="st-beacon-dot st-bg-secondary"></span>
                      <div className="st-beacon-info">
                        <span className="st-beacon-title">Labtek V STEI</span>
                        <span className="st-beacon-sub text-secondary">28% Penuh (Lengang)</span>
                      </div>
                    </div>
                  </div>

                  {/* Study Group Session Card */}
                  <div className="st-study-card">
                    <div className="st-study-left">
                      <div className="st-study-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>code</span>
                      </div>
                      <div className="st-study-info">
                        <div className="st-study-heading">
                          <span className="st-study-title">Tubes IF2211 Strategi Algoritma</span>
                          <span className="st-study-badge">Tersisa 1 Slot</span>
                        </div>
                        <div className="st-study-meta">
                          <span>Meja 4, Gedung Labtek V</span>
                          <span>•</span>
                          <div className="st-study-avatars">
                            <span className="st-avatar-mini" style={{ backgroundColor: '#c3c0ff', color: '#0f0069' }}>FA</span>
                            <span className="st-avatar-mini" style={{ backgroundColor: '#6ffbbe', color: '#002113' }}>MI</span>
                            <span className="st-avatar-mini" style={{ backgroundColor: '#eaedff', color: '#131b2e' }}>+2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => navigate('/login')} className="st-study-join-btn">
                      <span>Join Group</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS BAR */}
        <section className="st-metrics-section">
          <div className="st-container">
            <div className="st-metrics-grid">
              <div className="st-metric-item">
                <span className="st-metric-num text-primary">1 akun</span>
                <span className="st-metric-title">Untuk semua fitur</span>
                <span className="st-metric-sub">Study group, komunitas, dan event</span>
              </div>
              <div className="st-metric-item">
                <span className="st-metric-num text-dark">12</span>
                <span className="st-metric-title">Fakultas / sekolah ITB</span>
                <span className="st-metric-sub">Prodi menyesuaikan fakultas yang dipilih</span>
              </div>
              <div className="st-metric-item">
                <span className="st-metric-num text-secondary">1–5</span>
                <span className="st-metric-title">Rating Campus Radar</span>
                <span className="st-metric-sub">Bintang per tempat belajar</span>
              </div>
              <div className="st-metric-item">
                <span className="st-metric-num text-amber">QR</span>
                <span className="st-metric-title">Check-in kehadiran</span>
                <span className="st-metric-sub">Open Party dan tiket event</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 CORE PILLARS BENTO */}
        <section className="st-pillars-section">
          <div className="st-container">
            <div className="st-pillars-head">
              <div>
                <span className="st-pillar-kicker">EKOSISTEM MAHASISWA MODERN</span>
                <h2 className="st-pillar-heading">Dirancang Khusus untuk Dinamika Kuliah Masa Kini</h2>
              </div>
              <p className="st-pillar-sub">
                Semua kebutuhan akademis, pertemanan, dan proyek organisasi terhubung dalam alur kerja serba otomatis.
              </p>
            </div>

            <div className="st-pillars-grid">
              {/* Pillar 1 */}
              <div className="st-pillar-card" onClick={() => navigate('/login')}>
                <div>
                  <div className="st-pillar-icon-box text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>radar</span>
                  </div>
                  <span className="st-pillar-tag">Info Lokasi &amp; Fasilitas</span>
                  <h3 className="st-pillar-title">Live Map &amp; Radar Spot</h3>
                  <p className="st-pillar-desc">
                    Gunakan filter jenis spot, lalu bandingkan okupansi, perkiraan pengunjung, sisa colokan, dan fasilitas Wi-Fi untuk memilih tempat belajar.
                  </p>
                </div>
                <div className="st-pillar-link text-primary">
                  <span>Lihat Peta Kampus</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="st-pillar-card" id="feature-open-party" onClick={() => navigate('/login')}>
                <div>
                  <div className="st-pillar-icon-box text-secondary">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>group_add</span>
                  </div>
                  <span className="st-pillar-tag st-tag-green">Matchmaking 1-Klik</span>
                  <h3 className="st-pillar-title">Open Party Study Groups</h3>
                  <p className="st-pillar-desc">
                    Temukan sesi belajar berdasarkan mata kuliah dan waktu, lihat kapasitas sebelum bergabung, lalu gunakan QR untuk check-in kehadiran.
                  </p>
                </div>
                <div className="st-pillar-link text-secondary">
                  <span>Jelajahi Party Aktif</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="st-pillar-card" id="feature-chat-hub" onClick={() => navigate('/login')}>
                <div>
                  <div className="st-pillar-icon-box text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>forum</span>
                  </div>
                  <span className="st-pillar-tag st-tag-purple">Komunitas Terarah</span>
                  <h3 className="st-pillar-title">Hub Komunitas &amp; Chat</h3>
                  <p className="st-pillar-desc">
                    Bergabung ke komunitas kampus, diskusikan tugas di ruang obrolan, dan ikuti pengumuman dari pengelola komunitas.
                  </p>
                </div>
                <div className="st-pillar-link text-primary">
                  <span>Buka Saluran Chat</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="st-pillar-card" id="feature-events" onClick={() => navigate('/login')}>
                <div>
                  <div className="st-pillar-icon-box text-amber">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>confirmation_number</span>
                  </div>
                  <span className="st-pillar-tag">Paperless Check-in</span>
                  <h3 className="st-pillar-title">Event Kampus &amp; Tiket</h3>
                  <p className="st-pillar-desc">
                    Temukan seminar, workshop, atau kompetisi; daftar, pantau status pengajuan, lalu gunakan tiket QR saat check-in.
                  </p>
                </div>
                <div className="st-pillar-link text-amber">
                  <span>Cari Event Kampus</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE CAMPUS GRID SHOWCASE */}
        <section className="st-spots-section" id="campus-radar">
          <div className="st-container">
            <div className="st-spots-header">
              <div>
                <div className="st-live-feed-pill">
                  <span className="st-ping-dot-wrap">
                    <span className="st-ping-anim"></span>
                    <span className="st-ping-static"></span>
                  </span>
                  <span className="st-feed-text">PRATINJAU CAMPUS RADAR</span>
                </div>
                <h2 className="st-spots-heading">Pilih Spot Belajar yang Sesuai</h2>
                <p className="st-spots-subtitle">
                  Contoh ringkasan spot: tingkat keramaian, perkiraan pengunjung, sisa colokan, kondisi ruang, dan Wi-Fi.
                </p>
              </div>

              <div className="st-filter-group">
                {['Semua Spot', 'Silent Area', 'Co-Working', 'Outdoor Cafe'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterSpot(cat)}
                    className={`st-filter-btn ${filterSpot === cat ? 'st-filter-active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="st-spots-grid">
              {filteredSpots.map((spot) => (
                <div key={spot.id} className="st-spot-card">
                  <div className="st-spot-body">
                    <div className="st-spot-top">
                      <span className={`st-occ-pill st-occ-${spot.occupancyColor}`}>
                        {spot.occupancy}
                      </span>
                      <div className="st-spot-tag">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{spot.tagIcon}</span>
                        <span>{spot.tag}</span>
                      </div>
                    </div>

                    <h3 className="st-spot-name">{spot.name}</h3>
                    <p className="st-spot-loc">{spot.sub}</p>

                    <div className="st-spot-matrix">
                      <div>
                        <b>{spot.students}</b>
                        <span>Mahasiswa</span>
                      </div>
                      <div>
                        <b>{spot.ports}</b>
                        <span>Sisa Port</span>
                      </div>
                      <div>
                        <b>{spot.condition}</b>
                        <span>Kondisi area</span>
                      </div>
                    </div>

                    <div className="st-spot-bottom">
                      <span className="st-wifi-badge">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#006c49' }}>wifi</span>
                        {spot.wifi}
                      </span>
                      <button onClick={() => navigate('/login')} className="st-spot-action">
                        Detail Meja →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="st-cta-section">
          <div className="st-container">
            <div className="st-cta-banner">
              <div className="st-cta-decor st-cta-decor-1"></div>
              <div className="st-cta-decor st-cta-decor-2"></div>

              <div className="st-cta-content">
                <span className="st-cta-kicker">MULAI GRATIS DENGAN EMAIL KAMPUS</span>
                <h2 className="st-cta-heading">Mulai Pengalaman Kolaborasi Kampus Generasi Baru</h2>
                <p className="st-cta-desc">
                  Jelajahi tempat belajar, komunitas kampus, dan tiket kegiatan dengan email dari kampus Anda.
                </p>

                <form onSubmit={handleStartEmail} className="st-cta-form">
                  <div className="st-cta-input-box">
                    <span className="material-symbols-outlined st-cta-icon">mail</span>
                    <input
                      type="email"
                      required
                      placeholder="Masukkan email kampus Anda"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="st-cta-input"
                    />
                  </div>
                  <button type="submit" className="st-cta-submit">
                    <span>Gabung Sekarang</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </button>
                </form>

                <p className="st-cta-legal">
                  Daftar dengan email kampus dan kata sandi • Fakultas lain dapat diisi manual
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="st-footer">
        <div className="st-container st-footer-inner">
          <div className="st-footer-left">
            <span className="st-footer-brand">KOLABORIN</span>
            <span className="st-footer-sep">•</span>
            <span>Platform Kolaborasi Kampus</span>
          </div>

          <div className="st-footer-links">
            <span className="st-footer-link">Pedoman Komunitas</span>
            <span className="st-footer-link">Keamanan Kampus</span>
            <span className="st-footer-link">Privasi</span>
          </div>

          <div className="st-footer-right">© 2026 KOLABORIN</div>
        </div>
      </footer>
    </div>
  );
}

const css = `
.stitch-landing-wrapper {
  background-color: #faf8ff;
  color: #131b2e;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}
.stitch-landing-wrapper * {
  box-sizing: border-box;
}

.st-container {
  width: min(1344px, 100% - 3rem);
  margin-inline: auto;
}

/* Header */
.st-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 64px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e7ff;
  z-index: 100;
}
.st-header-inner {
  height: 100%;
  max-width: 1344px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.st-header-left {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}
.st-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}
.st-brand-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  background-color: #3525cd;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(53, 37, 205, 0.25);
}
.st-brand-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #3525cd;
}
.st-nav {
  display: none;
  align-items: center;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .st-nav { display: flex; }
}
.st-nav-item {
  color: #464555;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 18px 0;
  transition: color 0.15s;
}
.st-nav-item:hover { color: #3525cd; }
.st-nav-active {
  color: #3525cd;
  font-weight: 700;
  border-bottom: 2px solid #3525cd;
}
html {
  scroll-behavior: smooth;
  scroll-padding-top: 80px;
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

.st-header-auth-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}
.st-btn-ghost {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #131b2e;
  text-decoration: none;
  border: 1px solid #dae2fd;
  background: #ffffff;
  transition: all 0.15s;
}
.st-btn-ghost:hover {
  background: #f2f3ff;
  border-color: #3525cd;
  color: #3525cd;
}
.st-btn-primary {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: #3525cd;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(53, 37, 205, 0.25);
  transition: all 0.15s;
}
.st-btn-primary:hover {
  background: #4f46e5;
  box-shadow: 0 6px 16px rgba(53, 37, 205, 0.35);
}

/* Main */
.st-main {
  padding-top: 64px;
}

/* Hero */
.st-hero-section {
  position: relative;
  padding: 2.5rem 0 3.5rem;
  overflow: hidden;
}
.st-glow {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  z-index: 0;
}
.st-glow-1 {
  top: -120px; left: -100px;
  width: 420px; height: 420px;
  background: rgba(226, 223, 255, 0.45);
  filter: blur(80px);
}
.st-glow-2 {
  top: 30%; right: -80px;
  width: 360px; height: 360px;
  background: rgba(108, 248, 187, 0.25);
  filter: blur(80px);
}

.st-hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;
  position: relative;
  z-index: 1;
}
@media (min-width: 1024px) {
  .st-hero-grid { grid-template-columns: 1.05fr 0.95fr; }
}

.st-eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f2f3ff;
  padding: 6px 14px;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}
.st-ping-dot-wrap {
  position: relative;
  display: flex;
  width: 8px; height: 8px;
}
.st-ping-anim {
  position: absolute;
  width: 100%; height: 100%;
  border-radius: 9999px;
  background-color: #006c49;
  opacity: 0.75;
  animation: st-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes st-ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}
.st-ping-static {
  position: relative;
  width: 8px; height: 8px;
  border-radius: 9999px;
  background-color: #006c49;
}
.st-eyebrow-text {
  font-size: 12px;
  font-weight: 600;
  color: #464555;
  letter-spacing: 0.02em;
}

.st-hero-title {
  margin: 1.25rem 0 0;
  font-size: clamp(38px, 5.2vw, 56px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #131b2e;
}
.st-highlight {
  color: #3525cd;
}
.st-hero-subtitle {
  margin: 1.25rem 0 0;
  font-size: 16px;
  line-height: 26px;
  color: #464555;
  max-width: 540px;
}
.st-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 1.75rem;
}
.st-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 26px;
  border-radius: 12px;
  background-color: #3525cd;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(53, 37, 205, 0.3);
  transition: all 0.15s;
}
.st-cta-primary:hover {
  background-color: #4f46e5;
  transform: translateY(-1px);
}
.st-cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  background-color: #ffffff;
  color: #131b2e;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #dae2fd;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  transition: all 0.15s;
}
.st-cta-secondary:hover {
  background-color: #f2f3ff;
  border-color: #3525cd;
}

.st-campus-email-note {
  margin-top: 1.75rem;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px 16px;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  border: 1px solid #e2e7ff;
}
.st-campus-email-note-text {
  margin: 0;
  font-size: 11px;
  color: #464555;
}

/* Hero Preview Card */
.st-preview-card {
  position: relative;
  background: #ffffff;
  padding: 1.25rem;
  border-radius: 16px;
  box-shadow: 0 20px 50px -12px rgba(79, 70, 229, 0.12), 0 1px 3px rgba(15, 23, 42, 0.05);
  border: 1px solid #dae2fd;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.st-preview-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.st-preview-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}
.st-preview-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #006c49;
}
.st-active-students-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e2e7ff;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  color: #131b2e;
}

.st-map-preview-canvas {
  position: relative;
  width: 100%;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f2f3ff 0%, #eaedff 100%);
  border: 1px solid #dae2fd;
}
.st-map-svg {
  width: 100%; height: 100%;
  display: block;
}
.st-floating-beacon {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  padding: 6px 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.15s;
}
.st-floating-beacon:hover {
  transform: scale(1.05);
}
.beacon-1 { top: 28px; left: 32px; }
.beacon-2 { bottom: 28px; right: 32px; }

.st-beacon-dot {
  width: 8px; height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.st-bg-error { background-color: #ba1a1a; }
.st-bg-secondary { background-color: #006c49; }
.st-beacon-info {
  display: flex;
  flex-direction: column;
}
.st-beacon-title {
  font-size: 10px;
  font-weight: 700;
  color: #131b2e;
  line-height: 1.1;
}
.st-beacon-sub {
  font-size: 9px;
  font-weight: 600;
}
.text-error { color: #ba1a1a; }
.text-secondary { color: #006c49; }

.st-study-card {
  background: #f2f3ff;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
@media (min-width: 640px) {
  .st-study-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
.st-study-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.st-study-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: #e2dfff;
  color: #3525cd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.st-study-info {
  display: flex;
  flex-direction: column;
}
.st-study-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}
.st-study-title {
  font-size: 13px;
  font-weight: 700;
  color: #131b2e;
}
.st-study-badge {
  font-size: 10px;
  background: #6cf8bb;
  color: #00714d;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 700;
}
.st-study-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: #464555;
}
.st-study-avatars {
  display: flex;
  margin-left: 4px;
}
.st-avatar-mini {
  width: 20px; height: 20px;
  border-radius: 9999px;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -5px;
  border: 1.5px solid #ffffff;
}
.st-study-join-btn {
  background: #3525cd;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(53, 37, 205, 0.25);
  transition: all 0.15s;
}
.st-study-join-btn:hover {
  background: #4f46e5;
}

/* Metrics */
.st-metrics-section {
  background: #ffffff;
  padding: 2rem 0;
  border-top: 1px solid #e2e7ff;
  border-bottom: 1px solid #e2e7ff;
}
.st-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .st-metrics-grid { grid-template-columns: repeat(4, 1fr); }
}
.st-metric-item {
  display: flex;
  flex-direction: column;
}
.st-metric-num {
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.text-primary { color: #3525cd; }
.text-dark { color: #131b2e; }
.text-amber { color: #885500; }
.st-metric-title {
  font-size: 14px;
  font-weight: 700;
  color: #131b2e;
  margin-top: 4px;
}
.st-metric-sub {
  font-size: 12px;
  color: #464555;
  margin-top: 2px;
}

/* 4 Pillars */
.st-pillars-section {
  padding: 3.5rem 0;
  background: #faf8ff;
}
.st-pillars-head {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}
@media (min-width: 768px) {
  .st-pillars-head {
    flex-direction: row;
    align-items: flex-end;
  }
}
.st-pillar-kicker {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #3525cd;
}
.st-pillar-heading {
  margin: 4px 0 0;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 700;
  color: #131b2e;
  letter-spacing: -0.02em;
}
.st-pillar-sub {
  margin: 0;
  font-size: 14px;
  color: #464555;
  max-width: 440px;
}

.st-pillars-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
@media (min-width: 640px) {
  .st-pillars-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .st-pillars-grid { grid-template-columns: repeat(4, 1fr); }
}
.st-pillar-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid #dae2fd;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
}
.st-pillar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.08);
  border-color: #3525cd;
}
.st-pillar-icon-box {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: #f2f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
.st-pillar-tag {
  font-size: 11px;
  font-weight: 700;
  background: #e2e7ff;
  color: #464555;
  padding: 2px 8px;
  border-radius: 4px;
}
.st-tag-green { background: #6cf8bb; color: #00714d; }
.st-tag-purple { background: #e2dfff; color: #3323cc; }
.st-pillar-title {
  margin: 8px 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #131b2e;
}
.st-pillar-desc {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: #464555;
}
.st-pillar-link {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
}

/* Spots */
.st-spots-section {
  padding: 3.5rem 0;
  background: #f2f3ff;
}
.st-spots-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}
@media (min-width: 768px) {
  .st-spots-header {
    flex-direction: row;
    align-items: flex-end;
  }
}
.st-live-feed-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.st-feed-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #006c49;
}
.st-spots-heading {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 700;
  color: #131b2e;
  letter-spacing: -0.02em;
}
.st-spots-subtitle {
  max-width: 680px;
  margin: 8px 0 0;
  color: #464555;
  font-size: 14px;
  line-height: 1.6;
}

.st-filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: #ffffff;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #dae2fd;
}
.st-filter-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: #464555;
  cursor: pointer;
  transition: all 0.15s;
}
.st-filter-btn:hover {
  background: #f2f3ff;
  color: #131b2e;
}
.st-filter-active {
  background: #3525cd !important;
  color: #ffffff !important;
}

.st-spots-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
@media (min-width: 640px) {
  .st-spots-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .st-spots-grid { grid-template-columns: repeat(4, 1fr); }
}
.st-spot-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #dae2fd;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.st-spot-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.st-spot-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.st-occ-pill {
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}
.st-occ-error { background: #ffdad6; color: #93000a; }
.st-occ-secondary { background: #6cf8bb; color: #00714d; }
.st-occ-primary { background: #dae2fd; color: #131b2e; }

.st-spot-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #464555;
}
.st-spot-name {
  margin: 10px 0 2px;
  font-size: 16px;
  font-weight: 700;
  color: #131b2e;
}
.st-spot-loc {
  margin: 0;
  font-size: 12px;
  color: #464555;
}
.st-spot-matrix {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  background: #f2f3ff;
  padding: 8px;
  border-radius: 8px;
  text-align: center;
}
.st-spot-matrix b {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #131b2e;
}
.st-spot-matrix span {
  font-size: 10px;
  color: #464555;
}
.st-spot-bottom {
  margin-top: 1rem;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.st-wifi-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #464555;
}
.st-spot-action {
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #3525cd;
  cursor: pointer;
}
.st-spot-action:hover {
  text-decoration: underline;
}

/* CTA */
.st-cta-section {
  padding: 3.5rem 0;
  background: #faf8ff;
}
.st-cta-banner {
  position: relative;
  background: #3525cd;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(53, 37, 205, 0.3);
}
.st-cta-decor {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
}
.st-cta-decor-1 {
  width: 320px; height: 320px;
  background: rgba(255, 255, 255, 0.1);
  filter: blur(50px);
  bottom: -60px; right: -60px;
}
.st-cta-decor-2 {
  width: 200px; height: 200px;
  background: rgba(111, 251, 190, 0.2);
  filter: blur(40px);
  top: 0; right: 25%;
}
.st-cta-content {
  position: relative;
  z-index: 1;
  max-width: 640px;
}
.st-cta-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 9999px;
  color: #ffffff;
}
.st-cta-heading {
  margin: 1rem 0 0;
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 800;
  line-height: 1.2;
}
.st-cta-desc {
  margin: 0.75rem 0 0;
  font-size: 14px;
  line-height: 22px;
  color: #e2dfff;
}
.st-cta-form {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
@media (min-width: 640px) {
  .st-cta-form { flex-direction: row; }
}
.st-cta-input-box {
  position: relative;
  flex: 1;
}
.st-cta-icon {
  position: absolute;
  left: 12px; top: 12px;
  color: #777587;
  font-size: 20px;
  pointer-events: none;
}
.st-cta-input {
  width: 100%;
  height: 46px;
  padding: 0 14px 0 42px;
  border-radius: 10px;
  border: none;
  background: #ffffff;
  color: #131b2e;
  font-size: 14px;
  font-family: inherit;
}
.st-cta-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(111, 251, 190, 0.5);
}
.st-cta-submit {
  height: 46px;
  padding: 0 22px;
  border-radius: 10px;
  background: #6ffbbe;
  color: #002113;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.15s;
}
.st-cta-submit:hover {
  background: #4edea3;
}
.st-cta-legal {
  margin: 8px 0 0;
  font-size: 11px;
  color: rgba(226, 223, 255, 0.8);
}

/* Footer */
.st-footer {
  background: #ffffff;
  border-top: 1px solid #e2e7ff;
  padding: 1.5rem 0;
}
.st-footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #464555;
}
@media (min-width: 640px) {
  .st-footer-inner { flex-direction: row; }
}
.st-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.st-footer-brand {
  font-weight: 700;
  color: #3525cd;
}
.st-footer-sep { color: #dae2fd; }
.st-footer-links {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #777587;
}
.st-footer-link { cursor: pointer; }
.st-footer-link:hover { color: #3525cd; }
.st-footer-right { color: #777587; }
`;
