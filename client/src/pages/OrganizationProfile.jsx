import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: 'verified_user',
    title: 'Profil dan verifikasi organisasi',
    description: 'Tampilkan identitas, kategori, dan misi organisasi. Kirim profil untuk ditinjau sebelum membuka fitur organisasi terverifikasi.',
  },
  {
    icon: 'event',
    title: 'Event dan rekrutmen',
    description: 'Publikasikan kegiatan, atur kapasitas, tinjau pendaftar, dan kelola tiket QR serta check-in dalam satu alur.',
  },
  {
    icon: 'forum',
    title: 'Komunitas dan pengumuman',
    description: 'Bangun ruang komunikasi untuk anggota, bagikan informasi penting, dan kelola percakapan komunitas kampus.',
  },
  {
    icon: 'meeting_room',
    title: 'Ruang dan rapat',
    description: 'Hubungkan tempat kegiatan dengan Campus Radar dan atur rapat internal agar jadwal organisasi lebih terkoordinasi.',
  },
  {
    icon: 'handshake',
    title: 'Kolaborasi antarorganisasi',
    description: 'Temukan organisasi kampus lain dan kirim proposal kolaborasi untuk menyelenggarakan kegiatan bersama.',
  },
  {
    icon: 'insights',
    title: 'Ringkasan aktivitas',
    description: 'Pantau aktivitas organisasi, event, dan partisipasi melalui informasi yang tersedia di workspace.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Daftarkan akun organisasi',
    description: 'Gunakan email kampus dan pilih tipe akun Organisasi / Lembaga Kampus.',
  },
  {
    number: '02',
    title: 'Lengkapi profil untuk verifikasi',
    description: 'Isi nama, kategori, dan deskripsi organisasi agar admin dapat meninjau pengajuan.',
  },
  {
    number: '03',
    title: 'Kelola kegiatan dan komunitas',
    description: 'Setelah terverifikasi, gunakan workspace untuk menjangkau mahasiswa dan organisasi lain.',
  },
];

export default function OrganizationProfile() {
  return (
    <div className="organization-profile-page">
      <header className="organization-profile-header">
        <Link to="/" className="organization-profile-brand" aria-label="Kembali ke beranda KOLABORIN">
          <span className="material-symbols-outlined" aria-hidden="true">hub</span>
          <span>KOLABORIN</span>
        </Link>
        <nav aria-label="Navigasi akun">
          <Link to="/login" className="organization-profile-login">Masuk</Link>
          <Link to="/register?role=organization" className="organization-profile-register">Daftarkan organisasi</Link>
        </nav>
      </header>

      <main>
        <section className="organization-profile-hero">
          <div className="organization-profile-hero-copy">
            <span className="organization-profile-eyebrow">
              <span className="material-symbols-outlined" aria-hidden="true">domain</span>
              Untuk organisasi dan lembaga kampus
            </span>
            <h1>Fokus membangun komunitas. Operasional jadi lebih tertata.</h1>
            <p>
              KOLABORIN membantu organisasi kampus mengelola kegiatan, komunikasi anggota,
              ruang, dan kolaborasi dari satu workspace.
            </p>
            <div className="organization-profile-actions">
              <Link to="/register?role=organization" className="organization-profile-register">
                Buat akun organisasi
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </Link>
              <Link to="/login" className="organization-profile-secondary">Sudah punya akun? Masuk</Link>
            </div>
            <div className="organization-profile-note">
              <span className="material-symbols-outlined" aria-hidden="true">info</span>
              Fitur pengelolaan organisasi tersedia setelah profil disetujui admin.
            </div>
          </div>

          <aside className="organization-profile-preview" aria-label="Contoh ringkasan workspace organisasi">
            <div className="organization-profile-preview-heading">
              <span className="organization-profile-preview-icon material-symbols-outlined" aria-hidden="true">domain</span>
              <div>
                <span className="organization-profile-preview-kicker">WORKSPACE ORGANISASI</span>
                <h2>Semua aktivitas dalam satu tempat</h2>
              </div>
            </div>
            <div className="organization-profile-preview-stats">
              <article><strong>Event</strong><span>Publikasi &amp; peserta</span></article>
              <article><strong>Komunitas</strong><span>Anggota &amp; pengumuman</span></article>
            </div>
            <div className="organization-profile-preview-list">
              <div><span className="material-symbols-outlined" aria-hidden="true">confirmation_number</span><span>Kelola pendaftaran dan tiket QR</span><span className="material-symbols-outlined" aria-hidden="true">check_circle</span></div>
              <div><span className="material-symbols-outlined" aria-hidden="true">groups</span><span>Jangkau mahasiswa lintas kampus</span><span className="material-symbols-outlined" aria-hidden="true">check_circle</span></div>
              <div><span className="material-symbols-outlined" aria-hidden="true">handshake</span><span>Buka peluang kolaborasi</span><span className="material-symbols-outlined" aria-hidden="true">check_circle</span></div>
            </div>
            <div className="organization-profile-preview-footer">
              <span className="organization-profile-status-dot" />
              Satu workspace untuk aktivitas organisasi
            </div>
          </aside>
        </section>

        <section className="organization-profile-features" aria-labelledby="organization-profile-features-title">
          <div className="organization-profile-section-heading">
            <span className="organization-profile-eyebrow">Dukungan untuk aktivitas kampus</span>
            <h2 id="organization-profile-features-title">Hal penting untuk organisasi, saling terhubung</h2>
            <p>Mulai dari memperkenalkan organisasi hingga menjalankan kegiatan bersama mahasiswa.</p>
          </div>
          <div className="organization-profile-feature-grid">
            {features.map((feature) => (
              <article className="organization-profile-feature-card" key={feature.title}>
                <span className="material-symbols-outlined" aria-hidden="true">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="organization-profile-steps" aria-labelledby="organization-profile-steps-title">
          <div className="organization-profile-section-heading">
            <span className="organization-profile-eyebrow">Mulai dengan mudah</span>
            <h2 id="organization-profile-steps-title">Dari pendaftaran hingga workspace</h2>
          </div>
          <div className="organization-profile-step-grid">
            {steps.map((step) => (
              <article className="organization-profile-step" key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="organization-profile-cta">
          <div>
            <span className="organization-profile-eyebrow">Bertumbuh bersama kampus</span>
            <h2>Siap membawa kegiatan organisasi lebih jauh?</h2>
            <p>Buat akun organisasi dan mulai bangun koneksi dengan komunitas kampus.</p>
          </div>
          <Link to="/register?role=organization" className="organization-profile-register">
            Daftar sebagai organisasi
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </Link>
        </section>
      </main>

      <footer className="organization-profile-footer">
        <Link to="/" className="organization-profile-brand">
          <span className="material-symbols-outlined" aria-hidden="true">hub</span>
          <span>KOLABORIN</span>
        </Link>
        <span>Platform kolaborasi kampus</span>
      </footer>
    </div>
  );
}
