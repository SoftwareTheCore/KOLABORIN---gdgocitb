import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function Profile() {
  const { user, extra, refreshProfile } = useAuth();
  const [allBadges, setAllBadges] = useState([]);
  const [badgeError, setBadgeError] = useState('');

  useEffect(() => {
    refreshProfile();
    if (user?.role === 'student') {
      api.get('/badges/mine')
        .then((response) => setAllBadges(response.data))
        .catch((err) => {
          console.error('Failed to load badges:', err);
          setBadgeError('Lencana belum dapat dimuat.');
        });
    }
  }, [user]);

  if (!user) return null;

  const isStudent = user.role === 'student';
  const roleLabels = { admin: 'Administrator', organization: 'Organisasi', student: 'Mahasiswa' };

  return (
    <main className="container profile-page">
      <section className="profile-hero">
        <div className="profile-identity">
          <div className="profile-avatar-large">{user.name?.trim().charAt(0).toUpperCase() || '?'}</div>
          <div className="profile-identity-copy">
            <span className="profile-status"><span aria-hidden="true">●</span> {roleLabels[user.role] || user.role}</span>
            <h1>{user.name}</h1>
            <p>{[user.major, user.faculty].filter(Boolean).join(' · ') || 'Akun Kolaborin'}</p>
            {user.email && <span className="profile-email">{user.email}</span>}
          </div>
        </div>
        <Link to="/leaderboard" className="btn-secondary">Lihat peringkat →</Link>
        {isStudent && (
          <div className="profile-metrics">
            <article><span>Total Kolaborin XP</span><strong>⭐ {user.total_points ?? 0}</strong></article>
            <article><span>Peringkat kampus</span><strong>#{extra.rank > 0 ? extra.rank : '—'}</strong></article>
            <article><span>Lencana aktif</span><strong>🏅 {extra.badges.length}</strong></article>
          </div>
        )}
      </section>

      {isStudent ? (
        <div className="profile-content-grid">
          <section className="profile-panel profile-badges-panel">
            <div className="profile-section-heading">
              <div>
                <span className="eyebrow">Pencapaian</span>
                <h2>Badge Trophy Vault</h2>
              </div>
              <span className="study-room-pill">{allBadges.length} lencana</span>
            </div>
            {badgeError ? (
              <p className="empty-state compact-empty">{badgeError}</p>
            ) : allBadges.length === 0 ? (
              <div className="profile-empty-badges">
                <span aria-hidden="true">🏅</span>
                <h3>Perjalananmu baru dimulai</h3>
                <p>Jawab pertanyaan di study group dan kumpulkan kontribusi untuk memperoleh lencana pertamamu.</p>
                <Link to="/party" className="btn-secondary">Temukan study group</Link>
              </div>
            ) : (
              <div className="profile-badge-grid">
                {allBadges.map((badge) => (
                  <article className="profile-badge-card" key={badge.id}>
                    <span className={`profile-badge-icon ${badge.status === 'approved' ? 'approved' : 'pending'}`} aria-hidden="true">✦</span>
                    <div>
                      <div className="profile-badge-title">
                        <strong>{badge.name}</strong>
                        <span className={`status-badge status-${badge.status === 'approved' ? 'verified' : 'pending'}`}>
                          {badge.status === 'approved' ? 'TERVERIFIKASI' : 'MENUNGGU'}
                        </span>
                      </div>
                      <p>{badge.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="profile-panel profile-limits-panel">
            <div className="profile-section-heading">
              <div>
                <span className="eyebrow">Progres harian</span>
                <h2>Batas XP hari ini</h2>
              </div>
            </div>
            <p className="profile-panel-description">Batas perolehan poin diperbarui setiap tengah malam waktu Jakarta.</p>
            <div className="profile-caps-list">
              {Object.entries(extra.todayCaps).map(([action, info]) => {
                const percent = info.cap > 0 ? Math.min(100, (info.earned / info.cap) * 100) : 0;
                const isCapped = info.remaining <= 0;
                return (
                  <article className="profile-cap-item" key={action}>
                    <div className="profile-cap-label">
                      <strong>{action.replace(/_/g, ' ')}</strong>
                      <span>{info.earned} / {info.cap} XP</span>
                    </div>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      aria-label={`${action.replace(/_/g, ' ')}: ${info.earned} dari ${info.cap} XP`}
                      aria-valuemin={0}
                      aria-valuemax={info.cap}
                      aria-valuenow={info.earned}
                    >
                      <div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: isCapped ? 'var(--ok)' : 'var(--primary-container)' }} />
                    </div>
                    <small>{isCapped ? 'Batas harian tercapai' : `Sisa ${info.remaining} XP`}</small>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>
      ) : (
        <section className="profile-panel profile-account-panel">
          <span className="eyebrow">Informasi akun</span>
          <h2>{roleLabels[user.role] || user.role}</h2>
          <p>Profil ini menggunakan data akun yang terdaftar di Kolaborin.</p>
        </section>
      )}
    </main>
  );
}
