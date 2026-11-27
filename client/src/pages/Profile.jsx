import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

function resizeProfileImage(file) {
  const imageUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Foto tidak dapat diproses.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('File foto tidak dapat dibaca.'));
    };
    image.src = imageUrl;
  });
}

export default function Profile() {
  const { user, extra, refreshProfile } = useAuth();
  const [allBadges, setAllBadges] = useState([]);
  const [badgeError, setBadgeError] = useState('');
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [avatarDraft, setAvatarDraft] = useState(undefined);
  const [photoError, setPhotoError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'student') {
      api.get('/badges/mine')
        .then((response) => setAllBadges(response.data))
        .catch((err) => {
          console.error('Failed to load badges:', err);
          setBadgeError('Lencana belum dapat dimuat.');
        });
    }
  }, [user?.id, user?.role]);

  if (!user) return null;

  const isStudent = user.role === 'student';
  const roleLabels = { admin: 'Administrator', organization: 'Organisasi', student: 'Mahasiswa' };
  const avatarSource = avatarDraft !== undefined ? avatarDraft : user.avatar_data;

  const startEditing = () => {
    setNameDraft(user.name || '');
    setAvatarDraft(undefined);
    setPhotoError('');
    setSaveError('');
    setEditing(true);
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Pilih foto berformat JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Ukuran foto maksimal 5 MB.');
      return;
    }

    setPhotoError('');
    try {
      setAvatarDraft(await resizeProfileImage(file));
    } catch (err) {
      setPhotoError(err.message || 'Foto tidak dapat diproses.');
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    const payload = { name: nameDraft };
    if (avatarDraft !== undefined) payload.avatar_data = avatarDraft;
    try {
      await api.patch('/me', payload);
      await refreshProfile();
      setAvatarDraft(undefined);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Profil tidak dapat diperbarui.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setAvatarDraft(undefined);
    setPhotoError('');
    setSaveError('');
  };

  return (
    <main className="container profile-page">
      <section className="profile-hero">
        <div className="profile-identity">
          <div className="profile-avatar-large">
            {avatarSource ? <img src={avatarSource} alt="" /> : user.name?.trim().charAt(0).toUpperCase() || '?'}
          </div>
          <div className="profile-identity-copy">
            <span className="profile-status"><span aria-hidden="true">●</span> {roleLabels[user.role] || user.role}</span>
            <h1>{user.name}</h1>
            <p>{[user.major, user.faculty].filter(Boolean).join(' · ') || 'Akun Kolaborin'}</p>
            {user.email && <span className="profile-email">{user.email}</span>}
          </div>
        </div>
        <div className="profile-hero-actions">
          <button type="button" className="btn-secondary" onClick={editing ? cancelEditing : startEditing}>
            {editing ? 'Batal' : 'Edit profil'}
          </button>
          {isStudent && <Link to="/leaderboard" className="btn-secondary">Lihat peringkat →</Link>}
        </div>
        {isStudent && (
          <div className="profile-metrics">
            <article><span>Total Kolaborin XP</span><strong>⭐ {user.total_points ?? 0}</strong></article>
            <article><span>Peringkat kampus</span><strong>#{extra.rank > 0 ? extra.rank : '—'}</strong></article>
            <article><span>Lencana aktif</span><strong>🏅 {extra.badges.length}</strong></article>
            <article><span>Keikutsertaan study group</span><strong>{user.groups_joined_count ?? 0}</strong></article>
          </div>
        )}
      </section>

      {editing && (
        <form className="profile-panel profile-edit-form" onSubmit={handleSaveProfile}>
          <label>
            <span>Nama tampilan</span>
            <input
              required
              maxLength={100}
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
            />
          </label>
          <label>
            <span>Foto profil</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
            <small>JPG, PNG, atau WebP; maksimal 5 MB. Foto akan diperkecil otomatis.</small>
          </label>
          {avatarDraft && (
            <button type="button" className="profile-clear-photo" onClick={() => setAvatarDraft(null)}>
              Hapus foto pilihan
            </button>
          )}
          {photoError && <p className="alert-error" role="alert">{photoError}</p>}
          {saveError && <p className="alert-error" role="alert">{saveError}</p>}
          <button type="submit" className="btn-primary" disabled={saving || !nameDraft.trim()}>
            {saving ? 'Menyimpan…' : 'Simpan profil'}
          </button>
        </form>
      )}

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
