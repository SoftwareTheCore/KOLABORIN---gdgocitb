import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function Party() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchGroups = async () => {
    try {
      const url = subjectFilter ? `/groups?subject=${encodeURIComponent(subjectFilter)}` : '/groups';
      const res = await api.get(url);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [subjectFilter]);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const handleJoin = async (groupId) => {
    try {
      const res = await api.post(`/groups/${groupId}/join`);
      showToast(res.data.points?.awarded > 0 ? `+${res.data.points.awarded} points earned! 🎉` : 'Joined group successfully!');
      refreshProfile();
      fetchGroups();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not join group');
    }
  };

  // Distinct subjects for filter
  const subjects = ['All', 'Database Systems', 'Calculus', 'Data Structures', 'Linear Algebra', 'Thermodynamics', 'Software Engineering'];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredGroups = groups.filter((group) => {
    if (!normalizedSearch) return true;
    return [group.title, group.subject, group.description, group.creator_name, group.location_name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch));
  });
  const availableSeats = groups.reduce(
    (total, group) => total + Math.max(0, Number(group.max_members) - Number(group.member_count)),
    0
  );

  return (
    <div className="container open-party-page">
      {toast && <div className="toast-pill">{toast}</div>}

      <section className="open-party-hero">
        <div>
          <span className="eyebrow">Kampus ITB · Open Party</span>
          <h1>Temukan teman belajar sefrekuensi</h1>
          <p>Cari sesi belajar, gabung meja yang tersedia, atau buka ruang belajarmu sendiri.</p>
        </div>
        <Link to="/groups/new" className="btn-primary">
          ＋ Buat Open Party
        </Link>
      </section>

      <div className="open-party-stats">
        <div><span>Sesi tersedia</span><strong>{groups.length}</strong></div>
        <div><span>Kursi kosong</span><strong>{availableSeats}</strong></div>
        <div><span>Lokasi kampus</span><strong>{new Set(groups.map((group) => group.location_name).filter(Boolean)).size}</strong></div>
      </div>

      <section className="open-party-filters">
        <label className="open-party-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Cari mata kuliah, topik, host, atau lokasi..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <div className="filter-scroll open-party-subjects">
        {subjects.map(s => {
          const isSelected = (s === 'All' && !subjectFilter) || subjectFilter === s;
          return (
            <button
              key={s}
              onClick={() => setSubjectFilter(s === 'All' ? '' : s)}
              className={isSelected ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}
            >
              {s === 'All' ? 'Semua topik' : s}
            </button>
          );
        })}
        </div>
      </section>

      {loading ? (
        <p className="empty-state">Memuat sesi belajar...</p>
      ) : filteredGroups.length === 0 ? (
        <div className="empty-state open-party-empty">
          <h3>{groups.length ? 'Tidak ada sesi yang cocok' : 'Belum ada sesi belajar'}</h3>
          <p>{groups.length ? 'Coba kata kunci atau topik lain.' : 'Jadilah yang pertama membuka meja belajar di kampus.'}</p>
          <Link to="/groups/new" className="btn-primary" style={{ marginTop: '1rem' }}>
            Buat Open Party
          </Link>
        </div>
      ) : (
        <div className="party-grid open-party-grid">
          {filteredGroups.map(g => {
            const percent = Math.min(100, (g.member_count / g.max_members) * 100);
            return (
              <article key={g.id} className="party-card open-party-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="tag-subject">{g.subject}</span>
                  <span className={`status-badge status-${g.status === 'open' ? 'verified' : 'pending'}`}>
                    {g.status.toUpperCase()}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{g.title}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem', flex: 1 }}>
                  {g.description || 'No description provided.'}
                </p>

                <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>📍 <strong>{g.location_name}</strong></span>
                  <span>🕒 {new Date(g.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span>👤 Host: {g.creator_name}</span>
                </div>

                {/* Member Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--muted)' }}>
                    <span>Members</span>
                    <span><strong>{g.member_count}</strong> / {g.max_members}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/groups/${g.id}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
                    Open Space
                  </Link>
                  {g.is_member ? (
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', color: 'var(--ok)', fontWeight: 600, fontSize: '0.85rem' }}>
                      ✓ Joined
                    </span>
                  ) : g.status === 'full' ? (
                    <button disabled className="btn-secondary" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
                      Full
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(g.id)}
                      className="btn-primary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Join (+5 pts)
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
